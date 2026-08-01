const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Resume = require('../models/Resume');
const Match = require('../models/Match');

const signAccess  = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
const signRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password, role } = req.body;
  if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already in use' });
  const user = await User.create({ name, email, password, role });
  await AuditLog.create({ action: 'REGISTER', user: user._id, ip: req.ip });
  res.status(201).json({ user, accessToken: signAccess(user._id) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const refresh = signRefresh(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken: refresh });
  res.cookie('refreshToken', refresh, { httpOnly: true, sameSite: 'strict', maxAge: 7*24*60*60*1000 });
  res.json({ user, accessToken: signAccess(user._id) });
};

exports.refresh = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(id);
    if (!user || user.refreshToken !== token) return res.status(401).json({ error: 'Invalid refresh token' });
    res.json({ accessToken: signAccess(id) });
  } catch { res.status(401).json({ error: 'Expired refresh token' }); }
};

exports.logout = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

// GDPR right-to-erasure
exports.deleteAccount = async (req, res) => {
  const id = req.user._id;
  await Resume.deleteMany({ candidate: id });
  await Match.deleteMany({ candidate: id });
  await AuditLog.create({ action: 'GDPR_ERASE', user: id, ip: req.ip });
  await User.findByIdAndDelete(id);
  res.clearCookie('refreshToken');
  res.json({ message: 'Account and all data deleted (GDPR Art.17)' });
};
