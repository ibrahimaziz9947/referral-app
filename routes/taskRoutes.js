const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.post('/', protect, admin, taskController.createTask);
router.get('/admin', protect, admin, taskController.getAllTasks);
router.put('/:id', protect, admin, taskController.updateTask);
router.delete('/:id', protect, admin, taskController.deleteTask);
router.get('/submissions', protect, admin, taskController.getAllSubmissions);
router.put('/submissions/:id/review', protect, admin, taskController.reviewSubmission);

// User routes
router.get('/', protect, taskController.getAllTasks);
router.post('/submit', protect, taskController.submitTask);
router.get('/my-submissions', protect, taskController.getUserSubmissions);

module.exports = router; 