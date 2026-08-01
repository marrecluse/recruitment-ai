const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action:   { type: String, required: true },
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resource: { type: String },
  detail:   { type: String },
  ip:       { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditSchema);
