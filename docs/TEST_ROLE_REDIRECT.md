# Hướng dẫn Test Role Redirect

## Vấn đề đã khắc phục
Đã cập nhật logic đăng nhập để xử lý các role nhân viên mới và chuyển hướng đúng trang.

## Các thay đổi đã thực hiện

### 1. Login.jsx
- ✅ Cập nhật logic xử lý đăng nhập để nhận diện các role nhân viên
- ✅ Thêm chuyển hướng tự động dựa trên role
- ✅ Cập nhật cả đăng nhập thường và đăng nhập Google

### 2. PrivateRoute.jsx  
- ✅ Cập nhật AdminRoute để cho phép tất cả role nhân viên truy cập admin area

## Chuyển hướng sau đăng nhập

| Role | Trang chuyển hướng |
|------|-------------------|
| admin | `/admin/dashboard` |
| customer_manager | `/admin/customers` |
| product_manager | `/admin/products` |
| order_manager | `/admin/orders` |
| coupon_manager | `/admin/coupons` |
| promotion_manager | `/admin/promotions` |
| notification_manager | `/admin/notifications` |
| customer | `/` (trang chủ) |

## Cách test

### 1. Tạo user với role mới trong database
```javascript
// Ví dụ tạo user product_manager
{
  "userID": 1234567890,
  "fullname": "Nguyễn Văn A",
  "email": "product_manager@example.com", 
  "password": "password123",
  "phone": "0123456789",
  "gender": "male",
  "role": "product_manager"
}
```

### 2. Test đăng nhập
1. Mở trình duyệt và vào `http://localhost:5173/login`
2. Đăng nhập với email `product_manager@example.com`
3. Kiểm tra:
   - ✅ Tự động chuyển đến `http://localhost:5173/admin/products`
   - ✅ Sidebar chỉ hiển thị "Tổng quan" và "Quản lý sản phẩm"
   - ✅ localStorage có lưu đúng role: `product_manager`

### 3. Test các role khác
Tương tự với các role khác:
- `customer_manager` → `/admin/customers`
- `order_manager` → `/admin/orders`
- `coupon_manager` → `/admin/coupons`
- `promotion_manager` → `/admin/promotions`
- `notification_manager` → `/admin/notifications`

### 4. Test đăng nhập Google
1. Đăng nhập bằng Google với tài khoản có role nhân viên
2. Kiểm tra chuyển hướng đúng trang

## Kiểm tra localStorage
Sau khi đăng nhập thành công, kiểm tra localStorage:
```javascript
// Mở Developer Tools > Application > Local Storage
localStorage.getItem('role') // Phải trả về role đúng
localStorage.getItem('adminToken') // Phải có token
localStorage.getItem('adminInfo') // Phải có thông tin user
```

## Troubleshooting

### Nếu vẫn không chuyển hướng đúng:
1. Kiểm tra role trong database có đúng không
2. Kiểm tra console có lỗi JavaScript không
3. Kiểm tra localStorage có lưu đúng role không
4. Thử clear cache và đăng nhập lại

### Nếu bị chuyển về trang chủ:
- Kiểm tra role có nằm trong danh sách `adminRoles` không
- Kiểm tra PrivateRoute có cho phép role đó truy cập không

## Lưu ý
- Tất cả role nhân viên đều sử dụng `adminToken` và `adminInfo` trong localStorage
- Chỉ có `customer` role mới sử dụng `customerToken` và `customerInfo`
- Các role nhân viên đều có thể truy cập admin area nhưng chỉ thấy menu phù hợp
