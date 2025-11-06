const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');
const { authenticateToken, isAdmin, authenticateCouponManager } = require('../middlewares/auth.middleware');

//!ADMIN & COUPON MANAGER - COUPON MANAGEMENT
router.get('/admin/coupons', authenticateCouponManager, CouponController.getCouponsChoADMIN); // Lấy tất cả
router.post('/admin/coupons/create', authenticateCouponManager, CouponController.createCoupon); // Tạo
router.put('/admin/coupons/update/:id', authenticateCouponManager, CouponController.updateCoupon); // Cập nhật
router.delete('/admin/coupons/delete/:id', authenticateCouponManager, CouponController.deleteCoupon); // Xóa
router.patch('/admin/coupons/toggle/:id', authenticateCouponManager, CouponController.toggleCouponStatus); // Vô hiệu hóa/Kích hoạt 
//!ADMIN CALL THÊM /api/categories

module.exports = router;
