const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Uploads an image to Cloudinary
 * @param {String} base64Image - Base64 encoded image
 * @param {String} folder - Cloudinary folder to store the image
 * @returns {Promise<Object>} - Cloudinary upload response
 */
const uploadImage = async (base64Image, folder = 'memestream') => {
  try {
    // Remove data:image/jpeg;base64, part if present
    const imageData = base64Image.includes('base64')
      ? base64Image.substring(base64Image.indexOf(',') + 1)
      : base64Image;
    
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${imageData}`, {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    return {
      url: result.secure_url,
      public_id: result.public_id
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
};

/**
 * Deletes an image from Cloudinary
 * @param {String} publicId - Public ID of the image to delete
 * @returns {Promise<Object>} - Cloudinary deletion response
 */
const deleteImage = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage
};
