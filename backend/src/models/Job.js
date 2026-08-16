const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  requirements: [{ type: String }],
  skills:       [{ type: String }],
  location:     { type: String, default: '' },
  salary:       { type: String, default: '' },
  type:         { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'], default: 'full-time' },
  recruiter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:       { type: String, enum: ['active', 'closed'], default: 'active' },
  closingDate:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
