const Notification = require('../models/Notification');

// GET /api/notifications — last 30 for current user
exports.getNotifications = async (req, res) => {
  const notes = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 }).limit(30).lean();
  const unread = notes.filter(n => !n.read).length;
  res.json({ notifications: notes, unread });
};

// PATCH /api/notifications/read-all — mark all read
exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ ok: true });
};

// PATCH /api/notifications/:id/read — mark one read
exports.markRead = async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ ok: true });
};

// Internal helper — called from other controllers
exports.createNotification = async ({ userId, type, title, message, meta = {} }) => {
  try {
    await Notification.create({ user: userId, type, title, message, meta });
  } catch (err) {
    console.error('[notifications] create failed:', err.message);
  }
};
