# CHƯƠNG 5: HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG

## 5.1. GIỚI THIỆU

Chương này trình bày chi tiết quy trình cài đặt và triển khai hệ thống IconDenim - Website thương mại điện tử thời trang tích hợp hệ thống gợi ý sản phẩm thông minh. Hệ thống được xây dựng theo kiến trúc Client-Server với ba thành phần chính:

- **Frontend (Client)**: Giao diện người dùng được xây dựng bằng React và Vite
- **Backend (Server)**: API Server được xây dựng bằng Node.js và Express
- **CoIUM System**: Hệ thống khai phá mẫu hữu ích và gợi ý sản phẩm được xây dựng bằng Python

## 5.2. YÊU CẦU HỆ THỐNG

### 5.2.1. Yêu cầu phần cứng

**Cấu hình tối thiểu:**
- CPU: Intel Core i3 hoặc tương đương
- RAM: 4GB
- Ổ cứng: 10GB dung lượng trống
- Kết nối Internet ổn định

**Cấu hình khuyến nghị:**
- CPU: Intel Core i5 hoặc cao hơn
- RAM: 8GB trở lên
- Ổ cứng: SSD với 20GB dung lượng trống
- Kết nối Internet tốc độ cao

### 5.2.2. Yêu cầu phần mềm

**Hệ điều hành:**
- Windows 10/11 (64-bit)
- macOS 10.15 trở lên
- Linux (Ubuntu 20.04 LTS trở lên)

**Phần mềm bắt buộc:**

1. **Node.js và npm**
   - Phiên bản: Node.js 20.x trở lên
   - npm: 9.x trở lên
   - Tải về: https://nodejs.org/

2. **Python**
   - Phiên bản: Python 3.9 trở lên
   - pip: Công cụ quản lý package của Python
   - Tải về: https://www.python.org/downloads/

3. **MongoDB**
   - Phiên bản: MongoDB 6.x trở lên
   - Có thể sử dụng MongoDB Atlas (Cloud) hoặc cài đặt local
   - MongoDB Atlas: https://www.mongodb.com/cloud/atlas
   - MongoDB Community: https://www.mongodb.com/try/download/community

4. **Git**
   - Phiên bản mới nhất
   - Tải về: https://git-scm.com/downloads

**Phần mềm khuyến nghị:**

1. **Visual Studio Code**
   - IDE phát triển ứng dụng
   - Tải về: https://code.visualstudio.com/

2. **Postman**
   - Công cụ test API
   - Tải về: https://www.postman.com/downloads/

3. **MongoDB Compass**
   - Công cụ quản lý MongoDB với giao diện đồ họa
   - Tải về: https://www.mongodb.com/products/compass


## 5.3. CÀI ĐẶT MÔI TRƯỜNG PHÁT TRIỂN

### 5.3.1. Cài đặt Node.js và npm

**Bước 1:** Tải Node.js từ trang chủ

Truy cập https://nodejs.org/ và tải phiên bản LTS (Long Term Support) phù hợp với hệ điều hành.

**Bước 2:** Cài đặt Node.js

- **Windows**: Chạy file .msi đã tải về và làm theo hướng dẫn
- **macOS**: Chạy file .pkg và làm theo hướng dẫn
- **Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Bước 3:** Kiểm tra cài đặt

Mở Terminal/Command Prompt và chạy các lệnh sau:

```bash
node --version
```
Kết quả mong đợi: `v20.x.x` hoặc cao hơn

```bash
npm --version
```
Kết quả mong đợi: `9.x.x` hoặc cao hơn

### 5.3.2. Cài đặt Python

**Bước 1:** Tải Python từ trang chủ

Truy cập https://www.python.org/downloads/ và tải phiên bản Python 3.9 trở lên.

**Bước 2:** Cài đặt Python

- **Windows**: 
  - Chạy file installer
  - **Quan trọng**: Tích chọn "Add Python to PATH" trước khi cài đặt
  - Chọn "Install Now"

- **macOS**:
```bash
brew install python@3.9
```

