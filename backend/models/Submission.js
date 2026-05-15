
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    worker:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workerName:       { type: String, required: true },
    workerEmail:      { type: String, required: true },
    region:           { type: String, required: true },
    activityType: { type: String, required: true },
    beneficiaryCount: { type: Number, required: true, min: 0 },
    beneficiaryType:  { type: String, required: true },
    description:      { type: String, required: true },
    issues:           { type: String, default: "" },
    location:         { type: String, required: true },
    date:             { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed"],
      default: "pending",
    },
    remark: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);