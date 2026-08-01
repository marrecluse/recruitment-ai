const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  candidate:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename:   { type: String, required: true },
  mimetype:   { type: String },
  status:     { type: String, enum: ['pending','processing','completed','failed'], default: 'pending' },
  errorMsg:   { type: String, default: null },
  parsedProfile: {
    name:        String,
    email:       String,
    phone:       String,
    skills:      [String],
    degrees:     [String],
    institutions:[String],
    jobTitles:   [String],
    companies:   [String],
    rawText:     String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Resume', resumeSchema);
