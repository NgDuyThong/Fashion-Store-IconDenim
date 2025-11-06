const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticateToken, isAdmin, authenticateNotificationManager } = require('../middlewares/auth.middleware');

// Tất cả routes đều yêu cầu đăng nhập
router.use(authenticateToken);

//!ADMIN & NOTIFICATION MANAGER - NOTIFICATION MANAGEMENT
router.get('/admin/notifications', authenticateNotificationManager, NotificationController.getNotficationChoADMIN); // Lấy tất cả
router.post('/admin/notifications/create', authenticateNotificationManager, NotificationController.createNotification); // Tạo
router.put('/admin/notifications/update/:id', authenticateNotificationManager, NotificationController.updateNotification); // Cập nhật
router.delete('/admin/notifications/delete/:id', authenticateNotificationManager, NotificationController.deleteNotification); // Xóa

module.exports = router;