- **Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install python3.9 python3-pip
```

**Bước 3:** Kiểm tra cài đặt

```bash
python --version
```
Kết quả mong đợi: `Python 3.9.x` hoặc cao hơn

```bash
pip --version
```
Kết quả mong đợi: `pip 21.x.x` hoặc cao hơn

### 5.3.3. Cài đặt MongoDB

#### 5.3.3.1. Sử dụng MongoDB Atlas (Cloud - Khuyến nghị)

**Bước 1:** Tạo tài khoản MongoDB Atlas

- Truy cập https://www.mongodb.com/cloud/atlas/register
- Đăng ký tài khoản miễn phí

**Bước 2:** Tạo Cluster mới

- Sau khi đăng nhập, chọn "Build a Database"
- Chọn gói "Free" (M0 Sandbox)
- Chọn Cloud Provider và Region gần nhất (khuyến nghị: AWS - Singapore)
- Đặt tên Cluster (ví dụ: IconDenimCluster)
- Nhấn "Create"

**Bước 3:** Cấu hình Database Access

- Vào mục "Database Access" trong menu bên trái
- Nhấn "Add New Database User"
- Chọn "Password" authentication
- Nhập username và password (lưu lại thông tin này)
- Database User Privileges: chọn "Read and write to any database"
- Nhấn "Add User"

**Bước 4:** Cấu hình Network Access

- Vào mục "Network Access"
- Nhấn "Add IP Address"
- Chọn "Allow Access from Anywhere" (0.0.0.0/0) cho môi trường phát triển
- Nhấn "Confirm"

**Bước 5:** Lấy Connection String

- Quay lại "Database" và nhấn "Connect" trên Cluster
- Chọn "Connect your application"
- Chọn Driver: "Node.js" và Version: "4.1 or later"
- Copy Connection String có dạng:
```
mongodb+srv://<username>:<password>@cluster.xxxxx.mongodb.net/<database>?retryWrites=true&w=majority
```
- Thay thế `<username>`, `<password>` và `<database>` bằng thông tin thực tế


#### 5.3.3.2. Cài đặt MongoDB Local (Tùy chọn)

**Windows:**

1. Tải MongoDB Community Server từ https://www.mongodb.com/try/download/community
2. Chạy file .msi và làm theo hướng dẫn
3. Chọn "Complete" installation
4. Cấu hình MongoDB as a Service
5. Khởi động MongoDB Service:
```cmd
net start MongoDB
```

**macOS:**

```bash
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb-community@6.0
```

**Linux (Ubuntu):**

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Kiểm tra MongoDB:**

```bash
mongosh
```
Nếu kết nối thành công, bạn sẽ thấy MongoDB shell.

### 5.3.4. Cài đặt Git

**Windows:**
- Tải Git từ https://git-scm.com/download/win
- Chạy installer và sử dụng cấu hình mặc định

**macOS:**
```bash
brew install git
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git
```

**Kiểm tra cài đặt:**
```bash
git --version
```

## 5.4. TẢI VÀ CÀI ĐẶT MÃ NGUỒN

### 5.4.1. Clone Repository

**Bước 1:** Mở Terminal/Command Prompt

**Bước 2:** Di chuyển đến thư mục muốn lưu project

```bash
cd /path/to/your/workspace
```

**Bước 3:** Clone repository (nếu sử dụng Git)

```bash
git clone <repository-url>
cd IconDenim
```

Hoặc giải nén file source code nếu có sẵn.

### 5.4.2. Cấu trúc thư mục dự án

Sau khi tải về, cấu trúc thư mục như sau:

```
IconDenim/
├── client/                 # Frontend React Application
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── assets/        # Images, fonts
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── layouts/       # Layout components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Root component
│   │   └── main.jsx       # Entry point
│   ├── package.json       # Dependencies
│   ├── vite.config.js     # Vite configuration
│   └── tailwind.config.js # Tailwind CSS config
│
├── server/                # Backend Node.js Application
│   ├── controllers/       # Business logic
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middlewares/      # Custom middlewares
│   ├── mail/             # Email templates
│   ├── utils/            # Helper functions
│   ├── CoIUM/            # CoIUM integration
│   ├── .env              # Environment variables
│   ├── package.json      # Dependencies
│   └── server.js         # Entry point
│
├── CoIUM_Final/          # CoIUM Recommendation System
│   ├── algorithms/       # Mining algorithms
│   │   ├── coium.py     # CoIUM algorithm
│   │   ├── cohui_miner.py # CoHUI algorithm
│   │   └── coup_miner.py  # COUP algorithm
│   ├── datasets/         # Sample datasets
│   ├── profits/          # Profit data
│   ├── main.py           # Main entry point
│   ├── recommendation_service.py # Recommendation service
│   └── requirements.txt  # Python dependencies
│
├── docs/                 # Documentation
├── README.md            # Project documentation
└── start-cohui.ps1      # Quick start script (Windows)
```


## 5.5. CÀI ĐẶT VÀ CẤU HÌNH BACKEND (SERVER)

### 5.5.1. Cài đặt Dependencies

**Bước 1:** Mở Terminal và di chuyển vào thư mục server

```bash
cd server
```

**Bước 2:** Cài đặt các package cần thiết

```bash
npm install
```

Quá trình này sẽ cài đặt tất cả dependencies được liệt kê trong `package.json`, bao gồm:

**Core Dependencies:**
- **express** (^4.21.2): Framework web cho Node.js
- **mongoose** (^8.9.4): ODM cho MongoDB
- **mongodb** (^6.12.0): MongoDB driver

**Authentication & Security:**
- **jsonwebtoken** (^9.0.2): Xác thực JWT
- **bcrypt** (^5.1.1): Mã hóa mật khẩu
- **bcryptjs** (^2.4.3): Alternative bcrypt implementation
- **cookie-parser** (^1.4.7): Parse cookies
- **cors** (^2.8.5): Xử lý Cross-Origin Resource Sharing
- **dotenv** (^16.4.7): Quản lý biến môi trường

**File Upload & Storage:**
- **cloudinary** (^2.5.1): Quản lý hình ảnh cloud
- **multer** (^1.4.5-lts.1): Xử lý file upload

**Email Service:**
- **nodemailer** (^6.9.16): Gửi email
- **express-handlebars** (^8.0.1): Template engine cho email

**Payment Integration:**
- **@payos/node** (^1.0.10): Tích hợp thanh toán PayOS

**AI Integration:**
- **@google/generative-ai** (^0.24.1): Google Gemini AI
- **openai** (^3.3.0): OpenAI API

**Realtime Communication:**
- **socket.io** (^4.8.1): WebSocket cho realtime features
- **socket.io-client** (^4.8.1): Socket.io client

**Utilities:**
- **axios** (^1.13.1): HTTP client
- **body-parser** (^1.20.3): Parse request body
- **crypto** (^1.0.1): Cryptographic functions
- **date-fns** (^4.1.0): Date utility library
- **moment** (^2.30.1): Date manipulation
- **qs** (^6.14.0): Query string parser
- **path** (^0.12.7): File path utilities

**Development:**
- **nodemon** (^3.1.9): Auto-restart server khi có thay đổi

### 5.5.2. Cấu hình biến môi trường (.env)

**Bước 1:** Tạo file `.env` trong thư mục `server`

Nếu đã có file `.env.example`, copy và đổi tên thành `.env`:

```bash
cp .env.example .env
```

Hoặc tạo file mới `.env`

**Bước 2:** Cấu hình các biến môi trường

Mở file `.env` và cấu hình các thông số sau:

```env
# ===================================
# SERVER CONFIGURATION
# ===================================
PORT=5000
JWT_SECRET=wbLPnfoACl
VITE_API_URL=http://localhost:5000

