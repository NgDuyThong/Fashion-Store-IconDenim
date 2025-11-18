# 👕 Product Detail Recommendations Testing Guide

## 📋 Tổng quan
Hướng dẫn chi tiết để kiểm tra tính năng **Product Detail Similar Products** sau khi refactor sử dụng component `RecommendationCarousel`.

---

## 🎯 Thay đổi đã implement

### Code Refactoring
**Before (Old Code):**
- ~150 lines custom JSX cho similar products section
- Inline Swiper configuration
- Duplicate badge/card rendering logic
- Hard-coded styling và theme logic

**After (New Code):**
- ~15 lines JSX sử dụng `RecommendationCarousel` component
- Reusable component với consistent UX
- DRY principle (Don't Repeat Yourself)
- Centralized styling và theme management

### Key Changes
**File:** `client/src/pages/customer/product/ProductDetail.jsx`

1. **Imports Added:**
   ```javascript
   import RecommendationCarousel from '../../components/RecommendationCarousel';
   import { FaFire } from 'react-icons/fa';
   ```

2. **Rendering Logic:**
   ```javascript
   {similarProducts.length > 0 && (
     <RecommendationCarousel
       products={similarProducts.map(product => ({
         ...product,
         correlation: product.correlation,
         matchCount: product.matchCount
       }))}
       title={similarProducts[0]?.isFromCoIUM ? "Sản phẩm tương tự (CoIUM)" : "Sản phẩm tương tự"}
       subtitle={/* ... */}
       icon={similarProducts[0]?.isFromCoIUM ? FaFire : FaTshirt}
       loading={loading}
       showCorrelation={!!similarProducts[0]?.correlation}
       minSlides={2}
     />
   )}
   ```

3. **Backward Compatibility:**
   - Vẫn giữ logic fetch từ API `/api/cohui/recommendations/:productID`
   - Vẫn có fallback mechanism (same targetID/gender)
   - Data format không thay đổi

---

## 🚀 Chuẩn bị môi trường test

### 1. Khởi động Backend
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\server
npm start
```

### 2. Khởi động Frontend
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\client
npm run dev
```

### 3. Verify Correlation Map
```powershell
cd e:\DoAnTN\Fashion-Store-IconDenim\server\CoIUM
Test-Path correlation_map.json
```
**Expected:** True

---

## 🧪 Test Scenarios

### Scenario 1: CoIUM-Based Recommendations (High Correlation)
**Steps:**
1. Navigate tới 1 product detail page (ví dụ: `/product/:id` của Áo Polo Nam)
2. Scroll xuống phần "Sản phẩm tương tự"
3. Quan sát recommendations

**Expected Results:**
- ✅ Section title: **"🔥 Sản phẩm tương tự (CoIUM)"**
- ✅ Icon: **Fire icon (🔥)** thay vì TShirt icon
- ✅ Subtitle hiển thị correlation: *"Dựa trên phân tích CoIUM, 87.4% khách hàng quan tâm sản phẩm này cũng xem sản phẩm tương tự"*
- ✅ Mỗi product card có:
  - **Correlation badge** (góc trên phải): "87.4%"
  - Hình ảnh sản phẩm
  - Tên sản phẩm
  - Giá (có discount nếu có)
  - Match count badge (nếu có): "🔥 2 matches"
- ✅ Swiper navigation hoạt động (prev/next arrows)
- ✅ Responsive breakpoints:
  - Mobile: 2 slides
  - Tablet: 3 slides
  - Desktop: 4-5 slides

**Visual Checks:**
- [ ] Loading skeleton hiển thị trước khi data load
- [ ] Smooth transition từ skeleton → actual products
- [ ] Hover effects (scale, shadow) hoạt động
- [ ] Theme colors phù hợp (dark/light/tet)

---

### Scenario 2: Fallback Recommendations (Same Category)
**Steps:**
1. Navigate tới 1 product ít popular hoặc mới (ít correlation data)
2. Scroll xuống phần "Sản phẩm tương tự"

**Expected Results:**
- ✅ Section title: **"👕 Sản phẩm tương tự"** (không có "(CoIUM)")
- ✅ Icon: **TShirt icon (👕)** thay vì Fire icon
- ✅ Subtitle đơn giản: *"Các sản phẩm có thể bạn quan tâm"*
- ✅ **Không có correlation badges**
- ✅ Sản phẩm cùng `targetID` và `gender`
- ✅ Swiper vẫn hoạt động bình thường

**Fallback Logic Check:**
- Products có cùng target audience (Nam/Nữ/Unisex)
- Products có cùng category (nếu có)
- Không trùng với product hiện tại

---

### Scenario 3: No Similar Products Found
**Steps:**
1. Navigate tới 1 product unique hoặc mới tạo (không có related products)
2. Check phần similar products

**Expected Results:**
- ✅ Section **không hiển thị** (conditional rendering)
- ✅ Không có placeholder "No products found"
- ✅ Page vẫn render bình thường các sections khác

---

### Scenario 4: Loading State
**Steps:**
1. Throttle network speed (DevTools → Network → Slow 3G)
2. Navigate tới product detail page
3. Quan sát loading sequence

**Expected Results:**
- ✅ **Skeleton loading** hiển thị ngay lập tức:
  - 4-5 card skeletons với animation pulse
  - Gray boxes cho image/title/price
  - Smooth gradient animation
- ✅ Skeleton → Actual products transition smooth (không bị jump)
- ✅ Loading state không block page interaction
- ✅ Sau data load → Skeleton disappear

**Performance:**
- Loading skeleton render < 50ms
- Skeleton → Content transition < 100ms

---

### Scenario 5: Carousel Navigation & Interaction
**Steps:**
1. Mở product detail với ≥5 similar products
2. Test carousel features:
   - Click prev/next arrows
   - Drag/swipe on mobile
   - Keyboard navigation (if supported)
   - Click vào 1 recommended product

**Expected Results:**
- ✅ Arrows visible khi có nhiều slides
- ✅ Smooth scrolling animation (không bị lag)
- ✅ Loop disabled (đến slide cuối không quay lại đầu)
- ✅ Click product → Navigate tới ProductDetail của product đó
- ✅ Similar products của product mới load correctly
- ✅ Navigation state updates (active slide indicator)

---

### Scenario 6: Responsive Design Testing

**Mobile (320px - 640px):**
- [ ] 2 slides visible
- [ ] Cards không bị squished
- [ ] Text readable (không bị cut off)
- [ ] Badges không overlap với image
- [ ] Touch swipe hoạt động smooth

**Tablet (640px - 1024px):**
- [ ] 3 slides visible
- [ ] Spacing phù hợp
- [ ] Navigation arrows không bị ẩn
- [ ] Hover states hoạt động (nếu có mouse)

**Desktop (1024px+):**
- [ ] 4-5 slides visible
- [ ] Cards có shadow khi hover
- [ ] Scale animation smooth
- [ ] Arrows có enough space

**Test Steps:**
```
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Test các preset devices:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1440px)
4. Custom widths: 320px, 640px, 1024px, 1920px
```

---

## 🎨 UI/UX Consistency Testing

### Compare with Cart Recommendations
**Requirement:** RecommendationCarousel phải render giống nhau ở Cart và ProductDetail

**Test:**
1. Mở Cart page với recommendations
2. Mở Product Detail page với similar products
3. Compare visually

**Should be IDENTICAL:**
- [ ] Card layout (image ratio, spacing, padding)
- [ ] Badge positions và styles
- [ ] Font sizes và weights
- [ ] Color schemes (primary, secondary, text)
- [ ] Hover effects (scale, shadow, transition)
- [ ] Loading skeleton structure
- [ ] Navigation arrow styles

**Allowed DIFFERENCES:**
- Title/subtitle text content (dĩ nhiên khác)
- Icon type (Cart = shopping cart themes, Product = fire/tshirt)
- `minSlides` prop (Cart có thể khác Product)

---

## 🔍 API & Data Flow Testing

### API Call Verification
**Endpoint:** `GET /api/cohui/recommendations/:productID`

**Steps:**
1. Open DevTools → Network tab
2. Navigate tới product detail page
3. Filter requests by "recommendations"

**Expected Request:**
```
GET /api/cohui/recommendations/6789abcd1234567890
Status: 200 OK
Response Time: < 500ms
```

**Expected Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "_id": "...",
      "productName": "Áo Thun Nam",
      "price": 199000,
      "discount": 15,
      "images": ["url1.jpg"],
      "targetID": {...},
      "categoryID": {...},
      "correlation": 0.874,
      "matchCount": 1,
      "isFromCoIUM": true
    }
  ],
  "source": "coium" // or "fallback"
}
```

### Data Mapping Check
**Verify trong React DevTools:**

**Component:** `ProductDetail`
**State:** `similarProducts`

**Should Contain:**
```javascript
[
  {
    _id: "...",
    productName: "...",
    correlation: 0.874,  // Từ API
    matchCount: 1,       // Từ API
    isFromCoIUM: true,   // Từ API
    // ... other product fields
  }
]
```

**Props passed to RecommendationCarousel:**
- `products`: Mapped array với correlation/matchCount
- `showCorrelation`: true nếu có correlation data
- `icon`: FaFire nếu isFromCoIUM, FaTshirt nếu không

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: Recommendations không hiển thị
**Symptoms:** Section "Sản phẩm tương tự" không xuất hiện

**Debug Steps:**
1. Check console for errors
2. Check Network tab → Verify API call success
3. Check React DevTools → `similarProducts` state

**Common Causes:**
- ❌ API returns empty array → Check backend data/correlation map
- ❌ `similarProducts.length === 0` → Verify fallback logic
- ❌ Component import missing → Check imports in ProductDetail.jsx

**Fix:**
- Seed more products vào database
- Verify correlation_map.json có data
- Check fallback query logic (same targetID/gender)

---

### Issue 2: Correlation badges không hiển thị
**Symptoms:** Có recommendations nhưng không có % badges

**Debug Steps:**
1. Check `showCorrelation` prop = true?
2. Check API response có field `correlation`?
3. Check `isFromCoIUM` flag

**Fix:**
- Verify API response structure
- Check data mapping: `products.map(p => ({ ...p, correlation: p.correlation }))`
- Ensure RecommendationCarousel receives `showCorrelation={true}`

---

### Issue 3: Wrong icon hiển thị
**Symptoms:** Fire icon khi nên là TShirt, hoặc ngược lại

**Logic Check:**
```javascript
icon={similarProducts[0]?.isFromCoIUM ? FaFire : FaTshirt}
```

**Debug:**
- Check `isFromCoIUM` value trong state
- Check API response có field này
- Verify backend sets `isFromCoIUM = true` khi dùng correlation data

---

### Issue 4: Navigation arrows không hoạt động
**Symptoms:** Click arrows không scroll carousel

**Debug Steps:**
1. Check browser console for Swiper errors
2. Verify `products.length > minSlides` (arrows ẩn nếu không cần)
3. Check Swiper version compatibility

**Fix:**
- Update Swiper package: `npm install swiper@latest`
- Check Swiper CSS imported: `import 'swiper/css'`
- Verify `navigation={true}` trong RecommendationCarousel

---

### Issue 5: Styling bị break trên mobile
**Symptoms:** Cards overlap, text cut off, badges misaligned

**Debug Steps:**
1. Inspect element → Check computed styles
2. Verify responsive breakpoints
3. Check TailwindCSS classes

**Fix:**
```jsx
// Check breakpoints in RecommendationCarousel
breakpoints={{
  320: { slidesPerView: 2 },
  640: { slidesPerView: 3 },
  1024: { slidesPerView: 4 }
}}
```
- Adjust `minSlides` prop nếu cần
- Check container padding/margin

---

## 📊 Performance Benchmarks

### Target Metrics
| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| API Response | < 300ms | < 500ms | > 1s |
| Component Render | < 50ms | < 100ms | > 200ms |
| Swiper Init | < 30ms | < 50ms | > 100ms |
| Skeleton Render | < 20ms | < 50ms | > 100ms |
| Image Load (lazy) | < 500ms | < 1s | > 2s |

### How to Measure
**Chrome DevTools Performance Tab:**
1. Start recording (Ctrl+E)
2. Navigate tới product page
3. Stop after page load complete
4. Analyze timeline:
   - Look for long tasks (>50ms)
   - Check network waterfall
   - Verify no layout shifts (CLS)

**Lighthouse Audit:**
```powershell
# Install Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:5173/product/[PRODUCT_ID] --view
```

**Target Scores:**
- Performance: >90
- Accessibility: >95
- Best Practices: >90
- SEO: >90

---

## ✅ Acceptance Criteria Checklist

### Functional Requirements
- [ ] Recommendations load khi có data
- [ ] Fallback works khi không có correlation
- [ ] Correlation badges hiển thị khi có data
- [ ] Icon thay đổi theo source (CoIUM vs Fallback)
- [ ] Click product → Navigate đúng page
- [ ] No recommendations → Section ẩn
- [ ] Loading states hiển thị gracefully

### UX Requirements
- [ ] Carousel navigation smooth
- [ ] Hover effects consistent
- [ ] Responsive trên mọi devices
- [ ] Theme compatibility (dark/light/tet)
- [ ] Loading skeleton không janky
- [ ] No layout shifts during load

### Code Quality
- [ ] Component reusable (Cart + ProductDetail)
- [ ] Props typing clear
- [ ] No console warnings/errors
- [ ] DRY principle followed (no duplicate code)
- [ ] Performance optimized (lazy loading, memoization)

### Performance Requirements
- [ ] API < 500ms (p90)
- [ ] FCP (First Contentful Paint) < 1.5s
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] CLS (Cumulative Layout Shift) < 0.1
- [ ] No memory leaks

---

## 📝 Regression Testing

### Test Old Functionality Still Works
Since we refactored existing code, ensure:

1. **Product Detail Page:**
   - [ ] Product images carousel hoạt động
   - [ ] Product info (name, price, description) hiển thị đúng
   - [ ] Color/size selection hoạt động
   - [ ] Add to cart button works
   - [ ] Reviews section loads

2. **Similar Products Section:**
   - [ ] API call vẫn dùng endpoint cũ
   - [ ] Data structure không thay đổi
   - [ ] Fallback logic vẫn hoạt động
   - [ ] Filtering logic (same target/gender) intact

3. **Navigation:**
   - [ ] Back button works
   - [ ] Breadcrumbs correct
   - [ ] Click similar product → Page updates correctly

---

## 🎓 Next Steps

1. **Run Full Test Suite:**
   - Complete tất cả scenarios trên
   - Document issues tìm được

2. **Cross-Browser Testing:**
   - Chrome (latest)
   - Firefox (latest)
   - Safari (if Mac available)
   - Edge (latest)

3. **Performance Optimization:**
   - Nếu API > 500ms → Cache results
   - Nếu images load slow → Optimize image sizes
   - Nếu bundle size lớn → Code splitting

4. **User Acceptance Testing:**
   - Thu thập feedback từ real users
   - Monitor analytics (click-through rate)
   - A/B test nếu cần (old vs new UI)

---

## 📚 Related Files

**Modified:**
- `client/src/pages/customer/product/ProductDetail.jsx` - Main integration

**Created:**
- `client/src/components/RecommendationCarousel.jsx` - Reusable component

**Related:**
- `server/controllers/CoHUIController.js` - Backend API
- `server/routes/cohui.route.js` - Routing
- `docs/CART_RECOMMENDATIONS_TESTING_GUIDE.md` - Cart testing guide

---

## 📞 Support

**Issues/Questions:**
- Check existing documentation in `/docs`
- Review CoIUM algorithm paper
- Consult team lead for complex scenarios

---

**Created:** 2025
**Last Updated:** 2025
**Version:** 1.0
