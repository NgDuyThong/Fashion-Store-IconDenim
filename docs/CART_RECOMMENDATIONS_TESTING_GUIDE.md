# 🛒 Cart Recommendations Testing Guide

## 📋 Tổng quan
Hướng dẫn chi tiết để kiểm tra tính năng **Cart Recommendations** - Gợi ý sản phẩm dựa trên giỏ hàng sử dụng thuật toán CoIUM.

---

## 🎯 Tính năng đã implement

### Backend API
- **Endpoint**: `POST /api/cohui/cart-recommendations`
- **Controller**: `CoHUIController.getCartRecommendations()`
- **Thuật toán**: Weighted scoring dựa trên correlation map từ CoIUM
- **Fallback**: Sản phẩm cùng danh mục khi không có correlation data

### Frontend Integration
- **Component**: `RecommendationCarousel.jsx` (reusable component)
- **Page**: `Cart.jsx` - Hiển thị recommendations dưới giỏ hàng
- **Features**:
  - Auto-fetch khi thêm/xóa sản phẩm trong giỏ
  - Hiển thị correlation percentage
  - Match count badges
  - Loading skeleton states
  - Dark/Light/Tet theme support

---

## 🚀 Chuẩn bị môi trường test

### 1. Khởi động Backend
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\server
npm start
```

**Kiểm tra:**
- Server chạy trên port (thường là 5000 hoặc 3001)
- MongoDB đã kết nối thành công
- Console không có errors

### 2. Khởi động Frontend
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\client
npm run dev
```

**Kiểm tra:**
- Vite dev server chạy (thường port 5173)
- Browser tự động mở trang chủ
- Không có build errors

### 3. Kiểm tra Correlation Map
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\server\CoIUM
Get-Content correlation_map.json | ConvertFrom-Json | Measure-Object
```

**Expected**: File tồn tại và có dữ liệu JSON hợp lệ

---

## 🧪 Test Scenarios

### Scenario 1: Empty Cart (Baseline)
**Steps:**
1. Mở trang giỏ hàng `/cart`
2. Đảm bảo giỏ hàng trống

**Expected Results:**
- ✅ Không hiển thị phần "Sản phẩm gợi ý"
- ✅ Không có API calls tới `/cart-recommendations`
- ✅ Console không có errors

---

### Scenario 2: Single Product in Cart
**Steps:**
1. Thêm 1 sản phẩm vào giỏ (ví dụ: Áo Polo Nam)
2. Mở trang `/cart`
3. Quan sát phần recommendations xuất hiện

**Expected Results:**
- ✅ Loading skeleton hiển thị trong ~1-2 giây
- ✅ Carousel xuất hiện với tiêu đề "🔥 Sản phẩm được mua cùng"
- ✅ Subtitle hiển thị correlation score cao nhất (ví dụ: "85.2% khách hàng cũng mua những sản phẩm này")
- ✅ Hiển thị 1-8 sản phẩm gợi ý
- ✅ Mỗi product card có:
  - Badge correlation percentage (góc trên phải)
  - Hình ảnh sản phẩm
  - Tên sản phẩm
  - Giá (có discount nếu có)
  - Icon matches (ví dụ: "🔥 2 matches")
- ✅ Swiper navigation (prev/next arrows) hoạt động
- ✅ Hover effects hoạt động (scale, shadow)

**Developer Console Checks:**
```javascript
// Check console logs
"[Cart Recommendations] Fetching for X items"
"[Cart Recommendations] Received Y recommendations"

