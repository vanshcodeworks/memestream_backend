const mongoose = require('mongoose');

const MemeSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true
  },
  caption: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Wholesome', 'Relatable', 'Political', 'Dank', 'Dark', 'Tech', 'Animals', 'Sports']
  },
  tags: [{
    type: String,
    trim: true
  }],
  cloudinaryId: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    type: String // Store user IDs who liked this meme
  }],
  reportCount: {
    type: Number,
    default: 0
  },
  reportedBy: [{
    type: String, // Store user IDs who reported this meme
    reason: String
  }],
  userId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for checking if meme is trending
MemeSchema.virtual('isTrending').get(function() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return this.likes >= 50 && this.createdAt >= oneWeekAgo;
});

// Index for efficient queries
MemeSchema.index({ createdAt: -1 });
MemeSchema.index({ likes: -1 });
MemeSchema.index({ category: 1 });
MemeSchema.index({ tags: 1 });

const Meme = mongoose.model('Meme', MemeSchema);

module.exports = Meme;
