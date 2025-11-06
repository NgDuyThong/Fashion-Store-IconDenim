# Hướng dẫn Debug API Issues

## Vấn đề đã khắc phục
Đã cập nhật server.js và axios để xử lý đúng phân quyền cho các role nhân viên.

## Các thay đổi đã thực hiện

### 1. Server.js
- ✅ Cập nhật import các middleware phân quyền mới
- ✅ Thay đổi middleware cho từng route admin:
  - `/api/admin/users` → `authenticateCustomerManager`
  - `/api/admin/products` → `authenticateProductManager`
  - `/api/admin/orders` → `authenticateOrderManager`
  - `/api/admin/coupons` → `authenticateCouponManager`
  - `/api/admin/promotions` → `authenticatePromotionManager`
  - `/api/admin/notifications` → `authenticateNotificationManager`

### 2. Axios.js
- ✅ Cập nhật interceptor để kiểm tra cả localStorage và sessionStorage
- ✅ Cập nhật xử lý lỗi 401 để xóa token từ cả hai storage

## Cách debug

### 1. Kiểm tra token trong browser
Mở Developer Tools > Application > Local Storage (hoặc Session Storage):
```javascript
// Kiểm tra token
localStorage.getItem('adminToken')
sessionStorage.getItem('adminToken')

// Kiểm tra role
localStorage.getItem('role')
sessionStorage.getItem('role')

// Kiểm tra thông tin user
localStorage.getItem('adminInfo')
sessionStorage.getItem('adminInfo')
```

### 2. Kiểm tra Network tab
1. Mở Developer Tools > Network
2. Đăng nhập với role nhân viên
3. Kiểm tra request đến API:
   - URL có đúng không?
   - Headers có Authorization token không?
   - Response status code là gì?

### 3. Kiểm tra Console
Mở Developer Tools > Console để xem:
- Có lỗi JavaScript không?
- Có lỗi API không?
- Có thông báo từ toast không?

### 4. Test từng role

#### Customer Manager
```bash
# Test API endpoint
curl -X GET "http://localhost:5000/api/admin/users/admin/users" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### Product Manager
```bash
# Test API endpoint
curl -X GET "http://localhost:5000/api/admin/products/admin/products" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Kiểm tra server logs
Xem console của server để kiểm tra:
- Có request đến không?
- Middleware có chạy không?
- Có lỗi gì không?

## Troubleshooting

### Nếu vẫn không tải được dữ liệu:

1. **Kiểm tra token có đúng không:**
   ```javascript
   // Trong browser console
   console.log('Token:', localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken'));
   console.log('Role:', localStorage.getItem('role') || sessionStorage.getItem('role'));
   ```

2. **Kiểm tra API endpoint:**
   - URL có đúng không?
   - Server có chạy không?
   - Route có được định nghĩa đúng không?

3. **Kiểm tra middleware:**
   - Role có được chấp nhận không?
   - Token có hợp lệ không?

4. **Kiểm tra database:**
   - User có tồn tại không?
   - Role có đúng không?
   - Dữ liệu có tồn tại không?

### Nếu bị lỗi 403 (Forbidden):
- Kiểm tra role trong database
- Kiểm tra middleware có đúng không
- Kiểm tra token có hợp lệ không

### Nếu bị lỗi 401 (Unauthorized):
- Kiểm tra token có tồn tại không
- Kiểm tra token có hết hạn không
- Kiểm tra token có đúng format không

## Test Cases

### 1. Test Customer Manager
1. Tạo user với role `customer_manager`
2. Đăng nhập
3. Kiểm tra chuyển đến `/admin/customers`
4. Kiểm tra tải được danh sách users

### 2. Test Product Manager
1. Tạo user với role `product_manager`
2. Đăng nhập
3. Kiểm tra chuyển đến `/admin/products`
4. Kiểm tra tải được danh sách products

### 3. Test các role khác
Tương tự với các role còn lại.

## Lưu ý quan trọng

1. **Restart server** sau khi thay đổi server.js
2. **Clear browser cache** nếu cần
3. **Kiểm tra database** có user với role mới không
4. **Kiểm tra token** có được lưu đúng không

## API Endpoints cần test

| Role | Endpoint | Method |
|------|----------|--------|
| customer_manager | `/api/admin/users/admin/users` | GET |
| product_manager | `/api/admin/products/admin/products` | GET |
| order_manager | `/api/admin/orders/admin/orders` | GET |
| coupon_manager | `/api/admin/coupons/admin/coupons` | GET |
| promotion_manager | `/api/admin/promotions/all` | GET |
| notification_manager | `/api/admin/notifications/admin/notifications` | GET |
