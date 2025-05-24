const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investmentController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes
router.post('/', protect, admin, investmentController.createInvestmentProduct);
router.get('/admin', protect, admin, investmentController.getAllInvestmentProducts);
router.put('/:id', protect, admin, investmentController.updateInvestmentProduct);
router.delete('/:id', protect, admin, investmentController.deleteInvestmentProduct);
router.get('/admin/investments', protect, admin, investmentController.getAllUserInvestments);

// User routes
router.get('/', protect, investmentController.getAllInvestmentProducts);
router.post('/:id/invest', protect, investmentController.investInProduct);
router.get('/my-investments', protect, investmentController.getUserInvestments);
router.post('/withdraw/:id', protect, investmentController.withdrawInvestment);

module.exports = router; 