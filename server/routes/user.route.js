const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { authenticateToken, isAdmin, authenticateCustomerManager } = require('../middlewares/auth.middleware');

//?CUSTOMER
router.get('/profile', authenticateToken, UserController.getProfile); // Lấy thông tin cá nhân
router.put('/profile', authenticateToken, UserController.updateProfile); // Cập nhật thông tin cá nhân
router.put('/change-password', authenticateToken, UserController.changePassword); // Đổi mật khẩu

//!ADMIN & CUSTOMER MANAGER - USER MANAGEMENT
router.get('/admin/users', authenticateCustomerManager, UserController.getUsersChoADMIN); // Lấy danh sách người dùng cho admin
router.put('/admin/users/:id', authenticateCustomerManager, UserController.updateUser); // Cập nhật thông tin người dùng
router.patch('/admin/users/toggle/:id', authenticateCustomerManager, UserController.toggleUserStatus); // Vô hiệu hóa/Kích hoạt tài khoản



module.exports = router;