// Check API response (Network tab)
POST /api/cohui/cart-recommendations
Status: 200
Response: {
  success: true,
  recommendations: [...]
}
```

---

### Scenario 3: Multiple Products in Cart (High Correlation)
**Steps:**
1. Thêm 3-5 sản phẩm cùng category vào giỏ
   - Ví dụ: Áo Polo Nam + Quần Jean Nam + Áo Thun Nam
2. Mở trang `/cart`
3. Kiểm tra recommendations

**Expected Results:**
- ✅ Recommendations có nhiều matches (2-3+ matches per product)
- ✅ Correlation scores cao (>70%)
- ✅ Subtitle hiển thị correlation cao nhất
- ✅ Sản phẩm trong giỏ KHÔNG xuất hiện trong recommendations
- ✅ Badge "🔥 X matches" phản ánh số sản phẩm trong giỏ có correlation

**Advanced Checks:**
- Click vào 1 recommended product → Navigate tới ProductDetail
- Thêm recommended product vào giỏ → Recommendations tự động refresh
- Xóa 1 sản phẩm từ giỏ → Recommendations update ngay lập tức

---

### Scenario 4: Diverse Products in Cart (Low Correlation)
**Steps:**
1. Thêm các sản phẩm khác category hoàn toàn
   - Ví dụ: Áo Nam + Váy Nữ + Phụ kiện
2. Mở trang `/cart`

**Expected Results:**
- ✅ Vẫn có recommendations (fallback mechanism)
- ✅ Correlation scores thấp hơn (<60%)
- ✅ Có thể có mix của:
  - Sản phẩm có correlation thực
  - Sản phẩm cùng category (fallback)
- ✅ Subtitle vẫn hiển thị score cao nhất tìm được

---

### Scenario 5: No Correlation Data (Fallback Mode)
**Steps:**
1. Tạm thời rename file `correlation_map.json`
   ```powershell
   cd e:\DoAnTN\Fashion-Store-IconDenim\server\CoIUM
   Rename-Item correlation_map.json correlation_map.json.backup
   ```
2. Restart backend server
3. Thêm sản phẩm vào giỏ và mở `/cart`

**Expected Results:**
- ✅ API gọi fallback endpoint
- ✅ Recommendations vẫn hiển thị (sản phẩm cùng category)
- ✅ Không có correlation badges
- ✅ Console log: "Correlation map not found, using fallback"

**Cleanup:**
```powershell
Rename-Item correlation_map.json.backup correlation_map.json
```

---

## 🎨 UI/UX Testing

### Theme Compatibility
**Steps:**
1. Test với Light mode (default)
2. Chuyển sang Dark mode (nếu có toggle)
3. Test với Tet theme (nếu có)

**Expected:**
- ✅ Text colors readable trong mọi theme
- ✅ Card backgrounds phù hợp với theme
- ✅ Hover states không bị mất màu
- ✅ Badges và icons hiển thị rõ ràng

### Responsive Design
**Test Breakpoints:**
- **Mobile (320px-640px)**: 1-2 slides visible
- **Tablet (640px-1024px)**: 2-3 slides visible
- **Desktop (1024px+)**: 4-5 slides visible

**Steps:**
1. Mở DevTools → Toggle Device Toolbar
2. Test các breakpoints trên
3. Kiểm tra navigation arrows

**Expected:**
- ✅ Carousel điều chỉnh số slides tự động
- ✅ Product cards không bị squished
- ✅ Navigation arrows không bị overlap
- ✅ Spacing phù hợp với màn hình

---

## 🔍 API Testing (Advanced)

### Test với Postman/curl

**Request:**
```bash
POST http://localhost:5000/api/cohui/cart-recommendations
Content-Type: application/json

{
  "cartItems": [
    {
      "productID": "ObjectId_Product_1",
      "quantity": 2
    },
    {
      "productID": "ObjectId_Product_2",
      "quantity": 1
    }
  ]
}
```

**Query Parameters (optional):**
- `topN=8` - Số recommendations trả về (default: 8)
- `minCorrelation=0.5` - Ngưỡng correlation tối thiểu (default: 0.5)

**Expected Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "_id": "...",
      "productName": "...",
      "price": 299000,
      "discount": 20,
      "images": [...],
      "targetID": {...},
      "categoryID": {...},
      "correlation": 0.852,
      "matchCount": 2
    }
  ],
  "cartSize": 2
}
```

### Test Edge Cases

**Empty cartItems:**
```json
{"cartItems": []}
```
**Expected:** Empty recommendations array

**Invalid productID:**
```json
{
  "cartItems": [{"productID": "invalid_id", "quantity": 1}]
}
```
**Expected:** Skip invalid products, return recommendations for valid ones

**Very large cart (>20 items):**
**Expected:** API should still respond within 2-3 seconds

---

## 📊 Performance Testing

### Frontend Performance
**Metrics to Check (DevTools Performance tab):**
- ✅ API call completes < 500ms
- ✅ Component render < 100ms
- ✅ Swiper initialization < 50ms
- ✅ No layout shifts (CLS) during loading

### Backend Performance
**Check Server Logs:**
- Correlation map load time (should cache after first load)
- Query execution time for product lookups
- Total request processing time

**Optimization Tips:**
- Nếu correlation_map.json > 5MB → Consider caching in Redis
- Nếu API > 1s → Add database indexes on productID

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: No Recommendations Shown
**Symptoms:** Carousel không hiển thị sau khi thêm sản phẩm

**Debug Steps:**
1. Check browser console for errors
2. Check Network tab → Verify API call status 200
3. Check API response → Verify recommendations array not empty
4. Check React DevTools → Verify `recommendations` state populated

**Common Causes:**
- ❌ correlation_map.json missing → Use fallback
- ❌ No products in database → Seed sample data
- ❌ All recommended products already in cart → Adjust cart items