# ===================================
# DATABASE CONFIGURATION
# ===================================
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority&appName=<appName>

# Ví dụ:
# MONGODB_URI=mongodb+srv://admin:mypassword123@icondenim.abc123.mongodb.net/IconDenimDB?retryWrites=true&w=majority&appName=IconDenim

# Hoặc nếu dùng MongoDB local:
# MONGODB_URI=mongodb://localhost:27017/IconDenimDB

# ===================================
# SHOP INFORMATION
# ===================================
SHOP_NAME=IconDenim
SHOP_ADDRESS=484 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh
SHOP_PHONE=0782485283
SHOP_EMAIL=icondenimstorehihi@gmail.com

# ===================================
# EMAIL CONFIGURATION
# ===================================
# Sử dụng Gmail SMTP
EMAIL_USER=ddtvstorehihi@gmail.com
EMAIL_PASSWORD=dhka bcvg etbh xpsc
EMAIL_ADMIN=ddtvstorehihi@gmail.com

# Hướng dẫn lấy App Password cho Gmail:
# 1. Truy cập: https://myaccount.google.com/security
# 2. Bật "2-Step Verification"
# 3. Vào "App passwords"
# 4. Tạo password mới cho "Mail" và "Other (Custom name)"
# 5. Copy password 16 ký tự và paste vào EMAIL_PASSWORD

# ===================================
# ADMIN CONFIGURATION
# ===================================
ADMIN_URL=http://localhost:5173/admin

# ===================================
# AI INTEGRATION
# ===================================
# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
# Lấy API key tại: https://makersuite.google.com/app/apikey

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
# Lấy API key tại: https://platform.openai.com/api-keys

# ===================================
# PAYMENT INTEGRATION
# ===================================
# PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key
# Đăng ký tại: https://payos.vn/

