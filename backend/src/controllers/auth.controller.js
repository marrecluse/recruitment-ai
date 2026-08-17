const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { sendPasswordResetEmail } = require('../services/email.service');
const Resume = require('../models/Resume');
const Match = require('../models/Match');

const signAccess  = id => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
const signRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password, role } = req.body;
  const safeRole = role === 'admin' ? 'candidate' : role;
  if (await User.findOne({ email })) return res.status(409).json({ error: 'Email already in use' });
  const user = await User.create({ name, email, password, role: safeRole });
  await AuditLog.create({ action: 'REGISTER', user: user._id, ip: req.ip });
  const refresh = signRefresh(user._id);
  await User.findByIdAndUpdate(user._id, { refreshToken: refresh });
  res.cookie('refreshToken', refresh, { httpOnly: true, sameSite: 'strict', maxAge: 7*24*60*60*1000 });
  res.status(201).json({ user, accessToken: signAccess(user._id) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.isActive) return res.status(403).json({ error: 'Account suspended' });
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

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.json({ message: 'If that email exists, a reset code has been sent.' });
  const token = crypto.randomBytes(3).toString('hex').toUpperCase();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  await User.findByIdAndUpdate(user._id, {
    passwordResetToken: token,
    passwordResetExpires: expires,
  });
  sendPasswordResetEmail({ to: user.email, name: user.name || user.email, resetCode: token, expiresIn: '15 minutes' }).catch(() => {});
  res.json({ message: 'If that email exists, a reset code has been sent.' });
};

exports.resetPassword = async (req, res) => {
  const { email, resetCode, newPassword } = req.body;
  if (!email || !resetCode || !newPassword)
    return res.status(400).json({ error: 'email, resetCode and newPassword are required' });
  if (newPassword.length < 8)
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const user = await User.findOne({
    email,
    passwordResetToken: resetCode.toUpperCase(),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) return res.status(400).json({ error: 'Invalid or expired reset code' });
  user.password = newPassword;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  user.refreshToken = null;
  await user.save();
  res.json({ message: 'Password updated successfully. Please log in.' });
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.deleteAccount = async (req, res) => {
  const id = req.user._id;
  await Resume.deleteMany({ candidate: id });
  await Match.deleteMany({ candidate: id });
  await AuditLog.create({ action: 'GDPR_ERASE', user: id, ip: req.ip });
  await User.findByIdAndDelete(id);
  res.clearCookie('refreshToken');
  res.json({ message: 'Account and all data deleted (GDPR Art.17)' });
};
