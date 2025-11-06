# Trang Lọc Đơn Hàng CoHUI

**URL:** `http://localhost:5173/admin/cohui`

## 📋 Tổng Quan

Trang quản lý và phân tích sản phẩm dựa trên thuật toán CoIUM (Correlation-based Item Utility Mining). Trang này cung cấp 3 chức năng chính để xem kết quả lọc đơn hàng.

---

## 🎯 Các Tab Chức Năng

### 1. **Gợi Ý Chung** (General Recommendations)

**API:** `GET http://localhost:5000/api/cohui/recommendations`

**Mục đích:** Hiển thị danh sách tất cả sản phẩm được gợi ý nhiều nhất dựa trên phân tích CoIUM

**Tính năng:**
- Hiển thị thống kê tổng quan (tổng sản phẩm, nguồn dữ liệu, top sản phẩm)
- Danh sách sản phẩm được sắp xếp theo điểm số (frequency × avgCorrelation)
- Nút "Làm mới" để reload dữ liệu
- Hiển thị rank badge cho top 3 sản phẩm (vàng, bạc, đồng)

**Thông tin hiển thị:**
- Rank (thứ hạng)
- Hình ảnh sản phẩm
- Mã sản phẩm & Tên sản phẩm
- Giá
- Frequency (số lần xuất hiện trong recommendations)
- Avg Correlation (độ tương quan trung bình)
- Score (điểm tổng hợp)

---

### 2. **Theo Sản Phẩm** (By Product)

**API:** `GET http://localhost:5000/api/cohui/recommendations/:productID`

**Mục đích:** Tìm kiếm các sản phẩm tương quan với 1 sản phẩm cụ thể

**Cách sử dụng:**
1. Nhập mã sản phẩm vào ô tìm kiếm (VD: 104)
2. Click nút "Tìm kiếm" hoặc Enter
3. Xem danh sách sản phẩm tương quan

**Tính năng:**
- Search box để nhập productID
- Hiển thị thông tin sản phẩm được chọn
- Danh sách sản phẩm tương quan được sắp xếp theo độ ưu tiên

**Use Case:**
- Kiểm tra xem sản phẩm X có correlation với những sản phẩm nào
- Verify kết quả của thuật toán CoIUM
- Tìm sản phẩm để cross-sell

---

### 3. **Mua Cùng** (Bought Together)

**API:** `GET http://localhost:5000/api/cohui/bought-together/:productID`

**Mục đích:** Tìm các sản phẩm thường được mua cùng với 1 sản phẩm cụ thể

**Cách sử dụng:**
1. Nhập mã sản phẩm vào ô tìm kiếm (VD: 104)
2. Click nút "Tìm kiếm" (màu xanh lá) hoặc Enter
3. Xem danh sách sản phẩm mua cùng

**Tính năng:**
- Search box để nhập productID
- Hiển thị thông tin sản phẩm được chọn (border màu xanh lá)
- Danh sách sản phẩm thường mua cùng

**Use Case:**
- Bundle products (tạo combo sản phẩm)
- Upsell recommendations
- Phân tích hành vi mua hàng

---

## 🎨 Giao Diện

### Đặc điểm:
- ✅ Responsive design (desktop + mobile)
- ✅ Dark mode support
- ✅ Loading states với spinner
- ✅ Empty states với icons & messages
- ✅ Toast notifications
- ✅ Rank badges cho top 3
- ✅ Hover effects
- ✅ Smooth transitions

### Color Scheme:
- **Tab General:** Blue (#3B82F6)
- **Tab By Product:** Blue (#3B82F6)
- **Tab Bought Together:** Green (#10B981)
- **Rank 1:** Gold (#EAB308)
- **Rank 2:** Silver (#9CA3AF)
- **Rank 3:** Bronze (#EA580C)

---

## 📊 Stats Cards

Trang hiển thị 3 cards thống kê ở tab "Gợi ý chung":

1. **Tổng sản phẩm** (Blue gradient)
   - Icon: Package
   - Số lượng sản phẩm được phân tích

2. **Nguồn dữ liệu** (Green gradient)
   - Icon: BarChart2
   - Text: "CoIUM"

3. **Top sản phẩm** (Purple gradient)
   - Icon: TrendingUp
   - ProductID của sản phẩm đứng đầu

---

## 🔄 Quy Trình Hoạt Động

### Khi vào trang:
1. Tự động load tab "Gợi ý chung"
2. Gọi API `/api/cohui/recommendations`
3. Hiển thị danh sách tất cả sản phẩm

### Khi switch tab:
- Tab không tự động load data (trừ General)
- User phải nhập productID và tìm kiếm

### Khi search:
1. Validate productID (không rỗng)
2. Call API với productID
3. Show loading spinner
4. Hiển thị kết quả hoặc error message

---

## 🚀 Testing

### Test Case 1: General Tab
```
URL: http://localhost:5173/admin/cohui
Expected: Hiển thị danh sách 104 sản phẩm
Top 3: #31, #30, #59
```

### Test Case 2: By Product
```
Input: productID = 104
Expected: Danh sách products tương quan với #104
Verify: So sánh với correlation_map.json
```

### Test Case 3: Bought Together
```
Input: productID = 104
Expected: Danh sách products mua cùng #104
Verify: Kết quả giống với By Product (cùng API)
```

### Test Case 4: Error Handling
```
Input: productID = 999 (không tồn tại)
Expected: Toast error "Không tìm thấy sản phẩm"
```

---

## 📝 Lưu Ý

1. **Phải chạy CoIUM trước:**
   - Vào `/admin/orders`
   - Click nút "Chạy CoIUM"
   - Đợi 2-5 phút

2. **Quyền truy cập:**
   - Chỉ admin và order_manager có quyền
   - Route: `/admin/cohui`

3. **Data source:**
   - Tất cả data từ `server/CoIUM/correlation_map.json`
   - File này được tạo bởi quy trình CoIUM

4. **Refresh data:**
   - Cần chạy lại CoIUM để cập nhật
   - File correlation_map.json tự động reload khi thay đổi

---

## 🔗 Liên Kết

- **Component:** `client/src/pages/admin/CoHUIManagement.jsx`
- **Route:** Defined in `client/src/App.jsx`
- **Sidebar:** `client/src/components/Sidebar.jsx`
- **APIs:** Defined in `server/controllers/CoHUIController.js`

---

**Tạo bởi:** GitHub Copilot  
**Ngày:** 2/11/2025