# ===================================
# SOCIAL LOGIN (Optional)
# ===================================
# Facebook App
FB_APP_ID=your_fb_app_id
# Tạo app tại: https://developers.facebook.com/

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# Tạo credentials tại: https://console.cloud.google.com/
```

**Lưu ý quan trọng:**

1. **JWT_SECRET**: Nên thay đổi thành chuỗi ngẫu nhiên phức tạp cho production
2. **MONGODB_URI**: Thay thế các giá trị `<username>`, `<password>`, `<cluster>`, `<database>` bằng thông tin thực tế
3. **EMAIL_PASSWORD**: Phải sử dụng App Password, không phải mật khẩu Gmail thông thường
4. Các API key đã được cấu hình sẵn trong file .env mẫu


### 5.5.3. Kiểm tra kết nối Database

**Bước 1:** Khởi động server để test kết nối

```bash
npm start
```

**Bước 2:** Kiểm tra output

Nếu kết nối thành công, bạn sẽ thấy:
```
✅Kết nối đến MongoDB thành công
Server đang chạy trên cổng 5000
```

Nếu có lỗi, kiểm tra lại:
- MONGODB_URI có đúng format không
- Username/password có chính xác không
- IP address đã được whitelist trong MongoDB Atlas chưa
- MongoDB service có đang chạy không (nếu dùng local)

### 5.5.4. Cấu trúc Database

Hệ thống sử dụng MongoDB với các collections chính:

1. **users**: Thông tin người dùng
2. **products**: Sản phẩm
3. **categories**: Danh mục sản phẩm
4. **orders**: Đơn hàng
5. **orderdetails**: Chi tiết đơn hàng
6. **carts**: Giỏ hàng
7. **reviews**: Đánh giá sản phẩm
8. **coupons**: Mã giảm giá
9. **promotions**: Chương trình khuyến mãi
10. **notifications**: Thông báo
11. **addresses**: Địa chỉ giao hàng
12. **favorites**: Sản phẩm yêu thích
13. **product_colors**: Màu sắc sản phẩm
14. **product_sizes_stocks**: Tồn kho theo size
15. **targets**: Đối tượng khách hàng (Nam/Nữ)

Database sẽ tự động tạo các collections khi có dữ liệu được insert lần đầu.

## 5.6. CÀI ĐẶT VÀ CẤU HÌNH FRONTEND (CLIENT)

### 5.6.1. Cài đặt Dependencies

**Bước 1:** Mở Terminal mới (giữ terminal server đang chạy)

**Bước 2:** Di chuyển vào thư mục client

```bash
cd client
```

**Bước 3:** Cài đặt các package cần thiết

```bash
npm install
```

Quá trình này sẽ cài đặt các dependencies chính:

**Core Libraries:**
- **react** (^18.3.1): Thư viện UI
- **react-dom** (^18.3.1): React DOM renderer
- **react-router-dom** (^7.1.1): Routing
- **vite** (^6.0.7): Build tool

**State Management:**
- **@reduxjs/toolkit** (^2.5.1): State management
- **react-redux** (^9.2.0): React bindings cho Redux

**UI Components & Styling:**
- **tailwindcss** (^3.4.17): CSS framework
- **@tailwindcss/forms** (^0.5.10): Form styles
- **@tailwindcss/typography** (^0.5.16): Typography plugin
- **@tailwindcss/aspect-ratio** (^0.4.2): Aspect ratio utilities
- **@mui/material** (^6.4.0): Material-UI components
- **@mui/icons-material** (^6.4.0): Material-UI icons
- **@emotion/react** (^11.14.0): CSS-in-JS
- **@emotion/styled** (^11.14.0): Styled components
- **antd** (^5.23.1): Ant Design components
- **@ant-design/icons** (^5.5.2): Ant Design icons
- **@headlessui/react** (^2.2.0): Unstyled UI components
- **@heroicons/react** (^2.2.0): Icon library
- **react-icons** (^5.4.0): Icon library
- **framer-motion** (^11.18.0): Animation library
- **swiper** (^11.2.1): Slider/Carousel

**Form & Validation:**
- **react-hook-form** (^7.54.2): Form handling

**HTTP Client:**
- **axios** (^1.7.9): HTTP client

**Charts & Visualization:**
- **chart.js** (^4.4.7): Chart library
- **react-chartjs-2** (^5.3.0): React wrapper cho Chart.js

**Authentication:**
- **@react-oauth/google** (^0.12.1): Google OAuth
- **@greatsumini/react-facebook-login** (^3.4.0): Facebook login

**Other Utilities:**
- **date-fns** (^4.1.0): Date utility
- **lodash** (^4.17.21): Utility library
- **sweetalert2** (^11.15.10): Alert/Modal library
- **react-toastify** (^11.0.2): Toast notifications
- **react-modal** (^3.16.3): Modal component
- **react-tooltip** (^5.28.0): Tooltip component
- **react-intersection-observer** (^9.15.0): Intersection observer
- **react-transition-group** (^4.4.5): Transition animations
- **color-name-list** (^11.3.0): Color names
- **xlsx** (^0.18.5): Excel file handling

**Development Dependencies:**
- **@vitejs/plugin-react** (^4.3.4): Vite React plugin
- **@vitejs/plugin-basic-ssl** (^2.1.0): SSL support
- **eslint** (^9.17.0): Linter
- **autoprefixer** (^10.4.20): PostCSS plugin
- **postcss** (^8.4.49): CSS processor

### 5.6.2. Cấu hình API Endpoint

**Bước 1:** Kiểm tra file cấu hình Vite

File `client/vite.config.js` đã được cấu hình:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    __WS_TOKEN__: JSON.stringify(''),
  },
  server: {
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    }
  }
})
```

