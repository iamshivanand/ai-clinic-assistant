require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const webhookRoutes = require('./routes/webhook');
const authRoutes = require('./routes/auth');
const onboardingRoutes = require('./routes/onboarding');
const chatRoutes = require('./routes/chat');
const prescriptionRoutes = require('./routes/prescription');
const paymentWebhookRoutes = require('./routes/paymentWebhook');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');

// Production environment sanity check
if (process.env.NODE_ENV === 'production') {
  const requiredEnv = [
    'MONGO_URI',
    'JWT_SECRET',
    'META_ACCESS_TOKEN',
    'META_PHONE_NUMBER_ID',
    'META_APP_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'RAZORPAY_WEBHOOK_SECRET'
  ];
  requiredEnv.forEach((key) => {
    if (!process.env[key]) {
      logger.error(`FATAL CONFIG ERROR: Required environment variable ${key} is missing in production!`);
    }
  });
}

// Initialize Workers
require('./workers/botWorker');
require('./workers/notificationWorker');

const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Optimization Middleware
app.use(compression()); // Gzip compression for all responses

// Global Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter Rate Limiting for Webhooks to prevent flooding
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 webhook calls per minute
  message: 'Too many webhook requests, slowing down...',
  standardHeaders: true,
  legacyHeaders: false,
});

// Specific Limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 1000, // Relaxed for tests/dev
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
app.use('/api/webhook', webhookLimiter);
app.use('/api/webhooks', webhookLimiter);


// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/prescription', prescriptionRoutes);
app.use('/api/webhooks', paymentWebhookRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Static files for PDFs
app.use('/prescriptions', express.static('public/prescriptions'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai-clinic-assistant', {
  maxPoolSize: 50, // Tuning for high concurrency
})
  .then(() => logger.info('MongoDB Connected successfully'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Error Handling (Must be last)
app.use(errorHandler);

// Start Server
const http = require('http');
const socketUtil = require('./utils/socket');
const server = http.createServer(app);
socketUtil.init(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => logger.info(`Backend server running on port ${PORT}`));
