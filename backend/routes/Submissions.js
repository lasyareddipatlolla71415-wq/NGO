const express = require("express");
const Submission = require("../models/Submission");
const { protect, adminOnly } = require("../middleware/Auth");

const router = express.Router();

// Worker: Create submission
router.post("/", protect, async (req, res) => {
  try {
    const {
      region, activityType, beneficiaryCount, beneficiaryType,
      description, issues, location, date,
    } = req.body;
    const submission = await Submission.create({
      worker: req.user._id,
      workerName: req.user.name,
      workerEmail: req.user.email,
      region, activityType, beneficiaryCount,
      beneficiaryType, description, issues, location, date,
      status: "pending",
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Worker: Get own submissions
router.get("/my", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ worker: req.user._id })
      .sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Worker/Admin: Update status and remark
router.patch("/:id", protect, async (req, res) => {
  try {
    const submission = await Submission.findOne({ _id: req.params.id });
    if (!submission)
      return res.status(404).json({ message: "Submission not found" });
    if (
      req.user.role === "worker" &&
      submission.worker.toString() !== req.user._id.toString()
    )
      return res.status(403).json({ message: "Not authorized" });

    const { status, remark } = req.body;
    if (status) submission.status = status;
    if (remark !== undefined) submission.remark = remark;
    await submission.save();
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all submissions with filters
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const { region, status, activityType, search, startDate, endDate } = req.query;
    const filter = {};
    if (region)       filter.region = { $regex: region, $options: "i" };
    if (status)       filter.status = status;
    if (activityType) filter.activityType = activityType;
    if (search) {
      filter.$or = [
        { workerName:  { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location:    { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }
    const submissions = await Submission.find(filter).sort({ createdAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single submission detail
router.get("/:id", protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("worker", "name email region phone");
    if (!submission) return res.status(404).json({ message: "Not found" });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;