### Issue 2: Correlation Badges Show NaN or Undefined
**Symptoms:** Badge hiển thị "NaN%" hoặc trống

**Fix:**
- Check API response có field `correlation`
- Verify `showCorrelation` prop = true
- Check data mapping trong Cart.jsx

### Issue 3: API Returns 500 Error
**Symptoms:** Network tab shows 500 Internal Server Error

**Debug Steps:**
1. Check server console for stack trace
2. Common errors:
   - MongoDB connection lost
   - correlation_map.json parse error
   - Missing Product model import

**Fix:**
- Restart MongoDB service
- Validate correlation_map.json syntax
- Check CoHUIController imports

### Issue 4: Recommendations Don't Update After Cart Change
**Symptoms:** Thêm/xóa sản phẩm nhưng recommendations giữ nguyên

**Debug Steps:**
1. Check `useEffect` dependency array in Cart.jsx
2. Verify `cartItems` state updates correctly
3. Check debounce timer (500ms)

**Fix:**
- Ensure `cartItems` in useEffect deps
- Clear browser cache/local storage
- Check fetchCartRecommendations() execution

---

## ✅ Acceptance Criteria Checklist

### Functional Requirements
- [ ] Recommendations hiển thị khi có ≥1 sản phẩm trong giỏ
- [ ] API trả về 1-8 sản phẩm (tuỳ `topN`)
- [ ] Correlation scores hiển thị chính xác
- [ ] Match count badges hiển thị đúng
- [ ] Sản phẩm trong giỏ không xuất hiện trong recommendations
- [ ] Click vào recommendation → Navigate đến ProductDetail
- [ ] Auto-refresh khi cart items thay đổi

### Performance Requirements
- [ ] API response time < 500ms (90th percentile)
- [ ] Loading skeleton hiển thị ngay lập tức
- [ ] No janky animations (60fps)
- [ ] Debounce hoạt động (không spam API calls)

### UX Requirements
- [ ] Loading states rõ ràng
- [ ] Error states graceful (fallback to category products)
- [ ] Responsive trên mobile/tablet/desktop
- [ ] Theme compatibility (dark/light/tet)
- [ ] Hover effects smooth
- [ ] Navigation arrows intuitive

### Code Quality
- [ ] No console errors in browser
- [ ] No ESLint warnings
- [ ] API follows RESTful conventions
- [ ] Proper error handling (try/catch)
- [ ] Code comments for complex logic

---

## 📝 Test Report Template

```markdown
## Test Report - Cart Recommendations
**Date:** [Date]
**Tester:** [Your Name]
**Environment:** Dev/Staging/Production

### Test Results
| Scenario | Status | Notes |
|----------|--------|-------|
| Empty Cart | ✅ Pass | No recommendations shown |
| Single Product | ✅ Pass | 6 recommendations, avg correlation 78% |
| Multiple Products | ✅ Pass | High correlation (85%+), 3 matches |
| Low Correlation | ⚠️ Partial | Fallback works but slow (800ms) |
| No Correlation Data | ✅ Pass | Fallback to category products |

### Issues Found
1. **Issue:** API slow with 10+ cart items
   - **Severity:** Medium
   - **Recommendation:** Add caching or pagination

2. **Issue:** Correlation badges overlap on mobile <360px
   - **Severity:** Low
   - **Recommendation:** Adjust badge positioning for very small screens

### Performance Metrics
- API Response Time (avg): 320ms
- Component Render Time: 45ms
- Swiper Init Time: 28ms

### Recommendations
- ✅ Feature ready for production
- Consider adding analytics tracking for recommendation clicks
- Monitor API performance under load
```

---

## 🎓 Next Steps

1. **Complete Testing**: Chạy qua tất cả scenarios trong guide này
2. **Document Bugs**: Ghi lại issues (nếu có) theo template
3. **Performance Tuning**: Optimize nếu API > 500ms
4. **User Testing**: Thu thập feedback từ real users
5. **Analytics Setup**: Track recommendation click-through rate

---

## 📚 Related Documentation
- [COIUM_UPDATE_SUMMARY.md](./COIUM_UPDATE_SUMMARY.md) - Tổng quan minCor updates
- [COIUM_TESTING_CHECKLIST.md](./COIUM_TESTING_CHECKLIST.md) - CoIUM algorithm testing
- [SIMILAR_PRODUCTS_RECOMMENDATION.md](./SIMILAR_PRODUCTS_RECOMMENDATION.md) - ProductDetail recommendations

---

**Created:** 2025
**Last Updated:** 2025
**Version:** 1.0
