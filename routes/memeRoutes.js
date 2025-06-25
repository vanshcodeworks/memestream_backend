const express = require('express');
const router = express.Router();
const memeController = require('../controllers/memeController');

// GET all memes or filtered memes
router.get('/memes', memeController.getMemes);

// POST create new meme
router.post('/memes', memeController.createMeme);

// GET trending memes
router.get('/trending', memeController.getTrendingMemes);

// POST like/unlike a meme
router.post('/memes/:id/like', memeController.toggleLike);

// POST report a meme
router.post('/memes/:id/report', memeController.reportMeme);

// DELETE a meme
router.delete('/memes/:id', memeController.deleteMeme);

// POST generate caption
router.post('/generate-caption', memeController.generateCaption);

module.exports = router;
