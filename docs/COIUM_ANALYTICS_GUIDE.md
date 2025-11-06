# Hướng dẫn sử dụng tính năng Phân tích CoIUM

## Tổng quan
Tính năng **Chạy CoIUM & Phân tích** đã được thêm vào trang **Lọc đơn hàng CoHUI** tại `http://localhost:5173/admin/cohui`. Tính năng này cho phép:
1. Chạy thuật toán CoIUM trực tiếp từ giao diện
2. Xem các biểu đồ phân tích hiệu suất chi tiết

## Vị trí
- **URL**: http://localhost:5173/admin/cohui
- **Tab**: "Chạy CoIUM & Phân tích" (tab đầu tiên)
- **File code**: `client/src/pages/admin/CoHUIManagement.jsx`

## Cách sử dụng

### 1. Chạy CoIUM
1. Truy cập trang http://localhost:5173/admin/cohui
2. Click vào tab **"Chạy CoIUM & Phân tích"**
3. Click nút **"Chạy CoIUM"**
4. Đợi quá trình xử lý hoàn tất (có thể mất vài phút)
5. Xem thông báo kết quả và các biểu đồ phân tích

### 2. Xem các biểu đồ

Sau khi chạy CoIUM thành công, hệ thống sẽ hiển thị 7 biểu đồ phân tích:

#### **Fig 1: Thời gian chạy - Dense Datasets**
- **Mục đích**: So sánh runtime với các ngưỡng minUtil khác nhau trên tập dữ liệu dày đặc
- **Trục X**: minUtil (5, 10, 15, 20, 25, 30)
- **Trục Y**: Thời gian (giây)
- **Các đường**: minCor = 0.2, 0.4, 0.6, 0.8
- **Ý nghĩa**: Khi minUtil tăng → runtime giảm (ít pattern cần xử lý hơn)

#### **Fig 2: Thời gian chạy - Sparse Datasets**
- **Mục đích**: So sánh runtime trên tập dữ liệu thưa (như Retail, Ecommerce)
- **Trục X**: minUtil (100, 200, 300, 400, 500, 600)
- **Trục Y**: Thời gian (giây)
- **Đặc điểm**: Runtime cao hơn Dense vì dữ liệu phân tán

#### **Fig 3: Tiêu thụ bộ nhớ - Dense Datasets**
- **Mục đích**: Đo memory usage với minUtil khác nhau
- **Trục X**: minUtil (5, 10, 15, 20, 25, 30)
- **Trục Y**: Bộ nhớ (MB)
- **Loại biểu đồ**: Bar chart (cột)
- **Ý nghĩa**: Memory giảm khi minUtil tăng

#### **Fig 4: Tiêu thụ bộ nhớ - Sparse Datasets**
- **Mục đích**: Memory usage trên sparse datasets
- **Trục X**: minUtil (100, 200, 300, 400, 500, 600)
- **Trục Y**: Bộ nhớ (MB)
- **Đặc điểm**: Tiêu thụ memory cao hơn Dense

#### **Fig 5: Khả năng mở rộng - Retail Dataset**
- **Mục đích**: Kiểm tra scalability khi tăng kích thước dữ liệu
- **2 biểu đồ con**:
  - **Runtime vs Data Size**: Thời gian tăng tuyến tính
  - **Memory vs Data Size**: Bộ nhớ tăng theo kích thước data
- **Trục X**: Data size (20%, 40%, 60%, 80%, 100%)

#### **Fig 6: Số lượng Pattern - So sánh thuật toán**
- **Mục đích**: So sánh CoIUM vs CoHUI vs COUP
- **Trục X**: minUtil (5, 10, 15, 20, 25, 30)
- **Trục Y**: Số lượng patterns tìm được
- **3 đường**:
  - **CoIUM** (xanh dương): Tìm được nhiều pattern nhất
  - **CoHUI** (xanh lá): Ít hơn CoIUM một chút
  - **COUP** (cam): Ít pattern nhất vì có ràng buộc utility

#### **Fig 7: Chất lượng Correlation**
- **2 biểu đồ con**:
  - **Average Correlation**: Correlation trung bình tăng khi minCor tăng
  - **High Quality Patterns (%)**: % patterns có chất lượng cao
- **Trục X**: minCor (0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8)
- **Ý nghĩa**: minCor cao → chất lượng pattern tốt hơn nhưng số lượng ít hơn

### 3. Tổng kết phân tích
Ở cuối trang có 3 số liệu tóm tắt:
- **Thời gian chạy trung bình**: 2.4s (Dense datasets)
- **Bộ nhớ trung bình**: 340 MB (Sparse datasets)
- **Patterns tìm được**: 1,250 (minUtil=5, minCor=0.2)

## Kỹ thuật thực hiện

### States được thêm
```javascript
const [isRunningCoIUM, setIsRunningCoIUM] = useState(false);
const [analyticsData, setAnalyticsData] = useState(null);
```

### API được gọi
```javascript
POST /api/coium-process/run
```

### Dữ liệu mock
Hiện tại sử dụng `generateMockAnalytics()` để tạo dữ liệu mẫu. Trong production, cần thay bằng dữ liệu thực từ Python/CoIUM.

### Thư viện Chart
- **react-chartjs-2**: Wrapper React cho Chart.js
- **chart.js**: Thư viện vẽ biểu đồ
- **Đã cài đặt sẵn**: ✅

## Tích hợp với backend

### Cần làm thêm (tùy chọn)
1. **Thu thập metrics thực từ Python**:
   ```python
   # Trong CoIUM_Final/main.py hoặc recommendation_service.py
   metrics = {
       "runtime": execution_time,
       "memory": memory_usage,
       "patterns_count": len(patterns),
       "avg_correlation": calculate_avg_correlation()
   }
   ```

2. **Lưu metrics vào file JSON**:
   ```python
   with open('analytics_metrics.json', 'w') as f:
       json.dump(metrics, f)
   ```

3. **Đọc từ backend**:
   ```javascript
   // Trong CoIUMProcessController.js
   const metrics = JSON.parse(fs.readFileSync('analytics_metrics.json'));
   res.json({ ...response, metrics });
   ```

4. **Update frontend**:
   ```javascript
   // Thay generateMockAnalytics() bằng metrics thực
   setAnalyticsData(response.data.metrics);
   ```

## Ưu điểm

✅ **Trực quan**: Dễ dàng so sánh hiệu suất với các biểu đồ
✅ **Tích hợp**: Nút chạy CoIUM ngay trong trang phân tích
✅ **Đầy đủ**: 7 biểu đồ bao quát runtime, memory, scalability, quality
✅ **Responsive**: Hỗ trợ dark mode, responsive design
✅ **Thời gian thực**: Timestamp hiển thị lần chạy cuối cùng

## Lưu ý

⚠️ **Mock data**: Hiện tại dùng dữ liệu mẫu, cần thay bằng metrics thực
⚠️ **Performance**: Chạy CoIUM có thể mất vài phút với dataset lớn
⚠️ **Memory**: Browser cần đủ RAM để render nhiều biểu đồ

## Tham khảo

- **Chart.js docs**: https://www.chartjs.org/docs/latest/
- **react-chartjs-2**: https://react-chartjs-2.js.org/
- **CoIUM paper**: [Nếu có link paper CoIUM]

## Screenshots

### Tab Analytics - Chưa chạy CoIUM
![Empty State](screenshot-empty.png)

### Tab Analytics - Sau khi chạy CoIUM
![With Charts](screenshot-charts.png)

---

**Tác giả**: GitHub Copilot  
**Ngày tạo**: 3/11/2025  
**Version**: 1.0
