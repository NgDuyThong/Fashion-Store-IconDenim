# Script khởi động nhanh CoHUI System
# Chạy: .\start-cohui.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  CoHUI Recommendation System  " -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra Python
Write-Host "Kiểm tra Python..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python chưa được cài đặt!" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Python từ https://www.python.org/" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python OK" -ForegroundColor Green
Write-Host ""

# Kiểm tra NumPy
Write-Host "Kiểm tra NumPy..." -ForegroundColor Yellow
python -c "import numpy; print('NumPy version:', numpy.__version__)" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  NumPy chưa được cài đặt!" -ForegroundColor Yellow
    Write-Host "Đang cài đặt NumPy..." -ForegroundColor Yellow
    pip install numpy
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Không thể cài đặt NumPy!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ NumPy OK" -ForegroundColor Green
Write-Host ""

# Kiểm tra Node.js
Write-Host "Kiểm tra Node.js..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Node.js chưa được cài đặt!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js OK" -ForegroundColor Green
Write-Host ""

# Kiểm tra MongoDB
Write-Host "Kiểm tra kết nối MongoDB..." -ForegroundColor Yellow
Write-Host "⚠️  Đảm bảo MongoDB đang chạy và MONGODB_URI đã được cấu hình trong .env" -ForegroundColor Yellow
Write-Host ""

# Hỏi có muốn chạy test không
Write-Host "Bạn có muốn chạy test API trước không? (y/n): " -ForegroundColor Cyan -NoNewline
$runTest = Read-Host
Write-Host ""

if ($runTest -eq "y" -or $runTest -eq "Y") {
    Write-Host "Đang chạy test..." -ForegroundColor Yellow
    cd server
    node test-cohui.js
    cd ..
    Write-Host ""
    Write-Host "Nhấn Enter để tiếp tục khởi động server..." -ForegroundColor Cyan
    Read-Host
}

# Khởi động server
Write-Host "================================" -ForegroundColor Green
Write-Host "  Khởi động server...          " -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Server sẽ chạy tại: http://localhost:5000" -ForegroundColor Cyan
Write-Host "API CoHUI: http://localhost:5000/api/cohui/recommendations" -ForegroundColor Cyan
Write-Host ""
Write-Host "Nhấn Ctrl+C để dừng server" -ForegroundColor Yellow
Write-Host ""

cd server
npm start
