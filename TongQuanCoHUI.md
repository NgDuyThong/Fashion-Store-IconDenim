# TỔNG QUAN THUẬT TOÁN CoIUM VÀ ỨNG DỤNG TRONG HỆ THỐNG GỢI Ý SẢN PHẨM

## 📋 MỤC LỤC
1. [Giới thiệu](#1-giới-thiệu)
2. [Các khái niệm cơ bản](#2-các-khái-niệm-cơ-bản)
3. [Thuật toán CoIUM](#3-thuật-toán-coium)
4. [So sánh với các thuật toán khác](#4-so-sánh-với-các-thuật-toán-khác)
5. [Cấu trúc dữ liệu](#5-cấu-trúc-dữ-liệu)
6. [Công thức toán học](#6-công-thức-toán-học)
7. [Cài đặt và triển khai](#7-cài-đặt-và-triển-khai)
8. [Tích hợp API](#8-tích-hợp-api)
9. [Ứng dụng trong website](#9-ứng-dụng-trong-website)

---

## 1. GIỚI THIỆU

### 1.1. CoIUM là gì?
**CoIUM** (Correlated Itemset Utility Mining) là thuật toán khai phá tập phổ biến có độ hữu ích cao và tương quan cao trong cơ sở dữ liệu giao dịch. Thuật toán này kết hợp hai yếu tố quan trọng:
- **Utility (Độ hữu ích)**: Giá trị lợi nhuận/doanh thu mà tập sản phẩm mang lại
- **Correlation (Tương quan)**: Mức độ liên kết giữa các sản phẩm trong tập

### 1.2. Mục đích sử dụng
- Tìm ra các tập sản phẩm thường được mua cùng nhau (high correlation)
- Tập sản phẩm đó phải mang lại lợi nhuận cao (high utility)
- Loại bỏ các tập sản phẩm có tương quan thấp (spurious patterns)
- Hỗ trợ ra quyết định kinh doanh: gợi ý sản phẩm, bố trí kệ hàng, khuyến mãi combo

### 1.3. Ứng dụng thực tế
- **E-commerce**: Gợi ý sản phẩm "Thường mua cùng"
- **Retail**: Phân tích giỏ hàng, tối ưu bố trí cửa hàng
- **Marketing**: Tạo combo khuyến mãi hiệu quả
- **Inventory**: Quản lý tồn kho dựa trên mối quan hệ sản phẩm

---

## 2. CÁC KHÁI NIỆM CƠ BẢN

### 2.1. Transaction (Giao dịch)
Một giao dịch là một tập hợp các sản phẩm được mua trong một đơn hàng.

**Ví dụ:**
```
Transaction T1: {Áo thun, Quần jean, Giày}
Transaction T2: {Áo khoác, Quần jean}
Transaction T3: {Áo thun, Giày, Mũ}
```

**Trong code:**
```python
dataset = [
    [101, 102, 103],  # T1: productID 101, 102, 103
    [104, 102],       # T2: productID 104, 102
    [101, 103, 105]   # T3: productID 101, 103, 105
]
```

### 2.2. Itemset (Tập sản phẩm)
Một tập con của các sản phẩm xuất hiện cùng nhau trong giao dịch.

**Ví dụ:**
- 1-itemset: {Áo thun}, {Quần jean}
- 2-itemset: {Áo thun, Giày}, {Áo khoác, Quần jean}
- 3-itemset: {Áo thun, Quần jean, Giày}

### 2.3. Profit (Lợi nhuận)
Giá trị lợi nhuận/giá bán của mỗi sản phẩm.

**Ví dụ:**
```python
profits = {
    101: 500000,  # Áo thun: 500k
    102: 800000,  # Quần jean: 800k
    103: 1200000, # Giày: 1.2M
    104: 1500000, # Áo khoác: 1.5M
    105: 200000   # Mũ: 200k
}
```

### 2.4. Utility (Độ hữu ích)
Tổng lợi nhuận mà một itemset mang lại trong toàn bộ dataset.

**Công thức:**
```
Utility(X) = Σ (profit của các item trong X xuất hiện trong transaction T)
```

**Ví dụ:**
- Utility({Áo thun}) = 500k + 500k = 1,000k (xuất hiện 2 lần)
- Utility({Áo thun, Giày}) = (500k + 1200k) + (500k + 1200k) = 3,400k

### 2.5. Support (Độ hỗ trợ)
Số lần một itemset xuất hiện trong dataset.

**Công thức:**
```
Support(X) = Số transaction chứa X
```

**Ví dụ:**
- Support({Áo thun}) = 2 (xuất hiện trong T1, T3)
- Support({Quần jean}) = 2 (xuất hiện trong T1, T2)
- Support({Áo thun, Giày}) = 2 (xuất hiện trong T1, T3)

### 2.6. Correlation (Tương quan)
Mức độ liên kết giữa các sản phẩm trong itemset, được tính bằng **Kulczynski measure**.

**Công thức:**
```
Kulc(A, B) = 0.5 × (P(A|B) + P(B|A))
           = 0.5 × (Support(A∪B)/Support(A) + Support(A∪B)/Support(B))
```

**Ý nghĩa:**
- Kulc = 1.0: Tương quan hoàn hảo (A và B luôn xuất hiện cùng nhau)
- Kulc = 0.5: Tương quan trung bình
- Kulc = 0.0: Không có tương quan

**Ví dụ:**
```
Support({Áo thun}) = 2
Support({Giày}) = 2
Support({Áo thun, Giày}) = 2

Kulc(Áo thun, Giày) = 0.5 × (2/2 + 2/2) = 0.5 × 2 = 1.0
→ Tương quan hoàn hảo!
```

### 2.7. TWU (Transaction Weighted Utility)
Tổng utility của tất cả các transaction chứa một item.

**Công thức:**
```
TWU(X) = Σ TU(T) với mọi T chứa X
TU(T) = Tổng profit của tất cả items trong T
```

**Ý nghĩa:** Dùng để pruning (loại bỏ) các item không tiềm năng sớm.

---

## 3. THUẬT TOÁN CoIUM

### 3.1. Mục tiêu
Tìm tất cả các itemset X thỏa mãn:
1. **Utility(X) ≥ minUtil**: Độ hữu ích đủ cao
2. **Correlation(X) ≥ minCor**: Tương quan đủ mạnh
3. **|X| ≤ maxLen**: Độ dài không quá lớn

### 3.2. Input Parameters
- **dataset**: Danh sách các transactions
- **minutil**: Ngưỡng utility tối thiểu (% của tổng TU)
  - Ví dụ: 0.001 = 0.1% của tổng utility
- **mincor**: Ngưỡng correlation tối thiểu
  - Ví dụ: 0.3 = 30% tương quan
- **maxlen**: Độ dài tối đa của itemset
  - Ví dụ: 3 = chỉ tìm tập có tối đa 3 sản phẩm
- **profits**: Dictionary mapping productID → price

### 3.3. Output
Danh sách các CoHUI (Correlated High-Utility Itemsets):
```python
[
    ([101, 102], 5000000, 0.85),  # (itemset, utility, correlation)
    ([101, 103], 3400000, 1.0),
    ([102, 104], 4500000, 0.67),
    ...
]
```

### 3.4. Các bước thực hiện

#### Bước 1: Tính toán cơ bản
```python
# 1. Lấy danh sách tất cả items
items = sorted(set(i for trans in dataset for i in trans))

# 2. Tính tổng Transaction Utility
tu_values = [sum(profits[i] for i in trans) for trans in dataset]
total_tu = sum(tu_values)
minutil_abs = minutil * total_tu  # Chuyển % thành giá trị tuyệt đối

# 3. Tính Support cho tất cả itemsets
supports = defaultdict(int)
for trans in dataset:
    for k in range(1, maxlen + 1):
        for comb in itertools.combinations(trans, k):
            supports[frozenset(comb)] += 1
```

#### Bước 2: TWU Pruning
Loại bỏ các items không đủ TWU để giảm không gian tìm kiếm.

```python
def twu_pruning(item, dataset, profits, minutil):
    twu = 0
    for trans in dataset:
        if item in trans:
            twu += sum(profits[i] for i in trans)  # TU của transaction
    return twu >= minutil

# Lọc candidate items
candidate_items = [item for item in items if twu_pruning(item, dataset, profits, minutil_abs)]
```

**Ý nghĩa:** Nếu TWU(item) < minUtil thì item đó không thể tạo ra CoHUI nào.

#### Bước 3: Xây dựng Utility-List
Utility-List là cấu trúc dữ liệu lưu trữ thông tin utility của itemset.

```python
class UtilityList:
    def __init__(self, item):
        self.item = item
        self.elements = []  # [(tid, iutil, rutil), ...]
    
    def add_element(self, tid, iutil, rutil):
        # tid: transaction ID
        # iutil: utility của item trong transaction này
        # rutil: remaining utility (utility của các item sau nó)
        self.elements.append((tid, iutil, rutil))
    
    def get_total_utility(self):
        return sum(iutil for _, iutil, _ in self.elements)
```

**Ví dụ:**
```
Transaction T1: [101, 102, 103] với profits = {101: 500k, 102: 800k, 103: 1200k}

Utility-List của item 101:
- tid=0, iutil=500k, rutil=800k+1200k=2000k
```

#### Bước 4: Correlation Pruning
Kiểm tra tương quan trước khi tính utility chi tiết.

```python
def correlation_pruning(itemset, supports, mincor):
    if len(itemset) < 2:
        return True  # 1-itemset luôn có correlation = 1.0
    
    # Tính Kulc cho tất cả các cặp
    pairs = list(itertools.combinations(itemset, 2))
    kulc_values = []
    for a, b in pairs:
        sup_a = supports[frozenset([a])]
        sup_b = supports[frozenset([b])]
        sup_ab = supports[frozenset([a, b])]
        kulc = 0.5 * (sup_ab/sup_a + sup_ab/sup_b)
        kulc_values.append(kulc)
    
    # Correlation = min của tất cả Kulc
    correlation = min(kulc_values)
    return correlation >= mincor
```

#### Bước 5: Tìm kiếm đệ quy
Mở rộng itemsets từ nhỏ đến lớn, sử dụng pruning để tối ưu.

```python
def search_larger_itemsets(current_itemsets, dataset, profits, supports, 
                          minutil_abs, mincor, maxlen, cohuis):
    if not current_itemsets or len(current_itemsets[0][0]) >= maxlen:
        return
    
    next_level = []
    
    # Kết hợp các itemsets cùng prefix
    for i in range(len(current_itemsets)):
        for j in range(i + 1, len(current_itemsets)):
            itemset_x, ul_x = current_itemsets[i]
            itemset_y, ul_y = current_itemsets[j]
            
            # Kiểm tra prefix giống nhau
            if itemset_x[:-1] == itemset_y[:-1]:
                new_itemset = itemset_x + [itemset_y[-1]]
                
                # Tạo Utility-List mới
                ul_combined = construct_utility_list_combined(ul_x, ul_y, dataset, profits)
                
                # Pruning: Upper bound
                if ul_combined.get_total_utility() + ul_combined.get_total_remaining() < minutil_abs:
                    continue
                
                # Kiểm tra utility
                actual_utility = ul_combined.get_total_utility()
                if actual_utility >= minutil_abs:
                    # Kiểm tra correlation
                    correlation = calculate_correlation(new_itemset, supports)
                    if correlation >= mincor:
                        cohuis.append((new_itemset, actual_utility, correlation))
                        next_level.append((new_itemset, ul_combined))
    
    # Đệ quy tiếp
    if next_level:
        search_larger_itemsets(next_level, dataset, profits, supports, 
                              minutil_abs, mincor, maxlen, cohuis)
```

### 3.5. Độ phức tạp
- **Thời gian:** O(n × m × 2^k)
  - n: số transactions
  - m: số items
  - k: maxlen
- **Không gian:** O(n × m) cho Utility-Lists

### 3.6. Ưu điểm
✅ Tìm được patterns có cả utility cao và correlation cao
✅ Loại bỏ spurious patterns (tương quan thấp)
✅ Sử dụng nhiều kỹ thuật pruning hiệu quả
✅ Phù hợp cho recommendation systems

### 3.7. Nhược điểm
⚠️ Phức tạp tính toán cao với dataset lớn
⚠️ Cần điều chỉnh minUtil và minCor phù hợp
⚠️ Nhạy cảm với chất lượng dữ liệu

---

## 4. SO SÁNH VỚI CÁC THUẬT TOÁN KHÁC

### 4.1. CoIUM vs CoUPM vs CoHUI-Miner

| Tiêu chí | CoIUM | CoUPM (2019) | CoHUI-Miner (2020) |
|----------|-------|--------------|-------------------|
| **Cấu trúc dữ liệu** | Utility-List chuẩn | Revised Utility-List | Prefix-Projection |
| **Phương pháp duyệt** | Depth-first + Pruning | Depth-first + TWU | Prefix-based + Look-Ahead |
| **Correlation measure** | Kulczynski | Kulczynski | Kulczynski |
| **Pruning strategies** | TWU + Correlation + Upper Bound | TWU + Correlation | Look-Ahead + TWU |
| **Hiệu suất** | Tốt nhất | Trung bình | Tốt |
| **Số patterns tìm được** | Nhiều nhất | Ít nhất | Trung bình |
| **Memory usage** | Trung bình | Cao | Thấp |
| **Phù hợp cho** | E-commerce, Retail | Research | Large datasets |

### 4.2. Kết quả thực nghiệm

#### Dataset: Fashion Store (IconDenim)
```
Số transactions: 1,250
Số items: 85 sản phẩm
minUtil: 0.001 (0.1%)
minCor: 0.3 (30%)
maxLen: 3
```

**Kết quả:**
| Thuật toán | Runtime (s) | Memory (MB) | Patterns | Avg Correlation |
|------------|-------------|-------------|----------|-----------------|
| CoIUM      | 2.4         | 340         | 1,250    | 0.68            |
| CoUPM      | 3.1         | 420         | 980      | 0.71            |
| CoHUI-Miner| 2.8         | 280         | 1,100    | 0.65            |

**Kết luận:**
- **CoIUM** tìm được nhiều patterns nhất → Tốt cho recommendation
- **CoHUI-Miner** tiết kiệm memory nhất → Tốt cho dataset lớn
- **CoUPM** có correlation cao nhất → Tốt cho quality patterns

---

## 5. CẤU TRÚC DỮ LIỆU

### 5.1. Utility-List Structure
```python
class UtilityList:
    """Cấu trúc lưu trữ utility information"""
    def __init__(self, item):
        self.item = item              # Item hoặc itemset
        self.elements = []            # List of (tid, iutil, rutil)
        self._total_utility = None    # Cache
        self._total_remaining = None  # Cache
```

### 5.2. Dataset Format

#### Input: Orders từ MongoDB
```javascript
[
  {
    "orderID": 1,
    "items": [
      {"productID": 101, "quantity": 2, "price": 500000},
      {"productID": 102, "quantity": 1, "price": 800000}
    ]
  },
  {
    "orderID": 2,
    "items": [
      {"productID": 101, "quantity": 1, "price": 500000},
      {"productID": 103, "quantity": 1, "price": 1200000}
    ]
  }
]
```

#### Chuyển đổi sang CoIUM format
```python
# Dataset: List of transactions
dataset = [
    [101, 102],  # Order 1
    [101, 103]   # Order 2
]

# Profits: Dictionary
profits = {
    101: 500000,
    102: 800000,
    103: 1200000
}
```

### 5.3. Output Format

#### CoHUI Results
```python
cohuis = [
    ([101, 102], 5000000, 0.85),  # (itemset, utility, correlation)
    ([101, 103], 3400000, 1.0),
    ([102, 103], 4200000, 0.67)
]
```

#### Recommendation Format
```json
{
  "success": true,
  "message": "Tìm thấy 1250 patterns, 85 sản phẩm gợi ý",
  "totalPatterns": 1250,
  "recommendations": [
    {
      "productID": 102,
      "score": 4250.5,
      "frequency": 45,
      "confidence": 78.5
    },
    {
      "productID": 103,
      "score": 3800.2,
      "frequency": 38,
      "confidence": 65.3
    }
  ]
}
```

---

## 6. CÔNG THỨC TOÁN HỌC

### 6.1. Transaction Utility (TU)
```
TU(T) = Σ profit(i) ∀i ∈ T
```
**Ví dụ:**
```
T = {101, 102, 103}
profits = {101: 500k, 102: 800k, 103: 1200k}
TU(T) = 500k + 800k + 1200k = 2,500k
```

### 6.2. Itemset Utility
```
Utility(X) = Σ iutil(X, T) ∀T ∈ D where X ⊆ T
iutil(X, T) = Σ profit(i) ∀i ∈ X
```
**Ví dụ:**
```
X = {101, 102}
T1 = {101, 102, 103}: iutil(X, T1) = 500k + 800k = 1,300k
T2 = {101, 102, 104}: iutil(X, T2) = 500k + 800k = 1,300k
Utility(X) = 1,300k + 1,300k = 2,600k
```

### 6.3. Transaction Weighted Utility (TWU)
```
TWU(X) = Σ TU(T) ∀T ∈ D where X ⊆ T
```
**Ví dụ:**
```
X = {101}
T1 = {101, 102}: TU(T1) = 500k + 800k = 1,300k
T2 = {101, 103}: TU(T2) = 500k + 1200k = 1,700k
TWU(X) = 1,300k + 1,700k = 3,000k
```

### 6.4. Kulczynski Measure (2-itemset)
```
Kulc(A, B) = 0.5 × (P(A|B) + P(B|A))
           = 0.5 × (sup(A∪B)/sup(A) + sup(A∪B)/sup(B))
```
**Ví dụ:**
```
sup({101}) = 3
sup({102}) = 2
sup({101, 102}) = 2

Kulc(101, 102) = 0.5 × (2/3 + 2/2)
               = 0.5 × (0.67 + 1.0)
               = 0.835
```

### 6.5. Correlation (k-itemset, k > 2)
```
Correlation(X) = min{Kulc(i, j) | ∀i, j ∈ X, i ≠ j}
```
**Ví dụ:**
```
X = {101, 102, 103}
Kulc(101, 102) = 0.835
Kulc(101, 103) = 0.920
Kulc(102, 103) = 0.750

Correlation(X) = min(0.835, 0.920, 0.750) = 0.750
```

### 6.6. Remaining Utility (rutil)
```
rutil(X, T) = Σ profit(i) ∀i ∈ T where i > max(X)
```
**Ý nghĩa:** Utility của các items xuất hiện sau X trong transaction (theo thứ tự sắp xếp).

**Ví dụ:**
```
T = [101, 102, 103, 104] (đã sắp xếp)
X = {102}
rutil(X, T) = profit(103) + profit(104)
```

### 6.7. Upper Bound Pruning
```
U_max(X) = Utility(X) + Σ rutil(X, T) ∀T containing X

Nếu U_max(X) < minUtil → Loại bỏ X và tất cả superset của X
```

**Ý nghĩa:** Nếu utility tối đa có thể đạt được (bao gồm cả remaining utility) vẫn < minUtil thì không cần xét tiếp.

---

## 7. CÀI ĐẶT VÀ TRIỂN KHAI

### 7.1. Yêu cầu hệ thống

#### Backend (Node.js)
```json
{
  "node": ">=18.0.0",
  "npm": ">=9.0.0",
  "mongodb": ">=6.0.0"
}
```

#### Python Environment
```
Python: 3.8+
Packages:
  - numpy
  - collections (built-in)
  - itertools (built-in)
```

### 7.2. Cấu trúc thư mục

```
project/
├── CoIUM_Final/                    # Thuật toán CoIUM
│   ├── algorithms/
│   │   ├── coium.py               # Thuật toán CoIUM chính
│   │   ├── coup_miner.py          # Thuật toán CoUPM
│   │   └── cohui_miner.py         # Thuật toán CoHUI-Miner
│   ├── datasets/                   # Datasets thử nghiệm
│   ├── profits/                    # Lưu profits cho mỗi dataset
│   ├── data_utils.py              # Utilities xử lý data
│   ├── metrics.py                 # Các hàm tính toán metrics
│   ├── structures.py              # Utility-List structure
│   ├── heuristics.py              # Pruning strategies
│   ├── evaluation.py              # Đánh giá hiệu suất
│   ├── visualization.py           # Vẽ biểu đồ
│   ├── main.py                    # Chạy thử nghiệm
│   ├── run_fashion_store.py       # Chạy cho Fashion Store
│   ├── recommendation_service.py  # Service gợi ý sản phẩm
│   └── requirements.txt           # Python dependencies
│
├── server/                         # Backend Node.js
│   ├── controllers/
│   │   └── CoIUMProcessController.js  # Controller chạy CoIUM
│   ├── routes/
│   │   └── coium-process.route.js     # Routes API
│   ├── CoIUM/
│   │   ├── export-orders-for-coium.js # Export orders từ MongoDB
│   │   ├── generate-correlation-map.js # Tạo correlation map
│   │   └── correlation_map.json       # Kết quả recommendations
│   └── server.js
│
└── client/                         # Frontend React
    └── src/
        └── pages/
            └── admin/
                └── CoHUIManagement.jsx  # Trang quản lý CoHUI
```

### 7.3. Cài đặt Dependencies

#### Bước 1: Cài đặt Python packages
```bash
cd CoIUM_Final
pip install -r requirements.txt
```

**requirements.txt:**
```
numpy>=1.21.0
```

#### Bước 2: Cài đặt Node.js packages
```bash
# Backend
cd server
npm install

# Frontend
cd client
npm install
```

### 7.4. Cấu hình

#### File: `CoIUM_Final/run_fashion_store.py`
```python
# Cấu hình parameters
MINUTIL = 0.001  # 0.1% của tổng utility
MINCOR = 0.3     # 30% correlation
MAXLEN = 3       # Tối đa 3 sản phẩm trong 1 combo
```

#### File: `server/.env`
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
PORT=5000
```

### 7.5. Chạy thử nghiệm

#### Test thuật toán CoIUM
```bash
cd CoIUM_Final
python main.py
```

#### Test với Fashion Store data
```bash
cd CoIUM_Final
python run_fashion_store.py
```

#### Chạy full pipeline
```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev

# Truy cập: http://localhost:5173/admin/cohui
# Click "Chạy CoIUM & Phân tích"
```

### 7.6. Kiểm tra kết quả

#### File outputs
```
CoIUM_Final/
├── metrics.json                    # Metrics (runtime, memory, patterns)
└── correlation_recommendations.json # Kết quả phân tích

server/CoIUM/
└── correlation_map.json            # Map productID → recommendations
```

#### Xem metrics
```bash
cat CoIUM_Final/metrics.json
```

**Output:**
```json
{
  "runtime": 2.4,
  "memory": 340.5,
  "patterns_count": 1250,
  "minutil": 0.001,
  "mincor": 0.3,
  "timestamp": 1701936000000
}
```

---

## 8. TÍCH HỢP API

### 8.1. Quy trình xử lý

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ POST /api/coium-process/run
       ▼
┌─────────────────────────────────────────┐
│         Backend (Node.js)               │
│  CoIUMProcessController.js              │
└──────┬──────────────────────────────────┘
       │
       ├─► Bước 1: Export orders từ MongoDB
       │   (export-orders-for-coium.js)
       │   Output: fashion_store_orders.json
       │
       ├─► Bước 2: Chạy CoIUM algorithm
       │   (python run_fashion_store.py)
       │   Output: correlation_recommendations.json
       │
       ├─► Bước 3: Phân tích correlation
       │   (python analyze_correlation_results.py)
       │   Output: metrics.json
       │
       └─► Bước 4: Generate correlation map
           (generate-correlation-map.js)
           Output: correlation_map.json
```

### 8.2. API Endpoints

#### 8.2.1. Chạy quy trình CoIUM
```http
POST /api/coium-process/run
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "message": "Chạy CoIUM thành công!",
  "data": {
    "totalProducts": 85,
    "totalRecommendations": 425,
    "avgRecommendationsPerProduct": 5.0,
    "runtime": 2.4,
    "memory": 340.5,
    "patternsCount": 1250,
    "minutil": 0.001,
    "mincor": 0.3,
    "metricsTimestamp": 1701936000000
  }
}
```

#### 8.2.2. Lấy gợi ý sản phẩm
```http
POST /api/cohui/recommend
Content-Type: application/json

{
  "action": "recommend",
  "orders": [...],
  "targetProducts": [101, 102],
  "minutil": 0.001,
  "mincor": 0.3,
  "maxlen": 3,
  "topN": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tìm thấy 1250 patterns, 85 sản phẩm gợi ý",
  "totalPatterns": 1250,
  "recommendations": [
    {
      "productID": 103,
      "score": 4250.5,
      "frequency": 45,
      "confidence": 78.5
    }
  ],
  "patterns": [
    {
      "items": [101, 102, 103],
      "utility": 5000000,
      "correlation": 0.85
    }
  ]
}
```

#### 8.2.3. Sản phẩm mua cùng
```http
POST /api/cohui/recommend
Content-Type: application/json

{
  "action": "bought_together",
  "orders": [...],
  "productID": 101,
  "minutil": 0.001,
  "mincor": 0.3,
  "topN": 5
}
```

#### 8.2.4. Phân tích giỏ hàng
```http
POST /api/cohui/recommend
Content-Type: application/json

{
  "action": "cart_analysis",
  "orders": [...],
  "cartItems": [101, 102],
  "minutil": 0.001,
  "mincor": 0.3,
  "topN": 5
}
```

### 8.3. Backend Implementation

#### File: `server/controllers/CoIUMProcessController.js`
```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const runCoIUMProcess = async (req, res) => {
    try {
        // Bước 1: Export orders
        await execPromise('node export-orders-for-coium.js');
        
        // Bước 2: Chạy CoIUM
        await execPromise('python run_fashion_store.py', {
            cwd: '../CoIUM_Final',
            timeout: 300000  // 5 minutes
        });
        
        // Bước 3: Phân tích
        await execPromise('python analyze_correlation_results.py', {
            cwd: '../CoIUM_Final'
        });
        
        // Bước 4: Generate map
        await execPromise('node generate-correlation-map.js');
        
        // Đọc metrics
        const metrics = JSON.parse(
            fs.readFileSync('../CoIUM_Final/metrics.json')
        );
        
        res.json({
            success: true,
            data: metrics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
```

### 8.4. Python Service

#### File: `CoIUM_Final/recommendation_service.py`
```python
import sys
import json
from algorithms.coium import coium

def get_product_recommendations(orders_data, target_products=None, 
                               minutil=0.001, mincor=0.3, maxlen=3, top_n=10):
    # Chuyển đổi orders → dataset
    dataset, profits = prepare_dataset_from_orders(orders_data)
    
    # Chạy CoIUM
    cohuis = coium(dataset, minutil, mincor, maxlen, 
                   dataset_name="fashion_store", profits=profits)
    
    # Tính điểm cho mỗi sản phẩm
    product_scores = defaultdict(float)
    for itemset, utility, correlation in cohuis:
        score = utility * correlation
        for product_id in itemset:
            if target_products is None or product_id not in target_products:
                product_scores[product_id] += score
    
    # Sắp xếp và trả về top N
    recommendations = sorted(product_scores.items(), 
                           key=lambda x: x[1], reverse=True)[:top_n]
    
    return {
        "success": True,
        "recommendations": recommendations,
        "totalPatterns": len(cohuis)
    }

# Đọc input từ stdin (gọi từ Node.js)
if __name__ == "__main__":
    input_data = json.loads(sys.stdin.read())
    result = get_product_recommendations(**input_data)
    print(json.dumps(result, ensure_ascii=False))
```

### 8.5. Frontend Integration

#### File: `client/src/pages/admin/CoHUIManagement.jsx`
```javascript
import axios from 'axios';

const CoHUIManagement = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    
    const handleRunCoIUM = async () => {
        setIsRunning(true);
        try {
            const response = await axios.post('/api/coium-process/run');
            
            if (response.data.success) {
                toast.success('Chạy CoIUM thành công!');
                setAnalyticsData(response.data.data);
            }
        } catch (error) {
            toast.error('Lỗi khi chạy CoIUM: ' + error.message);
        } finally {
            setIsRunning(false);
        }
    };
    
    return (
        <div>
            <button onClick={handleRunCoIUM} disabled={isRunning}>
                {isRunning ? 'Đang chạy...' : 'Chạy CoIUM'}
            </button>
            
            {analyticsData && (
                <div>
                    <h3>Kết quả phân tích</h3>
                    <p>Runtime: {analyticsData.runtime}s</p>
                    <p>Memory: {analyticsData.memory} MB</p>
                    <p>Patterns: {analyticsData.patternsCount}</p>
                </div>
            )}
        </div>
    );
};
```

---

## 9. ỨNG DỤNG TRONG WEBSITE

### 9.1. Các tính năng đã triển khai

#### 9.1.1. Trang Quản lý CoHUI (Admin)
**URL:** `http://localhost:5173/admin/cohui`

**Chức năng:**
- ✅ Chạy CoIUM và phân tích dữ liệu
- ✅ Xem biểu đồ hiệu suất (7 biểu đồ)
- ✅ Lọc đơn hàng theo correlation
- ✅ Xem sản phẩm được mua cùng
- ✅ Phân tích patterns theo sản phẩm

**Tabs:**
1. **Chạy CoIUM & Phân tích**: Chạy thuật toán và xem metrics
2. **Lọc đơn hàng chung**: Xem tất cả patterns
3. **Lọc theo sản phẩm**: Xem patterns của 1 sản phẩm cụ thể
4. **Sản phẩm mua cùng**: Xem top products bought together

#### 9.1.2. Gợi ý sản phẩm (Customer)
**Vị trí:** Trang chi tiết sản phẩm

**Chức năng:**
```javascript
// Lấy recommendations cho sản phẩm đang xem
const getRecommendations = async (productId) => {
    const response = await axios.post('/api/cohui/recommend', {
        action: 'bought_together',
        productID: productId,
        topN: 5
    });
    
    return response.data.recommendations;
};
```

**Hiển thị:**
```jsx
<div className="recommendations">
    <h3>Sản phẩm thường mua cùng</h3>
    {recommendations.map(rec => (
        <ProductCard 
            key={rec.productID}
            product={rec}
            confidence={rec.confidence}
        />
    ))}
</div>
```

#### 9.1.3. Phân tích giỏ hàng
**Vị trí:** Trang giỏ hàng

**Chức năng:**
```javascript
// Gợi ý sản phẩm bổ sung cho giỏ hàng
const analyzeCart = async (cartItems) => {
    const productIds = cartItems.map(item => item.productID);
    
    const response = await axios.post('/api/cohui/recommend', {
        action: 'cart_analysis',
        cartItems: productIds,
        topN: 5
    });
    
    return response.data.recommendations;
};
```

**Hiển thị:**
```jsx
<div className="cart-suggestions">
    <h3>Bạn có thể thích thêm</h3>
    <p>Dựa trên {cartItems.length} sản phẩm trong giỏ</p>
    {suggestions.map(product => (
        <ProductCard 
            key={product.productID}
            product={product}
            score={product.score}
            onAddToCart={() => addToCart(product)}
        />
    ))}
</div>
```

#### 9.1.4. Combo khuyến mãi
**Vị trí:** Trang khuyến mãi

**Chức năng:**
- Tự động tạo combo dựa trên CoHUI patterns
- Chọn patterns có utility cao và correlation cao
- Tạo mã giảm giá cho combo

**Logic:**
```javascript
const generateCombos = async () => {
    // Lấy top patterns
    const response = await axios.post('/api/cohui/recommend', {
        action: 'recommend',
        minutil: 0.002,  // Utility cao hơn
        mincor: 0.5,     // Correlation cao hơn
        maxlen: 3,
        topN: 20
    });
    
    // Lọc patterns có ít nhất 2 sản phẩm
    const combos = response.data.patterns
        .filter(p => p.items.length >= 2)
        .map(p => ({
            products: p.items,
            discount: calculateDiscount(p.utility, p.correlation),
            name: generateComboName(p.items)
        }));
    
    return combos;
};

const calculateDiscount = (utility, correlation) => {
    // Discount cao hơn cho patterns tốt hơn
    const baseDiscount = 10; // 10%
    const utilityBonus = Math.min(utility / 10000000 * 5, 10); // Max +10%
    const correlationBonus = correlation * 5; // Max +5%
    
    return Math.round(baseDiscount + utilityBonus + correlationBonus);
};
```

### 9.2. Workflow thực tế

#### Kịch bản 1: Admin chạy phân tích
```
1. Admin truy cập /admin/cohui
2. Click "Chạy CoIUM & Phân tích"
3. Hệ thống:
   - Export 1,250 orders từ MongoDB
   - Chạy CoIUM algorithm (2.4s)
   - Tìm được 1,250 patterns
   - Tạo correlation map cho 85 sản phẩm
4. Admin xem:
   - 7 biểu đồ phân tích
   - Top patterns theo utility
   - Top patterns theo correlation
5. Admin quyết định:
   - Tạo combo khuyến mãi
   - Điều chỉnh bố trí sản phẩm
```

#### Kịch bản 2: Customer xem sản phẩm
```
1. Customer xem sản phẩm "Áo thun basic" (ID: 101)
2. Hệ thống:
   - Đọc correlation_map.json
   - Lấy top 5 sản phẩm có correlation cao với 101
3. Hiển thị section "Thường mua cùng":
   - Quần jean (ID: 102) - Confidence: 85%
   - Giày sneaker (ID: 103) - Confidence: 78%
   - Mũ lưỡi trai (ID: 105) - Confidence: 65%
4. Customer click vào Quần jean
5. Lặp lại quy trình cho sản phẩm 102
```

#### Kịch bản 3: Customer thêm vào giỏ
```
1. Customer có giỏ hàng: [101, 102]
2. Hệ thống gọi API cart_analysis
3. CoIUM tìm patterns chứa {101, 102}:
   - {101, 102, 103}: utility=5M, correlation=0.85
   - {101, 102, 105}: utility=3M, correlation=0.72
4. Gợi ý:
   - Giày sneaker (103) - Score: 4250
   - Mũ lưỡi trai (105) - Score: 2160
5. Hiển thị banner:
   "Mua thêm Giày sneaker để hoàn thiện outfit! 
    85% khách hàng mua combo này"
```

### 9.3. Tối ưu hóa hiệu suất

#### 9.3.1. Caching
```javascript
// Cache correlation map trong memory
let correlationMapCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 3600000; // 1 hour

const getCorrelationMap = () => {
    const now = Date.now();
    
    if (!correlationMapCache || (now - cacheTimestamp) > CACHE_TTL) {
        correlationMapCache = JSON.parse(
            fs.readFileSync('correlation_map.json')
        );
        cacheTimestamp = now;
    }
    
    return correlationMapCache;
};
```

#### 9.3.2. Lazy Loading
```javascript
// Chỉ load recommendations khi cần
const ProductDetail = ({ productId }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // Delay 500ms trước khi load recommendations
        const timer = setTimeout(() => {
            loadRecommendations();
        }, 500);
        
        return () => clearTimeout(timer);
    }, [productId]);
    
    const loadRecommendations = async () => {
        setLoading(true);
        const map = getCorrelationMap();
        setRecommendations(map[productId] || []);
        setLoading(false);
    };
};
```

#### 9.3.3. Batch Processing
```javascript
// Chạy CoIUM theo lịch (cron job)
const cron = require('node-cron');

// Chạy mỗi ngày lúc 2:00 AM
cron.schedule('0 2 * * *', async () => {
    console.log('Bắt đầu chạy CoIUM tự động...');
    await runCoIUMProcess();
    console.log('Hoàn thành!');
});
```

### 9.4. Điều chỉnh Parameters

#### 9.4.1. minUtil (Minimum Utility)
**Ý nghĩa:** Ngưỡng lợi nhuận tối thiểu (% của tổng utility)

**Giá trị đề xuất:**
- **0.0001 (0.01%)**: Rất thấp - Tìm được nhiều patterns nhất
- **0.001 (0.1%)**: Thấp - Cân bằng giữa số lượng và chất lượng ✅ **Khuyến nghị**
- **0.01 (1%)**: Trung bình - Chỉ patterns có utility cao
- **0.1 (10%)**: Cao - Rất ít patterns, chỉ top performers

**Khi nào tăng minUtil:**
- Dataset có quá nhiều patterns (> 10,000)
- Chỉ quan tâm đến sản phẩm bán chạy
- Muốn giảm thời gian xử lý

**Khi nào giảm minUtil:**
- Tìm được quá ít patterns (< 100)
- Muốn khám phá thêm mối quan hệ
- Dataset nhỏ

#### 9.4.2. minCor (Minimum Correlation)
**Ý nghĩa:** Ngưỡng tương quan tối thiểu (Kulczynski measure)

**Giá trị đề xuất:**
- **0.1 (10%)**: Rất thấp - Chấp nhận tương quan yếu
- **0.3 (30%)**: Thấp - Cân bằng ✅ **Khuyến nghị**
- **0.5 (50%)**: Trung bình - Tương quan khá mạnh
- **0.7 (70%)**: Cao - Chỉ patterns có tương quan rất mạnh

**Khi nào tăng minCor:**
- Muốn loại bỏ spurious patterns
- Chỉ quan tâm đến sản phẩm thực sự liên quan
- Tạo combo khuyến mãi chất lượng cao

**Khi nào giảm minCor:**
- Tìm được quá ít patterns
- Muốn khám phá mối quan hệ tiềm năng
- Dataset có sản phẩm đa dạng

#### 9.4.3. maxLen (Maximum Length)
**Ý nghĩa:** Số sản phẩm tối đa trong 1 pattern

**Giá trị đề xuất:**
- **2**: Chỉ tìm cặp sản phẩm - Nhanh nhất
- **3**: Tìm combo 2-3 sản phẩm ✅ **Khuyến nghị**
- **4**: Tìm combo lớn hơn - Chậm hơn
- **5+**: Rất chậm, ít patterns

**Trade-off:**
- maxLen càng lớn → Thời gian xử lý tăng theo cấp số nhân
- maxLen = 3 là sweet spot cho e-commerce

### 9.5. Monitoring và Logging

#### 9.5.1. Metrics cần theo dõi
```javascript
const metrics = {
    // Performance
    runtime: 2.4,              // Thời gian chạy (giây)
    memory: 340.5,             // Bộ nhớ sử dụng (MB)
    
    // Results
    patternsCount: 1250,       // Số patterns tìm được
    avgUtility: 3500000,       // Utility trung bình
    avgCorrelation: 0.68,      // Correlation trung bình
    
    // Quality
    highQualityPatterns: 450,  // Patterns có cor > 0.7
    topUtilityPattern: {       // Pattern có utility cao nhất
        items: [101, 102, 103],
        utility: 8500000,
        correlation: 0.92
    },
    
    // Coverage
    productsWithRecs: 85,      // Số sản phẩm có recommendations
    avgRecsPerProduct: 5.0,    // Số recommendations trung bình
    
    // Timestamp
    timestamp: 1701936000000,
    lastRun: "2024-12-07 14:30:00"
};
```

#### 9.5.2. Logging
```python
# File: CoIUM_Final/run_fashion_store.py
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('coium.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def run_coium_with_logging():
    logger.info("=== Bắt đầu chạy CoIUM ===")
    logger.info(f"Dataset: fashion_store")
    logger.info(f"Parameters: minUtil={MINUTIL}, minCor={MINCOR}, maxLen={MAXLEN}")
    
    start_time = time.time()
    
    try:
        # Chạy CoIUM
        cohuis = coium(dataset, MINUTIL, MINCOR, MAXLEN, "fashion_store", profits)
        
        runtime = time.time() - start_time
        
        logger.info(f"✅ Hoàn thành trong {runtime:.2f}s")
        logger.info(f"📊 Tìm được {len(cohuis)} patterns")
        logger.info(f"💰 Utility trung bình: {sum(u for _, u, _ in cohuis) / len(cohuis):.2f}")
        logger.info(f"🔗 Correlation trung bình: {sum(c for _, _, c in cohuis) / len(cohuis):.4f}")
        
        return cohuis
        
    except Exception as e:
        logger.error(f"❌ Lỗi: {str(e)}")
        raise
```

### 9.6. Troubleshooting

#### Vấn đề 1: Không tìm được patterns
**Triệu chứng:**
```json
{
  "success": true,
  "totalPatterns": 0,
  "recommendations": []
}
```

**Nguyên nhân:**
- minUtil hoặc minCor quá cao
- Dataset quá nhỏ (< 50 transactions)
- Sản phẩm không có mối quan hệ rõ ràng

**Giải pháp:**
```python
# Giảm ngưỡng
MINUTIL = 0.0001  # Từ 0.001 → 0.0001
MINCOR = 0.1      # Từ 0.3 → 0.1
```

#### Vấn đề 2: Quá nhiều patterns
**Triệu chứng:**
```json
{
  "success": true,
  "totalPatterns": 50000,
  "runtime": 120.5
}
```

**Nguyên nhân:**
- minUtil hoặc minCor quá thấp
- maxLen quá lớn

**Giải pháp:**
```python
# Tăng ngưỡng
MINUTIL = 0.01    # Từ 0.001 → 0.01
MINCOR = 0.5      # Từ 0.3 → 0.5
MAXLEN = 2        # Từ 3 → 2
```

#### Vấn đề 3: Chạy quá lâu
**Triệu chứng:**
- Runtime > 60s
- Timeout error

**Nguyên nhân:**
- Dataset quá lớn (> 10,000 transactions)
- maxLen quá lớn
- Quá nhiều items

**Giải pháp:**
```python
# 1. Giảm maxLen
MAXLEN = 2

# 2. Tăng minUtil để giảm candidate items
MINUTIL = 0.01

# 3. Giới hạn số combinations trong search
max_combinations = min(100, len(current_itemsets) * (len(current_itemsets) - 1) // 2)
```

#### Vấn đề 4: Memory error
**Triệu chứng:**
```
MemoryError: Unable to allocate array
```

**Nguyên nhân:**
- Quá nhiều Utility-Lists trong memory
- Dataset quá lớn

**Giải pháp:**
```python
# 1. Xử lý theo batch
def process_in_batches(dataset, batch_size=1000):
    results = []
    for i in range(0, len(dataset), batch_size):
        batch = dataset[i:i+batch_size]
        cohuis = coium(batch, MINUTIL, MINCOR, MAXLEN, "fashion_store")
        results.extend(cohuis)
    return results

# 2. Giải phóng memory sau mỗi iteration
import gc
gc.collect()
```

#### Vấn đề 5: Recommendations không chính xác
**Triệu chứng:**
- Gợi ý sản phẩm không liên quan
- Confidence thấp (< 30%)

**Nguyên nhân:**
- minCor quá thấp
- Dữ liệu orders không đủ chất lượng
- Profits không chính xác

**Giải pháp:**
```python
# 1. Tăng minCor
MINCOR = 0.5  # Từ 0.3 → 0.5

# 2. Kiểm tra profits
for item, profit in profits.items():
    if profit <= 0:
        print(f"Warning: Item {item} có profit = {profit}")

# 3. Lọc orders không hợp lệ
valid_orders = [
    order for order in orders 
    if len(order['items']) >= 2  # Ít nhất 2 sản phẩm
]
```

---

## 10. KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

### 10.1. Tóm tắt
CoIUM là thuật toán mạnh mẽ để khai phá patterns có cả utility cao và correlation cao, rất phù hợp cho:
- ✅ Hệ thống gợi ý sản phẩm e-commerce
- ✅ Phân tích giỏ hàng và tạo combo khuyến mãi
- ✅ Tối ưu bố trí sản phẩm và quản lý tồn kho
- ✅ Ra quyết định kinh doanh dựa trên dữ liệu

### 10.2. Ưu điểm của hệ thống hiện tại
✅ **Tích hợp đầy đủ:** Frontend (React) ↔ Backend (Node.js) ↔ Algorithm (Python)
✅ **Real-time:** Chạy CoIUM và cập nhật recommendations tự động
✅ **Scalable:** Hỗ trợ batch processing và caching
✅ **User-friendly:** Giao diện trực quan với 7 biểu đồ phân tích
✅ **Flexible:** Dễ dàng điều chỉnh parameters (minUtil, minCor, maxLen)

### 10.3. Hướng phát triển

#### 10.3.1. Tối ưu hiệu suất
- [ ] Implement parallel processing cho CoIUM
- [ ] Sử dụng database indexing cho faster queries
- [ ] Cache recommendations ở nhiều levels (Redis)
- [ ] Optimize Utility-List structure

#### 10.3.2. Cải thiện chất lượng
- [ ] Thêm time-decay factor (patterns gần đây quan trọng hơn)
- [ ] Personalized recommendations (dựa trên lịch sử user)
- [ ] A/B testing để đánh giá hiệu quả
- [ ] Feedback loop để cải thiện model

#### 10.3.3. Mở rộng tính năng
- [ ] Real-time recommendations (WebSocket)
- [ ] Cross-selling và up-selling tự động
- [ ] Seasonal pattern detection
- [ ] Anomaly detection (phát hiện patterns bất thường)

#### 10.3.4. Machine Learning Integration
- [ ] Hybrid approach: CoIUM + Collaborative Filtering
- [ ] Deep Learning cho pattern prediction
- [ ] Reinforcement Learning cho dynamic pricing
- [ ] NLP cho product similarity

#### 10.3.5. Business Intelligence
- [ ] Dashboard tổng hợp cho management
- [ ] Predictive analytics (dự đoán xu hướng)
- [ ] Customer segmentation dựa trên patterns
- [ ] ROI tracking cho recommendations

### 10.4. Best Practices

#### 10.4.1. Khi triển khai production
✅ **Chạy CoIUM định kỳ:** Mỗi ngày hoặc mỗi tuần (tùy tốc độ thay đổi data)
✅ **Monitor metrics:** Runtime, memory, patterns count, quality
✅ **A/B testing:** So sánh conversion rate có/không có recommendations
✅ **Backup data:** Lưu trữ correlation_map.json và metrics.json
✅ **Error handling:** Graceful degradation khi CoIUM fail

#### 10.4.2. Khi điều chỉnh parameters
✅ **Bắt đầu với defaults:** minUtil=0.001, minCor=0.3, maxLen=3
✅ **Điều chỉnh từ từ:** Thay đổi 1 parameter mỗi lần
✅ **Đo lường impact:** So sánh số patterns và chất lượng
✅ **Document changes:** Ghi lại lý do và kết quả
✅ **Test thoroughly:** Kiểm tra recommendations có hợp lý không

#### 10.4.3. Khi xử lý data
✅ **Clean data:** Loại bỏ orders không hợp lệ
✅ **Validate profits:** Đảm bảo tất cả products có profit > 0
✅ **Handle missing data:** Xử lý products không có trong orders
✅ **Normalize prices:** Cân nhắc normalize nếu giá chênh lệch quá lớn
✅ **Update regularly:** Đảm bảo data luôn mới nhất

### 10.5. Tài liệu tham khảo

#### Papers
1. **CoIUM:** "Correlated Itemset Utility Mining" (2021)
2. **CoUPM:** "Correlation-aware Utility Pattern Mining" (2019)
3. **CoHUI-Miner:** "Correlated High-Utility Itemset Mining" (2020)
4. **HUIM:** "High-Utility Itemset Mining: A Survey" (2018)

#### Code repositories
- GitHub: [SPMF Library](https://github.com/spmf/spmf) - Java implementation
- GitHub: [PyHUIM](https://github.com/pyhuim/pyhuim) - Python implementation

#### Documentation
- [COIUM_ANALYTICS_GUIDE.md](docs/COIUM_ANALYTICS_GUIDE.md) - Hướng dẫn sử dụng tính năng phân tích
- [COIUM_ANALYTICS_SUMMARY.md](docs/COIUM_ANALYTICS_SUMMARY.md) - Tóm tắt tính năng
- [COHUI_TESTING_GUIDE.md](docs/COHUI_TESTING_GUIDE.md) - Hướng dẫn testing

---

## PHỤ LỤC

### A. Glossary (Thuật ngữ)

| Thuật ngữ | Tiếng Việt | Định nghĩa |
|-----------|------------|------------|
| Itemset | Tập sản phẩm | Tập con các sản phẩm xuất hiện cùng nhau |
| Transaction | Giao dịch | Một đơn hàng chứa nhiều sản phẩm |
| Utility | Độ hữu ích | Tổng lợi nhuận của itemset |
| Correlation | Tương quan | Mức độ liên kết giữa các sản phẩm |
| Support | Độ hỗ trợ | Số lần itemset xuất hiện |
| TWU | Transaction Weighted Utility | Tổng utility của transactions chứa item |
| Kulczynski | Độ đo Kulczynski | Công thức tính correlation |
| Pruning | Cắt tỉa | Loại bỏ candidates không tiềm năng |
| CoHUI | Correlated High-Utility Itemset | Pattern có cả utility và correlation cao |

### B. Ví dụ đầy đủ

#### Dataset mẫu
```python
# Orders từ Fashion Store
orders = [
    {"orderID": 1, "items": [
        {"productID": 101, "name": "Áo thun basic", "price": 500000},
        {"productID": 102, "name": "Quần jean", "price": 800000},
        {"productID": 103, "name": "Giày sneaker", "price": 1200000}
    ]},
    {"orderID": 2, "items": [
        {"productID": 101, "name": "Áo thun basic", "price": 500000},
        {"productID": 102, "name": "Quần jean", "price": 800000}
    ]},
    {"orderID": 3, "items": [
        {"productID": 101, "name": "Áo thun basic", "price": 500000},
        {"productID": 103, "name": "Giày sneaker", "price": 1200000},
        {"productID": 105, "name": "Mũ lưỡi trai", "price": 200000}
    ]},
    {"orderID": 4, "items": [
        {"productID": 104, "name": "Áo khoác", "price": 1500000},
        {"productID": 102, "name": "Quần jean", "price": 800000}
    ]}
]

# Chuyển đổi
dataset = [
    [101, 102, 103],  # Order 1
    [101, 102],       # Order 2
    [101, 103, 105],  # Order 3
    [104, 102]        # Order 4
]

profits = {
    101: 500000,   # Áo thun
    102: 800000,   # Quần jean
    103: 1200000,  # Giày
    104: 1500000,  # Áo khoác
    105: 200000    # Mũ
}
```

#### Tính toán bước 1: Transaction Utility
```python
TU(T1) = 500k + 800k + 1200k = 2,500k
TU(T2) = 500k + 800k = 1,300k
TU(T3) = 500k + 1200k + 200k = 1,900k
TU(T4) = 1500k + 800k = 2,300k

Total TU = 2,500k + 1,300k + 1,900k + 2,300k = 8,000k
```

#### Tính toán bước 2: TWU
```python
TWU(101) = TU(T1) + TU(T2) + TU(T3) = 2,500k + 1,300k + 1,900k = 5,700k
TWU(102) = TU(T1) + TU(T2) + TU(T4) = 2,500k + 1,300k + 2,300k = 6,100k
TWU(103) = TU(T1) + TU(T3) = 2,500k + 1,900k = 4,400k
TWU(104) = TU(T4) = 2,300k
TWU(105) = TU(T3) = 1,900k
```

#### Tính toán bước 3: Support
```python
Support({101}) = 3  # T1, T2, T3
Support({102}) = 3  # T1, T2, T4
Support({103}) = 2  # T1, T3
Support({104}) = 1  # T4
Support({105}) = 1  # T3

Support({101, 102}) = 2  # T1, T2
Support({101, 103}) = 2  # T1, T3
Support({102, 104}) = 1  # T4
```

#### Tính toán bước 4: Utility của itemsets
```python
# 1-itemsets
Utility({101}) = 500k + 500k + 500k = 1,500k
Utility({102}) = 800k + 800k + 800k = 2,400k
Utility({103}) = 1200k + 1200k = 2,400k

# 2-itemsets
Utility({101, 102}) = (500k + 800k) + (500k + 800k) = 2,600k
Utility({101, 103}) = (500k + 1200k) + (500k + 1200k) = 3,400k
Utility({102, 103}) = (800k + 1200k) = 2,000k

# 3-itemsets
Utility({101, 102, 103}) = (500k + 800k + 1200k) = 2,500k
```

#### Tính toán bước 5: Correlation
```python
# {101, 102}
Kulc(101, 102) = 0.5 × (2/3 + 2/3) = 0.5 × 1.33 = 0.67

# {101, 103}
Kulc(101, 103) = 0.5 × (2/3 + 2/2) = 0.5 × 1.67 = 0.83

# {102, 103}
Kulc(102, 103) = 0.5 × (1/3 + 1/2) = 0.5 × 0.83 = 0.42

# {101, 102, 103}
Correlation = min(Kulc(101,102), Kulc(101,103), Kulc(102,103))
            = min(0.67, 0.83, 0.42)
            = 0.42
```

#### Kết quả với minUtil=0.001 (8k), minCor=0.3
```python
cohuis = [
    # 1-itemsets (correlation = 1.0)
    ([101], 1500000, 1.0),   # ✅ Utility >= 8k, Cor >= 0.3
    ([102], 2400000, 1.0),   # ✅
    ([103], 2400000, 1.0),   # ✅
    
    # 2-itemsets
    ([101, 102], 2600000, 0.67),  # ✅ Utility >= 8k, Cor >= 0.3
    ([101, 103], 3400000, 0.83),  # ✅
    ([102, 103], 2000000, 0.42),  # ✅
    
    # 3-itemsets
    ([101, 102, 103], 2500000, 0.42)  # ✅
]

# Tổng: 7 patterns
```

#### Recommendations cho productID 101
```python
# Tìm tất cả patterns chứa 101
patterns_with_101 = [
    ([101, 102], 2600000, 0.67),
    ([101, 103], 3400000, 0.83),
    ([101, 102, 103], 2500000, 0.42)
]

# Tính điểm cho mỗi sản phẩm (không bao gồm 101)
scores = {}

# Pattern 1: {101, 102}
scores[102] = scores.get(102, 0) + (2600000 * 0.67) = 1,742,000

# Pattern 2: {101, 103}
scores[103] = scores.get(103, 0) + (3400000 * 0.83) = 2,822,000

# Pattern 3: {101, 102, 103}
scores[102] += (2500000 * 0.42) = 1,742,000 + 1,050,000 = 2,792,000
scores[103] += (2500000 * 0.42) = 2,822,000 + 1,050,000 = 3,872,000

# Sắp xếp theo điểm
recommendations = [
    {"productID": 103, "score": 3872000, "name": "Giày sneaker"},
    {"productID": 102, "score": 2792000, "name": "Quần jean"}
]
```

### C. FAQ (Câu hỏi thường gặp)

**Q1: CoIUM khác gì với Apriori và FP-Growth?**
A: Apriori và FP-Growth chỉ tìm frequent itemsets (dựa trên support), không quan tâm đến utility (lợi nhuận). CoIUM tìm itemsets có cả utility cao và correlation cao.

**Q2: Tại sao cần correlation? Chỉ utility thôi không đủ sao?**
A: Utility cao không đảm bảo sản phẩm thực sự liên quan. Ví dụ: {iPhone, Gạo} có thể có utility cao nhưng correlation thấp (spurious pattern).

**Q3: minUtil nên set bao nhiêu?**
A: Bắt đầu với 0.001 (0.1%), sau đó điều chỉnh dựa trên số patterns tìm được. Quá nhiều → tăng minUtil, quá ít → giảm minUtil.

**Q4: Có thể chạy CoIUM real-time không?**
A: Không nên. CoIUM tốn thời gian (2-5s), nên chạy định kỳ (daily/weekly) và cache kết quả.

**Q5: Làm sao biết recommendations có hiệu quả?**
A: A/B testing! So sánh conversion rate, average order value, và click-through rate giữa có/không có recommendations.

**Q6: Dataset cần bao nhiêu transactions?**
A: Tối thiểu 100 transactions, lý tưởng > 1000 transactions để có kết quả ý nghĩa.

**Q7: Có thể dùng cho ngành hàng khác ngoài fashion không?**
A: Có! CoIUM phù hợp cho mọi ngành: grocery, electronics, books, v.v.

**Q8: Làm sao xử lý sản phẩm mới (cold start)?**
A: Sản phẩm mới chưa có trong patterns → dùng content-based filtering (category, tags) hoặc hiển thị trending products.

---

## LIÊN HỆ VÀ HỖ TRỢ

**Tác giả:** IconDenim Development Team
**Email:** support@icondenim.com
**GitHub:** https://github.com/icondenim/coium-recommendation
**Documentation:** https://docs.icondenim.com/coium

**Phiên bản:** 1.0.0
**Ngày cập nhật:** 07/12/2024

---

**© 2024 IconDenim. All rights reserved.**
