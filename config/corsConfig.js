/**
 * CORS Configuration for MemeStream API
 * This handles Cross-Origin Resource Sharing settings
 */

// List of allowed origins
const allowedOrigins = [
  'https://memestream-ten.vercel.app',
  'https://memestream.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

// CORS options for the Express cors middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed or matches *.vercel.app
    if (allowedOrigins.indexOf(origin) !== -1 || origin.match(/\.vercel\.app$/)) {
      callback(null, true);
    } else {
      // For debugging only - in production you might want to just reject
      console.log(`Origin ${origin} not allowed by CORS`);
      callback(null, true); // Allow anyway for now, but log it
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-ID'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 204,
  maxAge: 86400 // Cache preflight request results for 24 hours
};

module.exports = { corsOptions, allowedOrigins };
