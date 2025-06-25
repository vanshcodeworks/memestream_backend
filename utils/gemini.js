const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates a caption for an image using Google's Gemini AI
 * @param {string} imageData - Base64 encoded image data
 * @param {Array} tags - Optional tags to help guide caption generation
 * @returns {Promise<string>} - The generated caption
 */
const generateImageCaption = async (imageData, tags = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    
    // Initialize the Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini Pro Vision model which handles images
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Format image data properly, removing any prefix
    const formattedImage = imageData.includes('data:image') 
      ? imageData.split(',')[1] 
      : imageData;
    
    // Prepare prompt text
    let promptText = "What's a funny caption for this meme? give me just one liners sharable no mor eother content just in one line nothing else";
    if (tags.length > 0) {
      promptText += ` Consider these themes: ${tags.join(', ')}.`;
    }
    
    // Create prompt parts array correctly
    // Important: The text prompt needs to be a separate part from the image
    const parts = [
      { text: promptText },
      {
        inlineData: {
          data: formattedImage,
          mimeType: "image/jpeg"
        }
      }
    ];
    
    // Set generation config
    const generationConfig = {
      temperature: 0.8,
      maxOutputTokens: 100,
    };
    
    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig
    });
    
    // Extract text from response
    const response = await result.response;
    return response.text() || "Failed to generate caption";
    
  } catch (error) {
    console.error('Error generating caption with Gemini:', error);
    
    // Handle common errors
    if (error.message && error.message.includes('API key')) {
      throw new Error('Invalid Gemini API key');
    }
    
    if (error.message && error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    }
    
    throw new Error(`Failed to generate caption: ${error.message}`);
  }
};

/**
 * Fallback caption generator when API is not available
 */
const getMockCaption = (tags = []) => {
  const captions = [
    "When you try your best but still fail spectacularly",
    "That awkward moment when you realize...",
    "Nobody: Absolutely nobody: Me at 3 AM:",
    "My brain during an important meeting:",
    "How I think I look vs. How I actually look:",
    "When someone explains something and asks if you understand",
    "Me pretending to be productive while scrolling memes"
  ];
  
  // If tags provided, try to generate a more relevant caption
  if (tags.length > 0) {
    if (tags.includes('coding') || tags.includes('programming')) {
      return "When your code works on the first try and you're both happy and suspicious";
    } else if (tags.includes('food')) {
      return "Me explaining why I need to order food when there's food at home";
    } else if (tags.includes('pets') || tags.includes('cats') || tags.includes('dogs')) {
      return "When your pet does something cute but stops the moment you grab your camera";
    }
  }
  
  // Return a random caption
  return captions[Math.floor(Math.random() * captions.length)];
};

module.exports = {
  generateImageCaption,
  getMockCaption
};
