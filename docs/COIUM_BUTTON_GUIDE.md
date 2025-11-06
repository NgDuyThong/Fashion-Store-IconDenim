# Hướng Dẫn Sử Dụng Nút "Chạy CoIUM"

## Mô Tả
Đã thêm nút "Chạy CoIUM" vào trang Quản lý đơn hàng (http://localhost:5173/admin/orders). Khi click vào nút này, hệ thống sẽ tự động chạy toàn bộ quy trình CoIUM để phân tích correlation giữa các sản phẩm.

## Vị Trí
- Trang: `/admin/orders`
- Vị trí nút: Góc phải trên cùng, cùng dòng với tiêu đề "Quản lý đơn hàng"

## Quy Trình Tự Động

Khi click nút "Chạy CoIUM", hệ thống sẽ thực hiện 4 bước:

### Bước 1: Export Orders từ MongoDB
- File: `server/export-orders-for-coium.js`
- Xuất tất cả orders và order_details từ MongoDB
- Tạo file: `CoIUM_Final/datasets/fashion_store.dat`
- Tạo file: `CoIUM_Final/profits/fashion_store_profits.txt`

### Bước 2: Chạy CoIUM Algorithm
- File: `CoIUM_Final/run_fashion_store.py`
- Chạy thuật toán CoIUM, CoUPM, CoHUI-Miner
- Phân tích correlation giữa các sản phẩm
- Tạo file kết quả trong `CoIUM_Final/results/`

### Bước 3: Phân Tích Correlation
- File: `CoIUM_Final/analyze_correlation_results.py`
- Tính toán co-occurrence matrix
- Tính Lift score cho từng cặp sản phẩm
- Tạo file: `CoIUM_Final/correlation_recommendations.json`

### Bước 4: Generate Correlation Map
- File: `server/test-product-recommendations.js`
- Lấy thông tin chi tiết sản phẩm từ MongoDB
- Tạo file: `server/correlation_map.json`
- File này được API sử dụng để gợi ý sản phẩm

## Kết Quả

Sau khi chạy thành công, bạn sẽ thấy:
- Toast notification: "Chạy CoIUM thành công!"
- Hiển thị số lượng sản phẩm đã phân tích
- File `correlation_map.json` được cập nhật
- Tất cả API recommendations sẽ sử dụng dữ liệu mới

## Thời Gian Thực Hiện
- Export orders: ~5-10 giây
- Chạy CoIUM: ~2-4 phút (tùy số lượng đơn hàng)
- Phân tích correlation: ~5-10 giây
- Generate map: ~5-10 giây
- **Tổng: ~2-5 phút**

## API Endpoint
- Method: `POST`
- URL: `http://localhost:5000/api/coium-process/run`
- Response:
```json
{
  "success": true,
  "message": "Chạy CoIUM thành công!",
  "data": {
    "totalProducts": 105,
    "steps": [
      { "step": 1, "name": "Export orders", "status": "completed" },
      { "step": 2, "name": "Run CoIUM", "status": "completed" },
      { "step": 3, "name": "Analyze correlation", "status": "completed" },
      { "step": 4, "name": "Generate correlation map", "status": "completed" }
    ]
  }
}
```

## Files Đã Tạo/Sửa Đổi

### Backend
1. `server/controllers/CoIUMProcessController.js` - Controller mới
2. `server/routes/coium-process.route.js` - Route mới
3. `server/server.js` - Thêm route vào app
4. `server/test-coium-process.js` - File test API

### Frontend
1. `client/src/pages/admin/OrderManagement.jsx` - Thêm nút và logic

## Test API
Để test API từ terminal:
```bash
cd server
node test-coium-process.js
```

## Lưu Ý
- Đảm bảo server đang chạy (port 5000)
- Đảm bảo MongoDB đang chạy và có dữ liệu orders
- Python phải được cài đặt và có thể chạy từ command line
- Tất cả dependencies Python phải được cài đặt (requirements.txt)

## Khi Nào Cần Chạy?
- Sau khi cập nhật giá sản phẩm
- Sau khi thêm nhiều đơn hàng mới
- Sau khi thêm/xóa sản phẩm
- Định kỳ để cập nhật recommendations
