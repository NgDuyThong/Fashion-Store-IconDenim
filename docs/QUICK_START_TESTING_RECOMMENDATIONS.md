# 🚀 Quick Start - Testing Cart & Product Recommendations

## Mục đích
Guide nhanh để test 2 tính năng vừa implement: **Cart Recommendations** và **Product Detail Similar Products**. Follow từng bước để kiểm tra kỹ càng.

---

## ⚡ Quick Setup (5 phút)

### 1. Start Backend
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\server
npm start
```
**Wait for:** `✓ Server running on port XXXX` và `✓ MongoDB connected`

### 2. Start Frontend
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\client
npm run dev
```
**Wait for:** `➜ Local: http://localhost:5173/`

### 3. Verify Correlation Data
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\server\CoIUM
Test-Path correlation_map.json
```
**Expected:** `True`

**Nếu False (không có file):**
```powershell
# Generate correlation map
cd e:\DoAnTN\Fashion-Store-IconDenim\CoIUM_Final
python run_fashion_store.py
```
*Lưu ý: Chạy này mất ~10-30 phút tuỳ data size*

---

## 🛒 Test 1: Cart Recommendations (5 phút)

### Basic Flow
1. **Mở trang chủ:** http://localhost:5173
2. **Thêm 2-3 sản phẩm vào giỏ hàng:**
   - Click vào 1 product
   - Chọn size/color
   - Click "Thêm vào giỏ"
   - Repeat cho 2-3 products khác

3. **Mở giỏ hàng:** Click icon giỏ hàng (góc trên phải)

4. **Kiểm tra recommendations section:**

### ✅ Expected Results
**Phải thấy:**
- Section title: **"🔥 Sản phẩm được mua cùng"**
- Subtitle với correlation score (ví dụ: "85.2% khách hàng cũng mua...")
- Carousel với 4-8 sản phẩm gợi ý
- Mỗi product có:
  - **Badge correlation %** (góc trên phải)
  - Hình ảnh sản phẩm
  - Tên + giá
  - **Match count badge** (🔥 X matches)
- Navigation arrows (prev/next)

**Loading sequence:**
1. Thêm product vào giỏ → Loading skeleton (1-2s)
2. Skeleton biến mất → Recommendations xuất hiện
3. Smooth transition, không bị jump/flash

### 🐛 Quick Debug
**Nếu không có recommendations:**
```javascript
// Mở Browser Console (F12)
// Kiểm tra logs:
"[Cart Recommendations] Fetching for X items"
"[Cart Recommendations] Received Y recommendations"

