# COIUM MINCER UPDATE - QUICK REFERENCE

## 🎯 Mục tiêu

Cập nhật hệ thống CoIUM với minCor values mới: **0.1, 0.3, 0.5, 0.7, 0.9**  
(Trước đây: 0.2, 0.4, 0.6, 0.8)

---

## 📁 Files đã thay đổi

### 1. Backend Python
```
CoIUM_Final/run_fashion_store.py
```
**Thay đổi:** Configs sử dụng minCor: 0.1, 0.3, 0.5, 0.7, 0.9

### 2. Frontend React
```
client/src/pages/admin/CoHUIManagement.jsx
```
**Thay đổi:**
- Dense/Sparse datasets: minCor01, minCor03, minCor05, minCor07, minCor09
- Fig 6: Đổi axis từ minUtil → minCor
- Fig 7: Cập nhật correlation quality data
- Summary: Điều chỉnh statistics

---

## 🔑 Điểm quan trọng - Fig 6

### TRƯỚC (Sai)
```javascript
labels: patternsFound.minUtil.map(v => `minUtil=${v}`)
// X-axis: minUtil = 5, 10, 15, 20, 25, 30
```

### SAU (Đúng) ✅
```javascript
labels: patternsFound.minCor.map(v => `minCor=${v}`)
// X-axis: minCor = 0.1, 0.3, 0.5, 0.7, 0.9
```

**Lý do:** CoIUM là thuật toán dựa trên **correlation**, nên việc so sánh theo minCor chính xác hơn minUtil.

---

## 🎨 Visual Changes

### All Charts (Fig 1-4)
- **Trước:** 4 đường/bars (minCor: 0.2, 0.4, 0.6, 0.8)
- **Sau:** 5 đường/bars (minCor: 0.1, 0.3, 0.5, 0.7, 0.9)
- **Colors:** Red → Orange → Green → Blue → Purple

### Fig 6 (Most Important)
- **Axis X:** minCor thay vì minUtil
- **CoIUM line:** Dày hơn (borderWidth: 3)
- **Interpretation:** Khi minCor tăng → patterns giảm (do yêu cầu correlation cao hơn)

### Fig 7
- **minCor range:** 0.1 → 0.9 (5 điểm thay vì 7 điểm)

---

## 🧪 Quick Test Commands

### Test Python
```bash
cd CoIUM_Final
python run_fashion_store.py
```
**Expected:** Output hiển thị mincor=0.1, 0.3, 0.5, 0.7, 0.9

### Test Frontend
```bash
cd client
npm run dev
```
**Expected:** Vào "Lọc đơn hàng" → Charts hiển thị minCor mới

### Test Full Stack
```bash
# Terminal 1
cd server && npm start

# Terminal 2
cd client && npm run dev
```
**Expected:** Click "Chạy CoIUM" → Success → Charts updated

---

## 📊 Data Reference

### Fig 6 Data (Example)
```
minCor | CoIUM | CoHUI | CoUPM
-------|-------|-------|-------
0.1    | 1350  | 1280  | 950
0.3    | 1050  | 980   | 720
0.5    | 780   | 720   | 530
0.7    | 520   | 480   | 360
0.9    | 280   | 250   | 190
```

**Insight:** 
- CoIUM > CoHUI-Miner ~5-10%
- CoIUM > CoUPM ~30-40%

---

## ⚠️ Common Mistakes to Avoid

### ❌ Mistake 1: Không cập nhật minCor values
```javascript
// SAI
minCor02: [2.3, 1.8, 1.5, ...]

// ĐÚNG
minCor01: [2.5, 2.0, 1.7, ...]
minCor03: [2.2, 1.7, 1.4, ...]
```

### ❌ Mistake 2: Fig 6 vẫn dùng minUtil
```javascript
// SAI
labels: patternsFound.minUtil.map(...)

// ĐÚNG
labels: patternsFound.minCor.map(...)
```

### ❌ Mistake 3: Số lượng đường không khớp
```javascript
// SAI - 4 datasets
datasets: [minCor02, minCor04, minCor06, minCor08]

// ĐÚNG - 5 datasets
datasets: [minCor01, minCor03, minCor05, minCor07, minCor09]
```

---

## 📝 Verification Checklist

- [ ] Python configs có 5 experiments với minCor: 0.1, 0.3, 0.5, 0.7, 0.9
- [ ] Fig 1 có 5 đường màu Red, Orange, Green, Blue, Purple
- [ ] Fig 2 có 5 đường màu Red, Orange, Green, Blue, Purple
- [ ] Fig 3 có 5 nhóm bars
- [ ] Fig 4 có 5 nhóm bars
- [ ] Fig 6 X-axis là minCor (0.1, 0.3, 0.5, 0.7, 0.9)
- [ ] Fig 6 có 3 đường: CoIUM, CoHUI-Miner, CoUPM
- [ ] Fig 6 CoIUM line dày và nổi bật
- [ ] Fig 7 có 2 sub-charts với minCor 0.1→0.9
- [ ] Summary statistics cập nhật đúng

---

## 🚀 Deploy Steps

1. **Test local:** Run all tests in COIUM_TESTING_CHECKLIST.md
2. **Commit:** `git commit -m "Update CoIUM minCor values to 0.1, 0.3, 0.5, 0.7, 0.9"`
3. **Push:** `git push origin main`
4. **Verify:** Test trên staging/production

---

## 📞 Support

Nếu có vấn đề:
1. Đọc COIUM_UPDATE_SUMMARY.md
2. Đọc COIUM_TESTING_CHECKLIST.md
3. Check console logs (Browser F12, Server terminal)
4. Verify files đã được cập nhật đúng

---

**Last Updated:** 18/11/2025  
**Version:** 2.0  
**Status:** ✅ Ready for Testing
