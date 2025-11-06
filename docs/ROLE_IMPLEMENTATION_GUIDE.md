# Hướng dẫn triển khai Role-based Access Control

## Tổng quan
Đã thêm 6 role nhân viên mới vào hệ thống:
- `customer_manager` - Nhân viên Quản lý khách hàng
- `product_manager` - Nhân viên Quản lý sản phẩm  
- `order_manager` - Nhân viên Quản lý đơn hàng
- `coupon_manager` - Nhân viên Quản lý mã giảm giá
- `promotion_manager` - Nhân viên Quản lý khuyến mãi
- `notification_manager` - Nhân viên Quản lý thông báo

## Các thay đổi đã thực hiện

### 1. Backend Changes

#### User Model (`server/models/User.js`)
- Thêm 6 role mới vào enum values
- Các role được định nghĩa với tên tiếng Anh để dễ quản lý

#### Middleware Authentication (`server/middlewares/auth.middleware.js`)
- Thêm middleware cho từng role nhân viên
- Mỗi role có thể truy cập cùng với admin
- Export các middleware mới để sử dụng trong routes

#### Route Protection
Cập nhật các route files:
- `user.route.js` - Sử dụng `authenticateCustomerManager`
- `product.route.js` - Sử dụng `authenticateProductManager`
- `order.route.js` - Sử dụng `authenticateOrderManager`
- `coupon.route.js` - Sử dụng `authenticateCouponManager`
- `promotion.route.js` - Sử dụng `authenticatePromotionManager`
- `notification.route.js` - Sử dụng `authenticateNotificationManager`

### 2. Frontend Changes

#### Sidebar Component (`client/src/components/Sidebar.jsx`)
- Thêm thuộc tính `roles` cho mỗi menu item
- Lọc menu items dựa trên role của user
- Chỉ hiển thị menu phù hợp với role

## Menu Permissions

| Role | Dashboard | Customers | Products | Orders | Coupons | Promotions | Notifications | Settings |
|------|-----------|-----------|----------|--------|---------|------------|---------------|----------|
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| customer_manager | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| product_manager | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| order_manager | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| coupon_manager | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| promotion_manager | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| notification_manager | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |

## Cách test

### 1. Tạo user với role mới
```javascript
// Trong database hoặc qua API
{
  "userID": 1234567890,
  "fullname": "Nguyễn Văn A",
  "email": "customer_manager@example.com",
  "password": "password123",
  "phone": "0123456789",
  "gender": "male",
  "role": "customer_manager"
}
```

### 2. Đăng nhập với role mới
- Đăng nhập với tài khoản có role mới
- Kiểm tra localStorage có lưu đúng role
- Kiểm tra sidebar chỉ hiển thị menu phù hợp

### 3. Test phân quyền API
- Thử truy cập API không được phép → phải trả về 403
- Thử truy cập API được phép → phải thành công

### 4. Test UI Navigation
- Đăng nhập với role `customer_manager`
- Chỉ thấy menu "Tổng quan" và "Quản lý khách hàng"
- Không thể truy cập các trang khác

## Lưu ý quan trọng

1. **Database Migration**: Cần cập nhật database để hỗ trợ các role mới
2. **Frontend Route Protection**: Cần thêm route protection ở frontend
3. **User Creation**: Cần tạo interface để admin tạo user với role mới
4. **Role Assignment**: Cần có chức năng thay đổi role của user

## API Endpoints được bảo vệ

### Customer Manager
- `GET /api/users/admin/users` - Lấy danh sách users
- `PUT /api/users/admin/users/:id` - Cập nhật user
- `PATCH /api/users/admin/users/toggle/:id` - Toggle user status

### Product Manager  
- `GET /api/products/admin/products` - Lấy danh sách products
- `POST /api/products/admin/products/create` - Tạo product
- `PUT /api/products/admin/products/update/:id` - Cập nhật product
- `DELETE /api/products/admin/products/delete/:id` - Xóa product

### Order Manager
- `GET /api/orders/admin/orders` - Lấy danh sách orders
- `PATCH /api/orders/admin/orders/update/:id` - Cập nhật order status
- `DELETE /api/orders/admin/orders/delete/:id` - Xóa order

### Coupon Manager
- `GET /api/coupons/admin/coupons` - Lấy danh sách coupons
- `POST /api/coupons/admin/coupons/create` - Tạo coupon
- `PUT /api/coupons/admin/coupons/update/:id` - Cập nhật coupon
- `DELETE /api/coupons/admin/coupons/delete/:id` - Xóa coupon

### Promotion Manager
- `GET /api/promotions/all` - Lấy danh sách promotions
- `POST /api/promotions/create` - Tạo promotion
- `PUT /api/promotions/update/:id` - Cập nhật promotion
- `DELETE /api/promotions/delete/:id` - Xóa promotion

### Notification Manager
- `GET /api/notifications/admin/notifications` - Lấy danh sách notifications
- `POST /api/notifications/admin/notifications/create` - Tạo notification
- `PUT /api/notifications/admin/notifications/update/:id` - Cập nhật notification
- `DELETE /api/notifications/admin/notifications/delete/:id` - Xóa notification
