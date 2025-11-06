# Hướng dẫn cấu hình Email cho chức năng quên mật khẩu

## Vấn đề hiện tại
Lỗi "Lỗi xác thực email. Vui lòng kiểm tra lại cấu hình email." xảy ra vì thiếu file `.env` hoặc cấu hình email không đúng.

## Nguyên nhân
1. **Thiếu file `.env`** trong thư mục `server/`
2. **Thiếu hoặc sai thông tin email** trong file `.env`
3. **Sử dụng mật khẩu thường** thay vì App Password
4. **Chưa bật 2FA** cho Gmail

## Cách khắc phục

### Bước 1: Tạo file .env
Tạo file `.env` trong thư mục `server/` với nội dung:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fashion-store

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (Gmail)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_app_password_here

# PayOS Configuration (if using)
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Other configurations
NODE_ENV=development
PORT=5000
```

### Bước 2: Cấu hình Gmail

#### 2.1. Bật 2-Factor Authentication
1. Đăng nhập vào Gmail
2. Vào **Settings** > **Security**
3. Bật **2-Step Verification**

#### 2.2. Tạo App Password
1. Vào **Settings** > **Security** > **2-Step Verification**
2. Cuộn xuống **App passwords**
3. Chọn **Mail** và **Other (Custom name)**
4. Nhập tên: "Fashion Store App"
5. Copy **App Password** (16 ký tự)

#### 2.3. Cập nhật file .env
```env
EMAIL_USER=ngduythong141414@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
```

### Bước 3: Test cấu hình

#### 3.1. Restart server
```bash
cd server
npm start
```

#### 3.2. Test chức năng quên mật khẩu
1. Vào trang đăng nhập
2. Click "Quên mật khẩu?"
3. Nhập email: `ngduythong141414@gmail.com`
4. Kiểm tra email có nhận được OTP không

## Troubleshooting

### Nếu vẫn bị lỗi EAUTH:

#### 1. Kiểm tra App Password
- App Password phải có đúng 16 ký tự
- Không có dấu cách
- Phải được tạo sau khi bật 2FA

#### 2. Kiểm tra Gmail settings
- Đảm bảo 2FA đã được bật
- Kiểm tra "Less secure app access" (không cần thiết nếu dùng App Password)

#### 3. Kiểm tra file .env
```bash
# Kiểm tra file có tồn tại không
ls -la server/.env

# Kiểm tra nội dung (không hiển thị password)
cat server/.env | grep EMAIL
```

#### 4. Test với email khác
Thử với Gmail khác để xác định vấn đề có phải do tài khoản cụ thể không.

### Nếu không nhận được email:

#### 1. Kiểm tra Spam folder
- Email có thể bị gửi vào Spam
- Thêm địa chỉ gửi vào whitelist

#### 2. Kiểm tra server logs
```bash
# Xem logs của server
cd server
npm start
# Hoặc
node server.js
```

#### 3. Test với console.log
Thêm vào AuthController.js để debug:
```javascript
console.log('Email config:', {
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD
});
```

## Cấu hình email khác (tùy chọn)

### Outlook/Hotmail
```env
EMAIL_USER=your_email@outlook.com
EMAIL_PASSWORD=your_password
```

Và cập nhật transporter trong AuthController.js:
```javascript
const transporter = nodemailer.createTransporter({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

### Yahoo Mail
```javascript
const transporter = nodemailer.createTransporter({
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
```

## Lưu ý bảo mật

1. **Không commit file .env** vào Git
2. **Sử dụng App Password** thay vì mật khẩu chính
3. **Bật 2FA** cho tài khoản email
4. **Thay đổi JWT_SECRET** thành chuỗi ngẫu nhiên mạnh

## Test hoàn chỉnh

Sau khi cấu hình xong, test toàn bộ flow:

1. **Đăng nhập** với email có trong database
2. **Quên mật khẩu** với email không tồn tại → Phải báo lỗi
3. **Quên mật khẩu** với email có trong database → Phải gửi OTP
4. **Kiểm tra email** có nhận được OTP không
5. **Nhập OTP** và đổi mật khẩu mới
6. **Đăng nhập** với mật khẩu mới