**Bước 2:** Cấu hình API URL

Trong các file service (thường ở `src/utils/`), API URL mặc định là:

```javascript
const API_URL = 'http://localhost:5000/api';
```

### 5.6.3. Cấu hình Tailwind CSS

File `tailwind.config.js` đã được cấu hình với các plugins:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom theme configuration
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
```


## 5.7. CÀI ĐẶT HỆ THỐNG COIUM (RECOMMENDATION SYSTEM)

### 5.7.1. Cài đặt Python Dependencies

**Bước 1:** Di chuyển vào thư mục CoIUM_Final

```bash
cd CoIUM_Final
```

**Bước 2:** Tạo môi trường ảo Python (khuyến nghị)

**Windows:**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**Bước 3:** Cài đặt dependencies

```bash
pip install -r requirements.txt
```

File `requirements.txt` chứa:
```
numpy
```

### 5.7.2. Cấu trúc CoIUM System

**Các thuật toán chính:**

1. **CoIUM (Correlated Itemset Utility Mining)**
   - File: `algorithms/coium.py`
   - Chức năng: Khai phá các tập mục có độ hữu ích cao và tương quan

2. **CoHUI (Correlated High Utility Itemset)**
   - File: `algorithms/cohui_miner.py`
   - Chức năng: Tìm các tập mục hữu ích cao có tương quan

3. **COUP (Correlated Utility Pattern)**
   - File: `algorithms/coup_miner.py`
   - Chức năng: Khai phá mẫu hữu ích có tương quan

**Các module hỗ trợ:**

- `data_utils.py`: Xử lý và load dữ liệu
- `structures.py`: Cấu trúc dữ liệu (Utility-list, Tree)
- `metrics.py`: Tính toán các metrics (utility, correlation)
- `evaluation.py`: Đánh giá hiệu suất thuật toán
- `visualization.py`: Trực quan hóa kết quả
- `recommendation_service.py`: Service gợi ý sản phẩm

**Recommendation Service:**

File `recommendation_service.py` cung cấp các chức năng:

1. **get_product_recommendations()**: Gợi ý sản phẩm chung
   - Input: Dữ liệu đơn hàng, target products (optional)
   - Output: Danh sách sản phẩm gợi ý với điểm số

2. **get_frequent_bought_together()**: Sản phẩm thường mua cùng
   - Input: Dữ liệu đơn hàng, product_id
   - Output: Sản phẩm thường được mua cùng với product_id

3. **analyze_shopping_cart()**: Phân tích giỏ hàng
   - Input: Dữ liệu đơn hàng, cart_items
   - Output: Gợi ý sản phẩm nên thêm vào giỏ

### 5.7.3. Chuẩn bị dữ liệu

**Bước 1:** Kiểm tra datasets

Thư mục `datasets/` chứa các file dữ liệu mẫu:
- `fashion_store.dat`: Dữ liệu giao dịch cửa hàng thời trang
- `chess.dat`, `mushroom.dat`: Datasets benchmark
- `retail.csv`: Dữ liệu bán lẻ
- `T10I4D100K.dat`, `T40I10D100K.dat`: Synthetic datasets

**Bước 2:** Chuẩn bị file profits

Thư mục `profits/` chứa thông tin lợi nhuận của từng sản phẩm:
- `fashion_store_profits.txt`: Lợi nhuận sản phẩm thời trang
- Format: `item_id:profit_value`

Ví dụ:
```
1:50
2:30
3:45
4:60
```

**Bước 3:** Test chạy thuật toán

```bash
python main.py
```

Hoặc chạy với dataset cụ thể:

```bash
python run_fashion_store.py
```

### 5.7.4. Tích hợp với Backend

CoIUM system được tích hợp vào backend thông qua:

1. **API Endpoint**: `/api/cohui/recommendations`
2. **Process Runner**: `/api/coium-process/run`

Backend sẽ gọi Python scripts thông qua child process để thực hiện:
- Khai phá mẫu từ dữ liệu giao dịch
- Tạo recommendations dựa trên kết quả khai phá
- Lưu kết quả vào file `correlation_recommendations.json`

**Cách hoạt động:**

1. Backend gửi dữ liệu đơn hàng qua stdin
2. Python script xử lý và chạy thuật toán CoHUI
3. Kết quả được trả về dạng JSON qua stdout
4. Backend parse JSON và trả về cho client

## 5.8. KHỞI ĐỘNG HỆ THỐNG

### 5.8.1. Khởi động thủ công

**Bước 1:** Khởi động Backend Server

Mở Terminal 1:
```bash
cd server
npm run dev
```

Kết quả mong đợi:
```
✅Kết nối đến MongoDB thành công
Server đang chạy trên cổng 5000
```

**Bước 2:** Khởi động Frontend Client

Mở Terminal 2:
```bash
cd client
npm run dev
```

Kết quả mong đợi:
```
VITE v6.0.7  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**Bước 3:** Truy cập ứng dụng

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api

