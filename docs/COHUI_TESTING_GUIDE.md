# 🧪 CoHUI Testing Guide - Quick Reference

## 🚀 Cách test tính năng "Sản phẩm tương tự"

### Bước 1: Đảm bảo Server đang chạy
```bash
# Terminal 1: Backend
cd server
npm start
# Server chạy tại: http://localhost:5000

# Terminal 2: Frontend  
cd client
npm run dev
# Client chạy tại: http://localhost:5173
```

---

## 📦 Test Cases

### Test Case 1: Sản phẩm CÓ tương quan CoHUI ✅

**Sản phẩm test:** 
- Product ID: **68** (Wool Trench Coat)
- Product ID: **64** (Áo vest suông SOLAR)
- Product ID: **104** (Đầm lụa suông thêu hoa)

**Các bước:**
1. Truy cập: `http://localhost:5173/product/68`
2. Scroll xuống cuối trang
3. Quan sát section **"Sản phẩm tương tự"**

**Kết quả mong đợi:**
```
✅ Title: "Sản phẩm tương tự"
✅ Subtitle: "⚡ Các sản phẩm thường được mua cùng nhau • Được đề xuất bởi thuật toán CoHUI"
✅ Badge: "⚡ X.X% tương quan" (màu đỏ/xanh)
✅ Điểm: "Điểm CoHUI: XX.XM"
✅ Hiển thị 2-5 sản phẩm
```

**Console log:**
```
✅ CoHUI: Tìm thấy X sản phẩm có tương quan cao
```

---

### Test Case 2: Sản phẩm KHÔNG có tương quan (Fallback) 🔄

**Sản phẩm test:**
- Bất kỳ product ID không trong top patterns (VD: 1, 2, 3, 15, 20...)

**Các bước:**
1. Truy cập: `http://localhost:5173/product/1`
2. Scroll xuống cuối trang
3. Quan sát section gợi ý

**Kết quả mong đợi:**
```
✅ Title: "Sản phẩm liên quan"  (NOT "Sản phẩm tương tự")
✅ Subtitle: "👕 Sản phẩm cùng danh mục với giá tương đương"
✅ Badge: "👕 XX% tương đồng" (màu cam/xanh lá)
✅ Điểm: "Điểm tương đồng: XX%"
✅ Hiển thị 5-6 sản phẩm cùng category
```

**Console log:**
```
⚠️ CoHUI không có kết quả, chuyển sang fallback...
🔄 Đang lấy sản phẩm cùng danh mục...
✅ Fallback: Tìm thấy X sản phẩm cùng danh mục
```

---

### Test Case 3: Kiểm tra Navigation

**Các bước:**
1. Ở Product Detail page, click vào 1 sản phẩm gợi ý
2. Page chuyển sang sản phẩm mới
3. Section "Sản phẩm tương tự" load lại với data mới

**Kết quả mong đợi:**
```
✅ URL thay đổi: /product/68 → /product/36
✅ Product detail cập nhật
✅ Section gợi ý load lại (có spinner)
✅ Hiển thị gợi ý cho sản phẩm mới
```

---

### Test Case 4: Responsive Design

**Các bước:**
1. Mở trang product detail
2. Resize browser window:
   - Desktop (>1024px): 5 cột
   - Tablet (768-1024px): 3 cột
   - Mobile (<768px): 2 cột

**Kết quả mong đợi:**
```
✅ Grid layout responsive
✅ Cards không bị vỡ
✅ Images scale properly
✅ Text không overflow
```

---

## 🔍 Debug Console Logs

### CoHUI Success Flow
```javascript
✅ CoHUI: Tìm thấy 2 sản phẩm có tương quan cao
// Network: GET /api/cohui/bought-together/68 → 200 OK
{
  success: true,
  recommendations: [
    {
      productID: 36,
      score: 8613732.14,
      confidence: 5.71,
      productDetails: {...}
    }
  ]
}
```

### Fallback Flow
```javascript
⚠️ CoHUI không có kết quả, chuyển sang fallback...
🔄 Đang lấy sản phẩm cùng danh mục...
✅ Fallback: Tìm thấy 6 sản phẩm cùng danh mục
// Network: GET /api/products?categoryID=1&limit=10 → 200 OK
{
  products: [...]
}
```

---

## 🎨 Visual Differences

### CoHUI Mode
```
┌────────────────────────────────┐
│ Product Image                  │
│ ┌─────────────────────────┐   │
│ │ ⚡ 8.5% tương quan      │   │ ← Badge đỏ/xanh
│ └─────────────────────────┘   │
├────────────────────────────────┤
│ Product Name                   │
│ 500,000₫                       │
│ ⭐⭐⭐⭐⭐ (4.5)                │
│ Điểm CoHUI: 146.2M            │ ← Score lớn
└────────────────────────────────┘
```

