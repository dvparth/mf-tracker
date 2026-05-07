const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const mfRoutes = require('./routes/mf');
const userHoldingsRoutes = require('./routes/userHoldings');
const schemesRoutes = require('./routes/schemes');
const portfolioInsightRoutes = require('./routes/portfolioInsight');
const llmRoutes = require('./routes/llm');
const setupPassport = require('./auth/passport');
const cookieParser = require('cookie-parser');
const { requireAuth } = require('./middleware/authMiddleware');

const app = express();
// When running behind a proxy (Render, Heroku, etc.) trust the first proxy so
// secure cookies and req.protocol work as expected. Only enable in production.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}
// Configure CORS to allow the frontend to send/receive cookies for auth.
// Support both local development and the deployed frontend by allowing
// a small whitelist and echoing allowed origins.
const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000', 'https://localhost:3000'].filter(Boolean);
const corsOptions = {
  origin: function (origin, callback) {
    console.log('[CORS] Request origin:', origin);
    // Allow null/file origins using wildcard so local HTML files are accepted.
    if (!origin || origin === 'null' || origin === 'file://' || (origin && origin.startsWith('file://'))) {
      console.log('[CORS] Allowing null/file origin as wildcard');
      return callback(null, '*');
    }

    // In development, allow all localhost origins (any port, http or https).
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow explicit configured origins.
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow Netlify-hosted frontend previews and sites (*.netlify.app)
    try {
      const lc = origin.toLowerCase();
      if (lc.endsWith('.netlify.app')) {
        return callback(null, true);
      }
    } catch (e) {
      // ignore
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
// Ensure preflight requests are handled
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());
// Simple request logger to help debug routing on hosted platforms (visible in service logs)
app.use((req, res, next) => {
  console.log(`[req] ${Date.now()} ${req.method} ${req.originalUrl}`);
  next();
});
// Initialize passport strategies
setupPassport();
app.use(require('passport').initialize());

// Auth routes
app.use('/auth', authRoutes);

// Schemes metadata and user holdings
app.use('/schemes', schemesRoutes);
app.use('/user/holdings', userHoldingsRoutes);

// Public portfolio insight endpoint. This is intentionally left open.
app.use('/api/portfolioInsight', portfolioInsightRoutes);

app.use('/api/mf', mfRoutes);

app.use('/api/llm', llmRoutes);

// Simple health and root endpoints to help verify the server is running (useful in prod)
app.get('/health', (req, res) => {
  console.log('[health] /health requested');
  return res.json({
    status: 'ok',
    service: 'github-llm-service',
    timestamp: new Date().toISOString(),
    model: 'gpt-4o-mini'
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

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