### 5.8.2. Khởi động nhanh với Script (Windows)

Hệ thống cung cấp script PowerShell để khởi động nhanh CoHUI system:

```powershell
.\start-cohui.ps1
```

Script này sẽ:
1. Kiểm tra Python và Node.js
2. Kiểm tra và cài đặt NumPy nếu cần
3. Kiểm tra kết nối MongoDB
4. Tùy chọn chạy test API
5. Khởi động server

### 5.8.3. Kiểm tra hệ thống hoạt động

**Test Backend API:**

Sử dụng curl hoặc Postman để test:

```bash
# Test health check
curl http://localhost:5000/api/products

# Test CoHUI recommendations
curl http://localhost:5000/api/cohui/recommendations
```

**Test Frontend:**

1. Mở trình duyệt và truy cập http://localhost:5173
2. Kiểm tra trang chủ hiển thị đúng
3. Thử đăng ký/đăng nhập
4. Kiểm tra các chức năng cơ bản


## 5.9. IMPORT DỮ LIỆU BAN ĐẦU

### 5.9.1. Tạo tài khoản Admin

**Cách 1: Sử dụng API**

Gửi POST request đến `/api/auth/register`:

```json
{
  "username": "admin",
  "email": "admin@icondenim.com",
  "password": "Admin@123",
  "fullName": "Administrator",
  "phone": "0123456789",
  "role": "admin"
}
```

**Cách 2: Sử dụng MongoDB Compass**

1. Kết nối đến database
2. Vào collection `users`
3. Insert document mới với role "admin"

**Cách 3: Sử dụng mongosh**

