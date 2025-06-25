const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/db');

// Import routes
const memeRoutes = require('./routes/memeRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database
try {
  connectDB();
  console.log('MongoDB connection established');
} catch (error) {
  console.error('MongoDB connection failed:', error.message);
}

// Define CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'https://memestream-ten.vercel.app',
      'https://memestream.vercel.app',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.match(/\.vercel\.app$/)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'User-ID'],
  credentials: false,
  maxAge: 86400 // Cache preflight request for 24 hours
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight OPTIONS requests
app.options('*', cors(corsOptions));

// Regular middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Set CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-ID');
  next();
});

// API status endpoint
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to MemeStream API',
    status: 'online',
    version: '1.0.0',
    cors: 'enabled'
  });
});

// Use meme routes
app.use('/api', memeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ MemeStream server running on port ${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});

//   const trending = [
//     {
//       id: '4',
//       imageUrl: 'https://via.placeholder.com/500x400?text=Trending+1',
//       caption: 'When you realize the deadline was yesterday',
//       category: 'Relatable',
//       tags: ['deadline', 'panic', 'worklife'],
//       likes: 543
//     },
//     {
//       id: '5',
//       imageUrl: 'https://via.placeholder.com/500x400?text=Trending+2',
//       caption: '3 AM thoughts be like',
//       category: 'Dank',
//       tags: ['3am', 'thoughts', 'sleep'],
//       likes: 782
//     }
//   ];
  
//   res.json(trending);
// });

// // AI Caption generation endpoint
// app.post('/api/generate-caption', async (req, res) => {
//   try {
//     const { imageData, tags = [] } = req.body;
    
//     if (!imageData) {
//       return res.status(400).json({ success: false, message: 'Image data is required' });
//     }
    
//     // If you have a Gemini API key in your backend
//     const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
//     if (!GEMINI_API_KEY) {
//       // Return a mock caption if no API key
//       const mockCaptions = [
//         "When you try your best but still fail spectacularly",
//         "That awkward moment when you realize...",
//         "Nobody: Absolutely nobody: Me at 3 AM:",
//         "My brain during an important meeting:",
//         "How I think I look vs. How I actually look:"
//       ];
      
//       return res.json({
//         success: true,
//         caption: mockCaptions[Math.floor(Math.random() * mockCaptions.length)]
//       });
//     }
    
//     // Format image data properly
//     const formattedImage = imageData.includes('data:image') 
//       ? imageData.split(',')[1] 
//       : imageData;
      
//     // Prepare prompt
//     let prompt = "Generate a funny meme caption for this image. Keep it short, witty, and shareable.";
//     if (tags.length > 0) {
//       prompt += ` The image relates to: ${tags.join(', ')}.`;
//     }
    
//     const response = await axios.post(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_API_KEY}`,
//       {
//         contents: [{
//           parts: [
//             { text: prompt },
//             {
//               inline_data: {
//                 mime_type: "image/jpeg",
//                 data: formattedImage
//               }
//             }
//           ]
//         }],
//         generationConfig: {
//           temperature: 0.8,
//           maxOutputTokens: 100,
//         }
//       },
//       { headers: { 'Content-Type': 'application/json' } }
//     );
    
//     const generatedText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
//                            "Failed to generate caption";
    
//     res.json({
//       success: true,
//       caption: generatedText
//     });
    
//   } catch (error) {
//     console.error('Caption generation error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to generate caption',
//       error: error.message
//     });
//   }
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