// Nếu không có logs → Check Network tab
// Phải có request: POST /api/cohui/cart-recommendations
// Status: 200
```

**Common Issues:**
- ❌ Empty recommendations → Check database có products
- ❌ API 500 error → Check server console logs
- ❌ Correlation badges = NaN → Check correlation_map.json

---

## 👕 Test 2: Product Detail Similar Products (3 phút)

### Basic Flow
1. **Click vào 1 sản phẩm bất kỳ** từ trang chủ/catalog
2. **Scroll xuống cuối trang** → Tìm section "Sản phẩm tương tự"
3. **Quan sát recommendations**

### ✅ Expected Results (CoIUM Mode)
**Khi có correlation data:**
- Section title: **"🔥 Sản phẩm tương tự (CoIUM)"**
- Icon: **Fire (🔥)** thay vì Tshirt
- Subtitle: "Dựa trên phân tích CoIUM, XX% khách hàng..."
- **Correlation badges** hiển thị trên mỗi product
- Carousel với 4-5+ products

**Khi không có correlation (Fallback mode):**
- Section title: **"👕 Sản phẩm tương tự"** (không có "(CoIUM)")
- Icon: **Tshirt (👕)**
- Subtitle: "Các sản phẩm có thể bạn quan tâm"
- **Không có correlation badges**
- Products cùng category/target

### 🔄 Test Interaction
1. **Click prev/next arrows** → Carousel scroll smooth
2. **Click vào 1 recommended product** → Navigate tới product đó
3. **Check similar products** của product mới → Section update correctly

---

## 📱 Test 3: Responsive (2 phút)

### Quick Responsive Check
1. **Mở DevTools:** `F12`
2. **Toggle Device Toolbar:** `Ctrl+Shift+M`
3. **Test 3 breakpoints:**

**Mobile (iPhone SE - 375px):**
- [ ] 2 slides visible
- [ ] Text không bị cut off
- [ ] Touch swipe hoạt động

**Tablet (iPad - 768px):**
- [ ] 3 slides visible
- [ ] Spacing OK
- [ ] Navigation arrows visible

**Desktop (1440px):**
- [ ] 4-5 slides visible
- [ ] Hover effects hoạt động
- [ ] Smooth animations

---

## 🎨 Test 4: Theme Compatibility (1 phút)

### If you have theme toggle:
1. **Light mode** (default) → Check readability
2. **Dark mode** → Text colors contrast
3. **Tet theme** (nếu có) → Colors festive

**Should work in ALL themes:**
- [ ] Text readable (không bị mờ)
- [ ] Badges stand out
- [ ] Hover states visible
- [ ] Borders/shadows subtle but visible

---

## 🏁 Quick Acceptance Checklist

### Must Pass (Critical)
- [ ] Cart recommendations hiển thị khi có ≥1 product
- [ ] Product detail similar products hiển thị
- [ ] Correlation badges hiển thị khi có data (CoIUM mode)
- [ ] Click product → Navigate correctly
- [ ] No console errors
- [ ] Responsive trên mobile/desktop

### Should Pass (Important)
- [ ] API response < 500ms
- [ ] Loading skeletons smooth
- [ ] Hover effects hoạt động
- [ ] Carousel navigation smooth
- [ ] Theme colors compatible

### Nice to Have
- [ ] Match count badges
- [ ] Fallback mechanism works
- [ ] Debounce (không spam API khi thay đổi cart nhanh)

---

## 📊 Performance Quick Check

### Browser Console Check
```javascript
// Paste vào Console (F12):
performance.measure('pageLoad');
console.log(performance.getEntriesByType('navigation')[0].loadEventEnd);
// Expected: < 2000ms
```

### Network Tab Check
1. Open Network tab
2. Refresh page
3. Check:
   - **API calls < 500ms**
   - **Images load progressively** (lazy loading)
   - **Total requests < 50** (reasonable)

---

## 🐞 Common Issues - Quick Fixes

### Issue 1: "Cannot read property 'correlation' of undefined"
**Fix:**
```javascript
// Check API response có field correlation
// Nếu không → Fallback mode đang active (OK, not an error)
```

### Issue 2: Recommendations trống dù có products
**Fix:**
1. Check database: `db.products.countDocuments()` (phải > 10)
2. Check correlation_map.json có data
3. Restart backend server

### Issue 3: API 500 error
**Fix:**
1. Check server console logs
2. Common: MongoDB disconnected → Restart MongoDB service
3. Check correlation_map.json syntax valid

### Issue 4: Styling bị lỗi (cards overlap, etc.)
**Fix:**
1. Clear browser cache: `Ctrl+Shift+Del`
2. Hard refresh: `Ctrl+F5`
3. Check Tailwind CSS compiled: `npm run dev` restart

---

## 📞 Need More Details?

**Detailed Testing Guides:**
- [CART_RECOMMENDATIONS_TESTING_GUIDE.md](./CART_RECOMMENDATIONS_TESTING_GUIDE.md) - 3000+ words full guide
- [PRODUCT_DETAIL_RECOMMENDATIONS_TESTING_GUIDE.md](./PRODUCT_DETAIL_RECOMMENDATIONS_TESTING_GUIDE.md) - Comprehensive product detail testing

**Technical Documentation:**
- [COIUM_UPDATE_SUMMARY.md](./COIUM_UPDATE_SUMMARY.md) - MinCor updates
- [COIUM_QUICK_REFERENCE.md](./COIUM_QUICK_REFERENCE.md) - CoIUM algorithm quick reference

**Implementation Details:**
- `server/controllers/CoHUIController.js` - Backend logic
- `client/src/components/RecommendationCarousel.jsx` - UI component
- `client/src/pages/customer/cart/Cart.jsx` - Cart integration
- `client/src/pages/customer/product/ProductDetail.jsx` - Product detail integration

---

## ✨ Pro Tips

### Tip 1: Test với Data Thực
- Nếu test với dummy/seed data → Results có thể không realistic
- Generate correlation map với real order data → Results accurate hơn

### Tip 2: Monitor Performance
```powershell
# Check API response times
cd e:\DoAnTN\Fashion-Store-IconDenim\server
# Add logging in CoHUIController.js
console.time('cart-recommendations');
// ... API logic
console.timeEnd('cart-recommendations');
```

### Tip 3: Test Edge Cases
- Empty cart
- 1 product vs 10 products
- Products không có correlation data
- Network slow (DevTools → Network → Slow 3G)

### Tip 4: Use React DevTools
- Install React DevTools extension
- Inspect `RecommendationCarousel` component
- Check props: `products`, `showCorrelation`, `loading`
- Verify state updates correctly

---

## 🎯 Test Report Template

```markdown
## Quick Test Report
**Date:** [Date]
**Tester:** [Name]
**Duration:** [Time spent]

### Results
- [x] Cart Recommendations: PASS
- [x] Product Detail Similar Products: PASS
- [x] Responsive Design: PASS
- [ ] Theme Compatibility: PARTIAL (Dark mode text contrast low)

### Issues Found
1. API slow with 10+ cart items (~800ms)
2. Mobile landscape mode: cards too small

### Notes
- Overall functionality works well
- Need performance optimization for large carts
- Consider analytics tracking for recommendation clicks

### Next Steps
- Fix dark mode contrast
- Optimize API caching
- Add unit tests for carousel component
```

---

## 📈 Success Metrics

**After Testing, Track These:**
- Cart recommendations click-through rate (target: >10%)
- Product detail similar products clicks (target: >15%)
- API response times (target: <300ms avg)
- User engagement time increase (measure with analytics)

---

**Version:** 1.0  
**Last Updated:** 2025  
**Estimated Testing Time:** 15-20 minutes total

---

## ✅ You're Ready!

Nếu tất cả tests trên pass → **Feature ready for production** 🎉

Còn issues → Check detailed guides ở trên hoặc debug với team.

**Good luck! 🚀**
