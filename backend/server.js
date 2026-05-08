const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const mfRoutes = require('./routes/mf');
const userHoldingsRoutes = require('./routes/userHoldings');
const schemesRoutes = require('./routes/schemes');
const portfolioInsightRoutes = require('./routes/portfolioInsight');
const setupPassport = require('./auth/passport');
const cookieParser = require('cookie-parser');
const { requireAuth } = require('./middleware/authMiddleware');
const { generalLimiter, authLimiter, dataLimiter, aiLimiter } = require('./middleware/rateLimits');

const app = express();
// When running behind a proxy (Render, Heroku, etc.) trust the first proxy so
// secure cookies and req.protocol work as expected. Only enable in production.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
function isLocalDevelopmentOrigin(origin) {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const parsed = new URL(origin);
    return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  } catch (e) {
    return false;
  }
}

// Configure CORS to allow credentialed requests only from exact trusted origins.
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://localhost:3000']
  .filter(Boolean)
  .map((origin) => origin.replace(/\/$/, ''));
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin) || isLocalDevelopmentOrigin(normalizedOrigin)) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(generalLimiter);
app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
// Simple request logger to help debug routing on hosted platforms (visible in service logs)
app.use((req, res, next) => {
  console.log(`[req] ${Date.now()} ${req.method} ${req.path}`);
  next();
});
// Initialize passport strategies
setupPassport();
app.use(require('passport').initialize());

// Auth routes
app.use('/auth', authLimiter, authRoutes);

// Schemes metadata and user holdings
app.use('/schemes', dataLimiter, schemesRoutes);
app.use('/user/holdings', userHoldingsRoutes);

app.use('/api/portfolioInsight', requireAuth, aiLimiter, portfolioInsightRoutes);

app.use('/api/mf', dataLimiter, mfRoutes);

// Simple health and root endpoints to help verify the server is running (useful in prod)
app.get('/health', (req, res) => {
  console.log('[health] /health requested');
  return res.json({
    status: 'ok',
    service: 'mf-tracker-api',
    timestamp: new Date().toISOString(),
    aiProvider: 'github'
  });
});
app.get('/', (req, res) => {
  console.log('[root] / requested');
  return res.send('MF Tracker backend');
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Require a MongoDB connection for DB-backed endpoints (schemes, users). Fail fast if missing.
if (!MONGO_URI) {
  console.error('MONGO_URI not set — this app requires a MongoDB connection for scheme metadata and user data. Exiting.');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    // Start the HTTP server only after MongoDB has successfully connected
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
