const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes   = require('./routes/auth.routes');
const jobRoutes    = require('./routes/job.routes');
const resumeRoutes = require('./routes/resume.routes');
const matchRoutes  = require('./routes/match.routes');
const adminRoutes  = require('./routes/admin.routes');
const adminSeed    = require('./routes/admin.seed');
const applicationRoutes = require('./routes/application.routes');
const analyticsRoutes   = require('./routes/analytics.routes');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: 'Too many requests' }));

app.use('/api/auth',       authRoutes);
app.use('/api/jobs',       jobRoutes);
app.use('/api/resumes',    resumeRoutes);
app.use('/api/matches',    matchRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/admin-seed', adminSeed);
app.use('/api/applications', applicationRoutes);
app.use('/api/analytics',    analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
