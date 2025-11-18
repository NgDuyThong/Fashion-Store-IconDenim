# COIUM UPDATE - TESTING CHECKLIST

## ✅ Hoàn thành các thay đổi

### Python Backend (CoIUM_Final)
- [x] Cập nhật `run_fashion_store.py` - configs sử dụng minCor: 0.1, 0.3, 0.5, 0.7, 0.9
- [x] Xác nhận `main.py` đã đúng minCor values
- [x] Kiểm tra `algorithms/coium.py` - nhận minCor từ parameters
- [x] Xác nhận không có hardcoded minCor values

### Frontend (React)
- [x] Cập nhật `CoHUIManagement.jsx`:
  - [x] Dense Datasets Runtime (Fig 1) - 5 đường với minCor mới
  - [x] Sparse Datasets Runtime (Fig 2) - 5 đường với minCor mới
  - [x] Dense Datasets Memory (Fig 3) - 5 bars với minCor mới
  - [x] Sparse Datasets Memory (Fig 4) - 5 bars với minCor mới
  - [x] **Fig 6 - QUAN TRỌNG**: Đổi từ minUtil → minCor axis
  - [x] Fig 7 - Correlation Quality với minCor mới
  - [x] Summary Statistics cập nhật

## 🧪 Test Plan

### Test 1: Kiểm tra Python Scripts ⏰ 5 phút

```bash
cd CoIUM_Final
python run_fashion_store.py
```

**Kiểm tra:**
- [ ] Output hiển thị configs với minCor: 0.1, 0.3, 0.5, 0.7, 0.9
- [ ] Không có lỗi khi chạy
- [ ] File `correlation_recommendations.json` được tạo
- [ ] Biểu đồ được tạo trong folder `Chart/`

**Expected Output:**
```
EXPERIMENT #1: mincor=0.1, minutil=0.001, maxlen=3
EXPERIMENT #2: mincor=0.3, minutil=0.001, maxlen=3
EXPERIMENT #3: mincor=0.5, minutil=0.001, maxlen=3
EXPERIMENT #4: mincor=0.7, minutil=0.001, maxlen=3
EXPERIMENT #5: mincor=0.9, minutil=0.001, maxlen=3
```

---

### Test 2: Kiểm tra Frontend Charts ⏰ 10 phút

```bash
cd client
npm run dev
```

**Bước thực hiện:**
1. [ ] Mở browser: http://localhost:5173
2. [ ] Login với tài khoản admin
3. [ ] Navigate to: **Lọc đơn hàng** → Tab **Chạy CoIUM & Phân tích**

**Kiểm tra các biểu đồ:**

#### Fig 1: Dense Datasets Runtime
- [ ] Có 5 đường với labels: minCor=0.1, 0.3, 0.5, 0.7, 0.9
- [ ] Màu sắc: Red, Orange, Green, Blue, Purple
- [ ] X-axis: minUtil=5, 10, 15, 20, 25, 30
- [ ] Đường có xu hướng giảm từ trái sang phải

#### Fig 2: Sparse Datasets Runtime  
- [ ] Có 5 đường với labels: minCor=0.1, 0.3, 0.5, 0.7, 0.9
- [ ] X-axis: minUtil=100, 200, 300, 400, 500, 600
- [ ] Đường có xu hướng giảm từ trái sang phải

#### Fig 3: Dense Datasets Memory
- [ ] Bar chart với 5 nhóm bars
- [ ] Labels: minCor=0.1, 0.3, 0.5, 0.7, 0.9
- [ ] X-axis: minUtil=5, 10, 15, 20, 25, 30

#### Fig 4: Sparse Datasets Memory
- [ ] Bar chart với 5 nhóm bars
- [ ] Labels: minCor=0.1, 0.3, 0.5, 0.7, 0.9
- [ ] X-axis: minUtil=100, 200, 300, 400, 500, 600

#### Fig 5: Scalability
- [ ] 2 line charts (Runtime và Memory)
- [ ] X-axis: 20%, 40%, 60%, 80%, 100%
- [ ] Không thay đổi (giữ nguyên)

#### Fig 6: Pattern Comparison - **QUAN TRỌNG NHẤT**
- [ ] **X-axis PHẢI LÀ minCor**: 0.1, 0.3, 0.5, 0.7, 0.9 ✨
- [ ] 3 đường: CoIUM (màu xanh dương đậm), CoHUI-Miner (xanh lá), CoUPM (cam)
- [ ] Đường CoIUM dày hơn (borderWidth: 3) và points lớn hơn
- [ ] CoIUM luôn ở trên (giá trị cao nhất)
- [ ] Title: "Số lượng Pattern tìm được - So sánh thuật toán theo MinCor"
- [ ] Subtitle: "Số lượng Patterns theo MinCor (minUtil=0.001)"
- [ ] Có box phân tích bên dưới biểu đồ
- [ ] Đường có xu hướng giảm từ trái sang phải (minCor tăng → patterns giảm)

**Giá trị mẫu Fig 6:**
```
minCor  | CoIUM | CoHUI | CoUPM
--------|-------|-------|-------
0.1     | 1350  | 1280  | 950
0.3     | 1050  | 980   | 720
0.5     | 780   | 720   | 530
0.7     | 520   | 480   | 360
0.9     | 280   | 250   | 190
```

