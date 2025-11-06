const express = require('express');
const router = express.Router();
const CoHUIController = require('../controllers/CoHUIController');

/**
 * Routes cho CoHUI Recommendation System
 * Tích hợp thuật toán khai thác tập hữu ích cao có tương quan
 */

// @route   GET /api/cohui/recommendations
// @desc    Lấy danh sách sản phẩm gợi ý dựa trên CoHUI
// @access  Public
// @params  minutil, mincor, maxlen, topN
router.get('/recommendations', CoHUIController.getRecommendations);

// @route   GET /api/cohui/recommendations/:productID
// @desc    Lấy sản phẩm tương quan cho 1 sản phẩm cụ thể (từ CoIUM analysis)
// @access  Public
// @params  productID (path), topN (query)
router.get('/recommendations/:productID', CoHUIController.getProductRecommendations);

// @route   GET /api/cohui/bought-together/:productID
// @desc    Lấy danh sách sản phẩm thường được mua cùng
// @access  Public
// @params  productID (path), minutil, mincor, topN (query)
router.get('/bought-together/:productID', CoHUIController.getBoughtTogether);

// @route   POST /api/cohui/cart-analysis
// @desc    Phân tích giỏ hàng và gợi ý sản phẩm bổ sung
// @access  Public (hoặc Customer nếu cần auth)
// @body    { cartItems: [productID1, productID2, ...] }
// @params  minutil, mincor, topN (query)
router.post('/cart-analysis', CoHUIController.analyzeCart);

// @route   GET /api/cohui/statistics
// @desc    Lấy thống kê về CoHUI patterns
// @access  Public (hoặc Admin)
// @params  minutil, mincor, maxlen
router.get('/statistics', CoHUIController.getStatistics);

module.exports = router;