```javascript
use IconDenimDB

db.users.insertOne({
  username: "admin",
  email: "admin@icondenim.com",
  password: "$2b$10$...", // Hash password bằng bcrypt
  fullName: "Administrator",
  phone: "0123456789",
  role: "admin",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### 5.9.2. Import dữ liệu mẫu

**Danh mục sản phẩm (Categories):**

```javascript
db.categories.insertMany([
  {
    categoryID: 1,
    name: "Áo thun",
    description: "Áo thun nam nữ thời trang",
    image: "url_to_image",
    isActive: true
  },
  {
    categoryID: 2,
    name: "Quần jean",
    description: "Quần jean cao cấp",
    image: "url_to_image",
    isActive: true
  },
  {
    categoryID: 3,
    name: "Áo khoác",
    description: "Áo khoác thời trang",
    image: "url_to_image",
    isActive: true
  }
])
```

**Target (Đối tượng):**

```javascript
db.targets.insertMany([
  {
    targetID: 1,
    name: "Nam"
  },
  {
    targetID: 2,
    name: "Nữ"
  }
])
```

**Sản phẩm mẫu:**

Có thể import thông qua:
1. Admin Dashboard (khuyến nghị)
2. API endpoints
3. MongoDB import tools

### 5.9.3. Cấu hình Cloudinary (Upload hình ảnh)

Hệ thống sử dụng Cloudinary để quản lý hình ảnh. Cloudinary được cấu hình trong file `server/middlewares/ImagesCloudinary_Controller.js`.

**Lưu ý:** Credentials Cloudinary đã được tích hợp sẵn trong code, không cần cấu hình thêm trong file .env.

## 5.10. CẤU HÌNH BẢO MẬT

### 5.10.1. Bảo mật JWT

**JWT Secret:**

File `.env` đã có JWT_SECRET mặc định. Đối với production, nên thay đổi thành chuỗi phức tạp hơn:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy kết quả vào `JWT_SECRET` trong file `.env`

**JWT expiration:**

Trong file `server/middlewares/auth.middleware.js`, token được cấu hình với thời gian hết hạn:

```javascript
const token = jwt.sign(
  { userId: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' } // Token hết hạn sau 7 ngày
);
```

### 5.10.2. Bảo mật Database

**MongoDB Atlas:**

1. Sử dụng strong password
2. Whitelist IP addresses cụ thể (không dùng 0.0.0.0/0 trong production)
3. Enable MongoDB encryption at rest
4. Sử dụng MongoDB Atlas backup

**MongoDB Local:**

1. Enable authentication:
```bash
mongod --auth
```

2. Tạo admin user:
```javascript
use admin
db.createUser({
  user: "admin",
  pwd: "strong_password",
  roles: ["root"]
})
```

### 5.10.3. Bảo mật API

**CORS Configuration:**

Trong `server.js`, CORS đã được cấu hình:

```javascript
const cors = require("cors");
app.use(cors());
```

Đối với production, nên giới hạn origin:

```javascript
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

**Input Validation:**

Hệ thống sử dụng Mongoose schema validation để validate dữ liệu đầu vào.


## 5.11. XỬ LÝ SỰ CỐ VÀ TROUBLESHOOTING

### 5.11.1. Các lỗi thường gặp

**Lỗi 1: Không kết nối được MongoDB**

Triệu chứng:
```
MongooseServerSelectionError: connect ECONNREFUSED
```

Giải pháp:
- Kiểm tra MONGODB_URI trong .env
- Kiểm tra MongoDB service đang chạy: `sudo systemctl status mongod` (Linux)
- Kiểm tra network access trong MongoDB Atlas
- Kiểm tra firewall

**Lỗi 2: CORS Error**

Triệu chứng:
```
Access to XMLHttpRequest has been blocked by CORS policy
```

Giải pháp:
- Kiểm tra cấu hình CORS trong server.js
- Đảm bảo origin được whitelist
- Kiểm tra credentials: true nếu cần cookies

**Lỗi 3: JWT Token Invalid**

Triệu chứng:
```
JsonWebTokenError: invalid token
```

Giải pháp:
- Xóa token cũ trong localStorage
- Kiểm tra JWT_SECRET giống nhau giữa các lần deploy
- Kiểm tra token expiration time

**Lỗi 4: Port Already in Use**

Triệu chứng:
```
Error: listen EADDRINUSE: address already in use :::5000
```

Giải pháp:
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:5000 | xargs kill -9
```

**Lỗi 5: Module Not Found**

Triệu chứng:
```
Error: Cannot find module 'express'
```

Giải pháp:
```bash
rm -rf node_modules package-lock.json
npm install
```

**Lỗi 6: Python Module Not Found**

Triệu chứng:
```
ModuleNotFoundError: No module named 'numpy'
```

Giải pháp:
```bash
# Activate virtual environment
source .venv/bin/activate  # Linux/macOS
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

**Lỗi 7: Email Sending Failed**

Triệu chứng:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

Giải pháp:
- Sử dụng App Password thay vì mật khẩu Gmail thông thường
- Kiểm tra EMAIL_USER và EMAIL_PASSWORD trong .env
- Đảm bảo 2-Step Verification đã được bật

**Lỗi 8: Image Upload Failed**

Triệu chứng:
```
Error: Cloudinary configuration not found
```

Giải pháp:
- Kiểm tra Cloudinary credentials trong code
- Kiểm tra file size limit
- Kiểm tra network connection

### 5.11.2. Debug và Logging

**Enable Debug Mode:**

Backend:
```javascript
// server.js
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

Frontend:
```javascript
// Add to vite.config.js
export default defineConfig({
  // ...
  logLevel: 'info',
  server: {
    // ...
    debug: true
  }
})
```

**View Logs:**

```bash
# Server logs (nếu chạy với nodemon)
# Logs sẽ hiển thị trực tiếp trong terminal

# Application logs
# Kiểm tra console.log trong code
```

### 5.11.3. Performance Issues

**Vấn đề: Trang web load chậm**

Giải pháp:

1. **Optimize Images:**
   - Sử dụng Cloudinary auto-optimization
   - Compress images trước khi upload

2. **Database Indexing:**
```javascript
// Tạo indexes cho các trường thường query
db.products.createIndex({ name: "text", description: "text" });
db.products.createIndex({ categoryID: 1 });
db.orders.createIndex({ userID: 1, createdAt: -1 });
```

3. **Implement Pagination:**
   - Hệ thống đã implement pagination trong ProductController
   - Mặc định: 12 sản phẩm/trang

4. **Enable Caching:**
   - Browser caching cho static assets
   - Cloudinary caching cho images


## 5.12. TỐI ƯU HÓA HIỆU SUẤT

### 5.12.1. Frontend Optimization

**Code Splitting:**

```javascript
// App.jsx - Lazy loading routes
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/customer/HomePage'));
const ProductDetail = lazy(() => import('./pages/customer/ProductDetail'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </Suspense>
  );
}
```

**Image Optimization:**

```javascript
// Sử dụng lazy loading cho images
<img 
  src={product.image} 
  alt={product.name}
  loading="lazy"
  decoding="async"
/>
```

**Bundle Size Optimization:**

```bash
# Analyze bundle size
npm run build
```

### 5.12.2. Backend Optimization

**Database Query Optimization:**

Hệ thống đã sử dụng MongoDB aggregation pipeline trong ProductController để tối ưu queries:

```javascript
// Sử dụng select để chỉ lấy fields cần thiết
const products = await Product.find()
  .select('name price image categoryID')
  .lean(); // Trả về plain JavaScript objects

// Sử dụng populate hiệu quả
const orders = await Order.find()
  .populate('userID', 'fullName email')
  .populate({
    path: 'items.productID',
    select: 'name price image'
  });

// Sử dụng aggregation cho queries phức tạp
const pipeline = [
  { $match: matchStage },
  { $lookup: { ... } },
  { $sort: sortStage },
  { $skip: (page - 1) * limit },
  { $limit: limit }
];
```

### 5.12.3. CoIUM Algorithm Optimization

**Tối ưu thuật toán:**

```python
# Sử dụng numpy arrays thay vì Python lists
import numpy as np

# Vectorization
def calculate_utilities(transactions, profits):
    utilities = np.array([
        np.sum([profits[item] * qty for item, qty in trans])
        for trans in transactions
    ])
    return utilities
```

**Memory Optimization:**

```python
# Sử dụng generators thay vì lists
def read_transactions(filename):
    with open(filename, 'r') as f:
        for line in f:
            yield parse_transaction(line)

# Sử dụng generator
for trans in read_transactions('data.dat'):
    process_transaction(trans)
```

## 5.13. KẾT LUẬN

### 5.13.1. Tổng kết quy trình cài đặt

Chương này đã trình bày chi tiết quy trình cài đặt và triển khai hệ thống IconDenim từ môi trường phát triển, bao gồm:

1. **Cài đặt môi trường phát triển**: Node.js, Python, MongoDB, Git và các công cụ hỗ trợ
2. **Cấu hình Backend**: Cài đặt dependencies, cấu hình biến môi trường, kết nối database
3. **Cấu hình Frontend**: Cài đặt React application, cấu hình API endpoints, Tailwind CSS
4. **Triển khai CoIUM System**: Cài đặt Python dependencies, cấu hình thuật toán khai phá dữ liệu
5. **Khởi động hệ thống**: Hướng dẫn chạy development mode
6. **Import dữ liệu**: Tạo admin, dữ liệu mẫu
7. **Bảo mật cơ bản**: JWT, Database, CORS
8. **Troubleshooting**: Xử lý lỗi thường gặp
9. **Tối ưu hóa**: Frontend, backend, CoIUM optimization

### 5.13.2. Checklist hoàn thành

**Môi trường Development:**
- [ ] Node.js 20.x đã cài đặt
- [ ] Python 3.9+ đã cài đặt
- [ ] MongoDB đã cấu hình và kết nối thành công
- [ ] Git đã cài đặt
- [ ] Backend server chạy thành công trên port 5000
- [ ] Frontend client chạy thành công trên port 5173
- [ ] CoIUM system test thành công
- [ ] Database có dữ liệu mẫu
- [ ] Tài khoản admin đã tạo

### 5.13.3. Tài liệu tham khảo

**Công nghệ chính:**
- Node.js Documentation: https://nodejs.org/docs/
- React Documentation: https://react.dev/
- MongoDB Documentation: https://docs.mongodb.com/
- Express.js Guide: https://expressjs.com/
- Vite Documentation: https://vitejs.dev/
- Python Documentation: https://docs.python.org/3/
- NumPy Documentation: https://numpy.org/doc/

**Services:**
- MongoDB Atlas: https://docs.atlas.mongodb.com/
- Cloudinary Documentation: https://cloudinary.com/documentation
- PayOS Documentation: https://payos.vn/docs/
- Google Gemini AI: https://ai.google.dev/docs

**Libraries:**
- Mongoose Documentation: https://mongoosejs.com/docs/
- Axios Documentation: https://axios-http.com/docs/intro
- React Router: https://reactrouter.com/
- Redux Toolkit: https://redux-toolkit.js.org/
- Tailwind CSS: https://tailwindcss.com/docs
- Material-UI: https://mui.com/
- Ant Design: https://ant.design/docs/react/introduce

### 5.13.4. Hỗ trợ và liên hệ

Nếu gặp vấn đề trong quá trình cài đặt và triển khai, có thể tham khảo:

1. **Documentation**: Kiểm tra lại các bước trong tài liệu này
2. **Logs**: Xem logs để xác định nguyên nhân lỗi
3. **Community**: Tìm kiếm trên Stack Overflow, GitHub Issues
4. **Official Documentation**: Tham khảo tài liệu chính thức của từng công nghệ

**Lưu ý quan trọng:**
- Luôn backup dữ liệu trước khi thực hiện thay đổi lớn
- Test kỹ trên môi trường development
- Giữ bí mật các thông tin nhạy cảm (API keys, passwords, JWT secrets)
- Cập nhật dependencies thường xuyên để vá lỗi bảo mật
- Monitor hệ thống để phát hiện vấn đề sớm

---

**Kết thúc Chương 5: Hướng dẫn Cài đặt và Triển khai Hệ thống**

