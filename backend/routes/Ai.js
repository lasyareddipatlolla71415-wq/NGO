const express = require("express");
const Submission = require("../models/Submission");
const { protect, adminOnly } = require("../middleware/Auth");
const Groq = require("groq-sdk");

const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/summary", protect, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    const filter = {};
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    const submissions = await Submission.find(filter);
    if (submissions.length === 0)
      return res.json({ summary: "No submissions found for the selected period.", insights: [] });

    const totalBeneficiaries = submissions.reduce((acc, s) => acc + s.beneficiaryCount, 0);
    const regionMap = {}, activityMap = {}, issuesList = [];
    const statusMap = { pending: 0, "in-progress": 0, completed: 0 };

    submissions.forEach((s) => {
      regionMap[s.region]       = (regionMap[s.region] || 0) + 1;
      activityMap[s.activityType] = (activityMap[s.activityType] || 0) + 1;
      if (s.issues) issuesList.push(s.issues);
      if (statusMap[s.status] !== undefined) statusMap[s.status]++;
    });

    const topRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0];
    const lowRegion = Object.entries(regionMap).sort((a, b) => a[1] - b[1])[0];

    const prompt = `
You are an NGO analytics assistant. Here is field data:
- Total Submissions: ${submissions.length}
- Total Beneficiaries: ${totalBeneficiaries}
- Activity Breakdown: ${JSON.stringify(activityMap)}
- Region Activity Count: ${JSON.stringify(regionMap)}
- Status Breakdown: ${JSON.stringify(statusMap)}
- Reported Issues (sample): ${issuesList.slice(0, 10).join("; ")}

Generate:
1. A concise executive summary (2-3 sentences).
2. A JSON array of 3-5 actionable insight strings like "Region X has low engagement".

Respond ONLY in this JSON format (no markdown):
{"summary": "...","insights": ["...","...","..."]}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });
    const rawText = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(rawText.replace(/```json|```/g, "").trim());

    res.json({
      summary: parsed.summary || "Summary not available.",
      insights: parsed.insights || [],
      stats: {
        totalSubmissions: submissions.length,
        totalBeneficiaries,
        regionMap, activityMap, statusMap,
        topRegion: topRegion?.[0],
        lowEngagementRegion: lowRegion?.[0],
      },
    });
  } catch (err) {
    console.error("AI summary error:", err);
    res.status(500).json({ message: "AI summary failed", error: err.message });
  }
});

module.exports = router;