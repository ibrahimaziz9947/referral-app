const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Route for uploading proof image
router.post('/proof', protect, uploadController.uploadProof);

module.exports = router; 