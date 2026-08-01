const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  job:        { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  resume:     { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
  candidate:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score:      { type: Number, required: true, min: 0, max: 1 },
  matchedSkills:  [String],
  missingSkills:  [String],
  explanation:    { type: String },
  rank:           { type: Number },
}, { timestamps: true });

matchSchema.index({ job: 1, score: -1 });

module.exports = mongoose.model('Match', matchSchema);