#### Fig 7: Correlation Quality
- [ ] 2 sub-charts
- [ ] Left: Avg Correlation line chart (minCor 0.1→0.9)
- [ ] Right: High Quality Patterns bar chart (minCor 0.1→0.9)

#### Summary Statistics
- [ ] Thời gian chạy: 1.8s (minCor=0.5)
- [ ] Bộ nhớ: 480 MB (minCor=0.5)
- [ ] Patterns: 780 (minCor=0.5)

---

### Test 3: Full Integration Test ⏰ 15 phút

**Start servers:**

Terminal 1:
```bash
cd server
npm start
```

Terminal 2:
```bash
cd client
npm run dev
```

**Test quy trình:**
1. [ ] Login as admin
2. [ ] Go to "Lọc đơn hàng"
3. [ ] Tab "Chạy CoIUM & Phân tích"
4. [ ] Click nút "Chạy CoIUM"
5. [ ] Chờ quy trình hoàn thành (~30-60 giây)

**Verify:**
- [ ] Toast notification hiển thị success
- [ ] Tự động chuyển sang tab "Chạy CoIUM & Phân tích"
- [ ] Tất cả 7 biểu đồ hiển thị đúng
- [ ] Tab "Gợi ý chung" có dữ liệu
- [ ] Tab "Theo sản phẩm" search được
- [ ] Tab "Mua cùng" search được

---

### Test 4: Các Tab khác ⏰ 10 phút

#### Tab "Gợi ý chung"
- [ ] Hiển thị danh sách sản phẩm
- [ ] Có ranking (1, 2, 3... với badges màu)
- [ ] Hiển thị correlation score, frequency
- [ ] Click "Làm mới" hoạt động

#### Tab "Theo sản phẩm"
- [ ] Nhập product ID (ví dụ: 104)
- [ ] Click "Tìm kiếm"
- [ ] Hiển thị thông tin sản phẩm được chọn
- [ ] Hiển thị danh sách sản phẩm tương quan

#### Tab "Mua cùng"
- [ ] Nhập product ID (ví dụ: 104)
- [ ] Click "Tìm kiếm"
- [ ] Hiển thị thông tin sản phẩm được chọn
- [ ] Hiển thị danh sách sản phẩm mua cùng

---

## 🐛 Common Issues & Solutions

### Issue 1: Python script error
**Symptoms:** Error khi chạy `run_fashion_store.py`

**Solution:**
```bash
cd CoIUM_Final
pip install -r requirements.txt
```

### Issue 2: Chart không hiển thị
**Symptoms:** Biểu đồ trống hoặc lỗi

**Solution:**
- Check console log (F12)
- Verify data structure trong `generateMockAnalytics()`
- Clear browser cache

### Issue 3: Backend connection error
**Symptoms:** "Có lỗi xảy ra khi chạy CoIUM"

**Solution:**
- Kiểm tra server đang chạy
- Kiểm tra MongoDB đang chạy
- Check terminal logs

### Issue 4: Fig 6 vẫn hiển thị minUtil
**Symptoms:** X-axis của Fig 6 là minUtil thay vì minCor

**Solution:**
- Clear browser cache (Ctrl + Shift + R)
- Restart dev server
- Kiểm tra file `CoHUIManagement.jsx` đã cập nhật đúng

---

## ✨ Key Points to Verify

### Fig 6 - QUAN TRỌNG NHẤT
```javascript
// ĐÚNG ✅
labels: patternsFound.minCor.map(v => `minCor=${v}`)
// minCor: [0.1, 0.3, 0.5, 0.7, 0.9]

// SAI ❌ 
labels: patternsFound.minUtil.map(v => `minUtil=${v}`)
```

### minCor Values - Tất cả phải nhất quán
```
Frontend: 0.1, 0.3, 0.5, 0.7, 0.9 ✅
Backend:  0.1, 0.3, 0.5, 0.7, 0.9 ✅
```

---

## 📊 Expected Results

### Python Output
```
EXPERIMENT #1: mincor=0.1, minutil=0.001, maxlen=3
Dang chay CoIUM...
   Hoan thanh: XXX itemsets, X.XXXs
Dang chay CoUPM...
   Hoan thanh: XXX itemsets, X.XXXs
Dang chay CoHUI-Miner...
   Hoan thanh: XXX itemsets, X.XXXs

...

PHAN TICH HOAN TAT!
```

### Frontend Display
- Tất cả 7 biểu đồ hiển thị không lỗi
- Fig 6 có X-axis là minCor (0.1, 0.3, 0.5, 0.7, 0.9)
- CoIUM line luôn ở trên cùng trong Fig 6
- Summary statistics hiển thị giá trị hợp lý

---

## 📝 Sign-off

**Tester:** _______________  
**Date:** _______________  
**All tests passed:** [ ] Yes [ ] No  
**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## 🎯 Next Steps

Nếu tất cả test pass:
1. [ ] Commit changes to git
2. [ ] Create pull request
3. [ ] Deploy to staging
4. [ ] Final QA test
5. [ ] Deploy to production

Nếu có issues:
1. [ ] Note down all issues
2. [ ] Fix issues one by one
3. [ ] Re-run tests
4. [ ] Repeat until all pass
