const mongoose = require('mongoose');

const STAGES = ['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'];

const applicationSchema = new mongoose.Schema({
  candidate:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  job:            { type: mongoose.Schema.Types.ObjectId, ref: 'Job',     required: true },
  resume:         { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  match:          { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
  stage:          { type: String, enum: STAGES, default: 'applied' },
  score:          { type: Number, default: 0 },   // cached AI score
  matchedSkills:  [String],
  missingSkills:  [String],
  recruiterNotes:  { type: String, default: '' },
  interviewDate:   { type: Date, default: null },
  stageHistory:   [{ stage: String, changedAt: { type: Date, default: Date.now } }],
}, { timestamps: true });

applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, stage: 1, score: -1 });

module.exports = mongoose.model('Application', applicationSchema);
