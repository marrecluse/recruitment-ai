const router = require('express').Router();
const User = require('../models/User');

// POST /api/admin-seed — create first admin (only works if zero admins exist)
router.post('/', async (req, res) => {
  const { name, email, password, secretKey } = req.body;
  if (secretKey !== (process.env.ADMIN_SECRET || 'recruitai-admin-2024'))
    return res.status(403).json({ error: 'Invalid secret key' });
  const existing = await User.findOne({ role: 'admin' });
  if (existing) return res.status(409).json({ error: 'Admin already exists' });
  const admin = await User.create({ name, email, password, role: 'admin' });
  res.status(201).json({ message: 'Admin created', user: admin });
});

module.exports = router;
