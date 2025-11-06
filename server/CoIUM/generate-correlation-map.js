/**
 * SCRIPT KIỂM TRA GỢI Ý SẢN PHẨM TƯƠNG QUAN
 * So sánh kết quả từ CoIUM với API gợi ý hiện tại
 */

const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Product = require('../models/Product');

async function testProductRecommendations() {
    try {
        console.log('🔌 Đang kết nối MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối thành công!\n');

        // Load correlation recommendations từ CoIUM
        const correlationPath = path.join(__dirname, '../../CoIUM_Final/correlation_recommendations.json');
        const correlations = JSON.parse(fs.readFileSync(correlationPath, 'utf8'));
        
        console.log(`📊 Đã load correlation recommendations cho ${Object.keys(correlations).length} sản phẩm\n`);

        // Load tất cả products từ DB
        const products = await Product.find({}).lean();
        const productMap = {};
        products.forEach(p => {
            productMap[p.productID] = p;
        });

        console.log('═'.repeat(100));
        console.log('KIỂM TRA GỢI Ý SẢN PHẨM TƯƠNG QUAN');
        console.log('═'.repeat(100));
        console.log();

        // Test với 10 sản phẩm phổ biến nhất
        const testProducts = [104, 73, 103, 21, 85, 72, 54, 64, 107, 52];

        for (const productID of testProducts) {
            const product = productMap[productID];
            if (!product) {
                console.log(`⚠️  Không tìm thấy sản phẩm #${productID}\n`);
                continue;
            }

            console.log('─'.repeat(100));
            console.log(`📦 SẢN PHẨM #${productID}: ${product.name}`);
            console.log(`   Category: ${product.categoryID} | Target: ${product.targetID} | Price: ${product.price.toLocaleString()}đ`);
            console.log('─'.repeat(100));

            // Lấy recommendations từ CoIUM
            const recommendedIDs = correlations[productID] || [];
            
            if (recommendedIDs.length === 0) {
                console.log('⚠️  Không có recommendations từ CoIUM\n');
                continue;
            }

            console.log(`\n🎯 TOP ${Math.min(5, recommendedIDs.length)} SẢN PHẨM ĐƯỢC GỢI Ý (từ CoIUM):\n`);
            console.log(`#     ID     Tên sản phẩm                                  Category   Target   Price`);
            console.log('─'.repeat(100));

            recommendedIDs.slice(0, 5).forEach((recID, index) => {
                const recProduct = productMap[recID];
                if (recProduct) {
                    const sameCategory = recProduct.categoryID === product.categoryID ? '✓' : ' ';
                    const sameTarget = recProduct.targetID === product.targetID ? '✓' : ' ';
                    const name = recProduct.name.substring(0, 42).padEnd(45);
                    
                    console.log(
                        `${(index + 1 + '.').padEnd(5)} ` +
                        `${String(recID).padEnd(6)} ` +
                        `${name} ` +
                        `${(recProduct.categoryID + ' ' + sameCategory).padEnd(10)} ` +
                        `${(recProduct.targetID + ' ' + sameTarget).padEnd(8)} ` +
                        `${(recProduct.price.toLocaleString() + 'đ').padEnd(15)}`
                    );
                }
            });

            // Phân tích độ tương đồng
            const recProducts = recommendedIDs.slice(0, 5)
                .map(id => productMap[id])
                .filter(p => p);

            const sameCategoryCount = recProducts.filter(p => p.categoryID === product.categoryID).length;
            const sameTargetCount = recProducts.filter(p => p.targetID === product.targetID).length;
            const avgPrice = recProducts.reduce((sum, p) => sum + p.price, 0) / recProducts.length;
            const priceDiff = Math.abs(avgPrice - product.price) / product.price * 100;

            console.log('\n📊 PHÂN TÍCH ĐỘ TƯƠNG ĐỒNG:');
            console.log(`   • Cùng category: ${sameCategoryCount}/${recProducts.length} (${(sameCategoryCount/recProducts.length*100).toFixed(1)}%)`);
            console.log(`   • Cùng target:   ${sameTargetCount}/${recProducts.length} (${(sameTargetCount/recProducts.length*100).toFixed(1)}%)`);
            console.log(`   • Chênh lệch giá trung bình: ${priceDiff.toFixed(1)}%`);
            
            // Đánh giá chất lượng
            let quality = 'Tốt';
            if (sameCategoryCount >= 3 && sameTargetCount >= 3) {
                quality = '⭐ Xuất sắc';
            } else if (sameCategoryCount >= 2 && sameTargetCount >= 2) {
                quality = '✓ Tốt';
            } else if (sameCategoryCount >= 1 || sameTargetCount >= 1) {
                quality = '~ Trung bình';
            } else {
                quality = '✗ Cần cải thiện';
            }
            console.log(`   • Chất lượng gợi ý: ${quality}`);
            console.log();
        }

        console.log('═'.repeat(100));
        console.log('TỔNG KẾT');
        console.log('═'.repeat(100));
        console.log();
        console.log('📋 CÁCH SỬ DỤNG KẾT QUẢ NÀY:');
        console.log();
        console.log('1. File correlation_recommendations.json chứa danh sách sản phẩm tương quan');
        console.log('2. Để kiểm tra API gợi ý, truy cập: http://localhost:5000/api/cohui/recommendations/:productId');
        console.log('3. So sánh kết quả API với bảng trên để đánh giá độ chính xác');
        console.log();
        console.log('💡 GỢI Ý CÁCH KIỂM TRA:');
        console.log('   • Mở trang chi tiết sản phẩm trên website');
        console.log('   • Xem phần "Sản phẩm tương tự" hoặc "Có thể bạn cũng thích"');
        console.log('   • So sánh với danh sách recommendations ở trên');
        console.log('   • Nếu trùng khớp => Hệ thống hoạt động đúng ✓');
        console.log('   • Nếu khác biệt => Cần cập nhật logic API');
        console.log();
        
        // Tạo file để import vào server
        console.log('📝 Đang tạo file correlation_map.json cho server...');
        const serverCorrelationPath = path.join(__dirname, 'correlation_map.json');
        
        // Thêm thông tin chi tiết cho mỗi recommendation
        const detailedCorrelations = {};
        for (const [productID, recIDs] of Object.entries(correlations)) {
            detailedCorrelations[productID] = recIDs.map(recID => {
                const recProduct = productMap[recID];
                return {
                    productID: recID,
                    name: recProduct ? recProduct.name : 'Unknown',
                    categoryID: recProduct ? recProduct.categoryID : null,
                    targetID: recProduct ? recProduct.targetID : null,
                    price: recProduct ? recProduct.price : 0
                };
            });
        }
        
        fs.writeFileSync(serverCorrelationPath, JSON.stringify(detailedCorrelations, null, 2), 'utf8');
        console.log(`✅ Đã tạo file: ${serverCorrelationPath}\n`);

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

// Chạy script
testProductRecommendations();
