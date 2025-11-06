const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/PromotionController');
const { authenticateAdmin, authenticateToken, authenticatePromotionManager } = require('../middlewares/auth.middleware');

//!ADMIN & PROMOTION MANAGER - PROMOTION MANAGEMENT
router.get('/all', authenticatePromotionManager, promotionController.getAllPromotions); //Lấy tất cả
router.post('/create', authenticatePromotionManager, promotionController.createPromotion); //Tạo
router.put('/update/:id', authenticatePromotionManager, promotionController.updatePromotion); //Cập nhật
router.delete('/delete/:id', authenticatePromotionManager, promotionController.deletePromotion); //Xóa
router.patch('/toggle-status/:id', authenticatePromotionManager, promotionController.toggleStatus); //Bật tắt
//!ADMIN CALL THÊM /api/categories để chọn danh mục sản phẩm
//!ADMIN CALL THÊM /api/products để chọn sản phẩm


// Routes cho cả admin và customer
router.get('/active', promotionController.getActivePromotions);
router.get('/:promotionID', promotionController.getPromotionById);
router.get('/product/:productId', promotionController.getPromotionsForProduct);

module.exports = router; 