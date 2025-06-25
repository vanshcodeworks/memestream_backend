const Meme = require('../models/Meme');
const { uploadImage, deleteImage } = require('../config/cloudinary');
const axios = require('axios');
const { generateImageCaption, getMockCaption } = require('../utils/gemini');

/**
 * Get all memes with filtering and sorting
 * @route GET /api/memes
 */
exports.getMemes = async (req, res) => {
  try {
    const { 
      category, 
      tag, 
      sort = 'newest',
      page = 1,
      limit = 9
    } = req.query;
    
    // Convert page and limit to numbers
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Validate pagination params
    if (isNaN(pageNum) || isNaN(limitNum) || pageNum < 1 || limitNum < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid pagination parameters' 
      });
    }
    
    // Calculate skip for pagination
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    
    // Set sort options
    let sortOption = {};
    switch(sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'mostLiked':
        sortOption = { likes: -1 };
        break;
      case 'newest':
      default:
        sortOption = { createdAt: -1 };
    }
    
    // Execute query with pagination
    const memes = await Meme.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);
      
    res.json(memes);
  } catch (error) {
    console.error('Error fetching memes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new meme
 * @route POST /api/memes
 */
exports.createMeme = async (req, res) => {
  try {
    const { imageData, caption, category, tags, userId } = req.body;
    
    if (!imageData || !caption || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide image, caption, and category' 
      });
    }
    
    // Upload image to Cloudinary
    const cloudinaryResponse = await uploadImage(imageData);
    
    // Create new meme in database
    const newMeme = new Meme({
      imageUrl: cloudinaryResponse.url,
      caption,
      category,
      tags: tags || [],
      cloudinaryId: cloudinaryResponse.public_id,
      userId: userId || 'anonymous'
    });
    
    await newMeme.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Meme created successfully',
      meme: newMeme
    });
  } catch (error) {
    console.error('Error creating meme:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get trending memes
 * @route GET /api/trending
 */
exports.getTrendingMemes = async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;
    
    // Calculate date based on timeframe
    const date = new Date();
    switch(timeframe) {
      case 'day':
        date.setDate(date.getDate() - 1);
        break;
      case 'month':
        date.setMonth(date.getMonth() - 1);
        break;
      case 'week':
      default:
        date.setDate(date.getDate() - 7);
    }
    
    // Find memes created after the specified date with at least 50 likes
    const trendingMemes = await Meme.find({
      createdAt: { $gte: date },
      likes: { $gte: 50 }
    })
    .sort({ likes: -1 })
    .limit(20);
    
    res.json(trendingMemes);
  } catch (error) {
    console.error('Error fetching trending memes:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Toggle like on a meme
 * @route POST /api/memes/:id/like
 */
exports.toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const meme = await Meme.findById(id);
    
    if (!meme) {
      return res.status(404).json({ success: false, message: 'Meme not found' });
    }
    
    // Check if user already liked the meme
    const alreadyLiked = meme.likedBy.includes(userId);
    
    if (alreadyLiked) {
      // Remove like
      meme.likes = Math.max(0, meme.likes - 1);
      meme.likedBy = meme.likedBy.filter(id => id !== userId);
    } else {
      // Add like
      meme.likes += 1;
      meme.likedBy.push(userId);
    }
    
    await meme.save();
    
    res.json({ 
      success: true, 
      liked: !alreadyLiked,
      likes: meme.likes
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Report a meme
 * @route POST /api/memes/:id/report
 */
exports.reportMeme = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const meme = await Meme.findById(id);
    
    if (!meme) {
      return res.status(404).json({ success: false, message: 'Meme not found' });
    }
    
    // Check if user already reported this meme
    const alreadyReported = meme.reportedBy.some(report => report.includes(userId));
    
    if (!alreadyReported) {
      meme.reportCount += 1;
      meme.reportedBy.push({ userId, reason: reason || 'Not specified' });
      await meme.save();
    }
    
    res.json({ 
      success: true, 
      message: 'Meme reported successfully'
    });
  } catch (error) {
    console.error('Error reporting meme:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a meme
 * @route DELETE /api/memes/:id
 */
exports.deleteMeme = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const meme = await Meme.findById(id);
    
    if (!meme) {
      return res.status(404).json({ success: false, message: 'Meme not found' });
    }
    
    // Check if the requester is the creator of the meme
    if (meme.userId !== userId && userId !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not authorized to delete this meme' 
      });
    }
    
    // Delete image from Cloudinary
    await deleteImage(meme.cloudinaryId);
    
    // Delete meme from database
    await Meme.findByIdAndDelete(id);
    
    res.json({ success: true, message: 'Meme deleted successfully' });
  } catch (error) {
    console.error('Error deleting meme:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate caption using Gemini AI
 * @route POST /api/generate-caption
 */
exports.generateCaption = async (req, res) => {
  try {
    const { imageData, tags = [] } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }
    
    // If you have a Gemini API key in your backend
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      // Return a mock caption if no API key
      return res.json({
        success: true,
        caption: getMockCaption(tags)
      });
    }
    
    // Generate caption using the utility
    const caption = await generateImageCaption(imageData, tags);
    
    res.json({
      success: true,
      caption
    });
    
  } catch (error) {
    console.error('Caption generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate caption',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
//     const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
//     // Format image data properly
//     const formattedImage = imageData.includes('data:image') 
//       ? imageData.split(',')[1] 
//       : imageData;
    
//     // Prepare image part for the API
//     const imagePart = {
//       inlineData: {
//         data: formattedImage,
//         mimeType: "image/jpeg"
//       }
//     };
    
//     // Prepare prompt
//     let promptText = "Generate a funny meme caption for this image. Keep it short, witty, and shareable.";
//     if (tags.length > 0) {
//       promptText += ` The image relates to: ${tags.join(', ')}.`;
//     }
    
//     // Create the final prompt with text and image
//     const prompt = [promptText, imagePart];
    
//     // Generate content
//     const result = await model.generateContent({
//       contents: [{ role: "user", parts: prompt }],
//       generationConfig: {
//         temperature: 0.8,
//         maxOutputTokens: 100,
//       }
//     });
    
//     // Get the response
//     const response = await result.response;
//     const generatedText = response.text() || "Failed to generate caption";
    
//     res.json({
//       success: true,
//       caption: generatedText
//     });
    
//   } catch (error) {
//     console.error('Caption generation error:', error);
    
//     // More detailed error handling
//     let errorMessage = 'Failed to generate caption';
    
//     if (error.message && error.message.includes('API key')) {
//       errorMessage = 'Invalid API key. Please check your Gemini API key.';
//     } else if (error.message && error.message.includes('quota')) {
//       errorMessage = 'API quota exceeded. Please try again later.';
//     }
    
//     res.status(500).json({
//       success: false,
//       message: errorMessage,
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