### Fallback Mode
```
┌────────────────────────────────┐
│ Product Image                  │
│ ┌─────────────────────────┐   │
│ │ 👕 75% tương đồng       │   │ ← Badge cam/xanh lá
│ └─────────────────────────┘   │
├────────────────────────────────┤
│ Product Name                   │
│ 520,000₫                       │
│ ⭐⭐⭐⭐ (4.2)                  │
│ Điểm tương đồng: 75%          │ ← Score % nhỏ hơn
└────────────────────────────────┘
```

---

## 🛠️ Troubleshooting

### Vấn đề 1: Không hiển thị section gợi ý
**Nguyên nhân:** `similarProducts.length === 0`

**Kiểm tra:**
1. Mở Console → Network tab
2. Xem request `/api/cohui/bought-together/:id`
3. Check response có recommendations không

**Giải pháp:**
- Nếu API trả về empty → Bình thường, sẽ dùng fallback
- Nếu API error 500 → Check server logs
- Nếu không có request → Check useEffect dependency

---

### Vấn đề 2: Loading spinner không biến mất
**Nguyên nhân:** `setSimilarLoading(false)` không được gọi

**Kiểm tra:**
```javascript
// Trong useEffect, đảm bảo có finally block:
finally {
  setSimilarLoading(false);
}
```

---

### Vấn đề 3: Badge màu sai
**Nguyên nhân:** `item.isFallback` không được set

**Kiểm tra:**
```javascript
// Fallback products phải có:
{
  productDetails: p,
  score: similarity * 10000,
  confidence: similarity.toFixed(1),
  isFallback: true  // ← Quan trọng!
}
```

---

### Vấn đề 4: Giá không format đúng
**Nguyên nhân:** Product object thiếu `price` field

**Kiểm tra:**
```javascript
product.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
//          ↑ Optional chaining để tránh crash
```

---

## 📊 Test với Database

### Kiểm tra sản phẩm có trong CoHUI patterns
```bash
cd server
node analyze-patterns.js
```

**Output:**
```
🔥 Top 20 Patterns:
1. Pattern [68] - Xuất hiện 5 lần (Correlation: 0.48%)
2. Pattern [68, 36] - Xuất hiện 2 lần (Correlation: 0.19%)
...
```

→ Sản phẩm 68, 36 chắc chắn có CoHUI recommendations

---

### Test API trực tiếp
```bash
# Test bought-together
curl http://localhost:5000/api/cohui/bought-together/68

# Test recommendations
curl http://localhost:5000/api/cohui/recommendations

# Test statistics
curl http://localhost:5000/api/cohui/statistics
```

---

## ✅ Success Criteria Checklist

Tính năng hoạt động đúng khi:

- [ ] Sản phẩm có CoHUI patterns hiển thị "Sản phẩm tương tự" với badge "⚡ % tương quan"
- [ ] Sản phẩm không có patterns hiển thị "Sản phẩm liên quan" với badge "👕 % tương đồng"
- [ ] Loading spinner xuất hiện khi fetch data
- [ ] Grid responsive trên mobile/tablet/desktop
- [ ] Click vào sản phẩm gợi ý navigate đúng
- [ ] Console logs rõ ràng (CoHUI/Fallback)
- [ ] Không có errors trong Console
- [ ] API response time < 5s (CoHUI) hoặc < 1s (Fallback)
- [ ] Mọi sản phẩm đều có ít nhất 1 gợi ý

---

## 🎯 Quick Commands

```bash
# Test full suite
cd server && node test-cohui.js

# Test with real data
cd server && node test-with-real-data.js

# Analyze patterns
cd server && node analyze-patterns.js

# Check database
cd server && node check-data.js

# Test Python service
cd server && node test-python-stdin.js

# Start everything
npm start  # Trong thư mục server
npm run dev  # Trong thư mục client (terminal khác)
```

---

## 📖 Reference Documents

- `COHUI_INTEGRATION_GUIDE.md` - Chi tiết kỹ thuật
- `COHUI_QUICK_START.md` - Hướng dẫn nhanh
- `COHUI_PRODUCT_DETAIL_INTEGRATION.md` - Tích hợp product detail
- `SIMILAR_PRODUCTS_RECOMMENDATION.md` - Cơ chế fallback
- `COHUI_COMPLETION_SUMMARY.md` - Tổng kết dự án

---

**Happy Testing! 🎉**

*Last Updated: November 2, 2025*
