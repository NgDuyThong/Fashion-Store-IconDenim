/**
 * SCRIPT XUẤT DỮ LIỆU TỪ MONGODB SANG ĐỊNH DẠNG CHO CoIUM
 * Đồ án tốt nghiệp - Fashion Store
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

async function exportDataForCoIUM() {
    try {
        console.log('🔌 Đang kết nối MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Kết nối thành công!\n');

        // Lấy tất cả orders
        console.log('📦 Đang lấy dữ liệu orders và order details...');
        const orders = await Order.find({}).lean();
        const orderDetails = await OrderDetail.find({}).lean();
        const products = await Product.find({}).lean();

        console.log(`✅ Đã lấy ${orders.length} orders`);
        console.log(`✅ Đã lấy ${orderDetails.length} order details`);
        console.log(`✅ Đã lấy ${products.length} products\n`);

        // Tạo map productID -> price cho profits
        const productProfitMap = {};
        products.forEach(p => {
            productProfitMap[p.productID] = Math.round(p.price);
        });

        // Group order details theo orderID
        const orderDetailsMap = {};
        orderDetails.forEach(od => {
            if (!orderDetailsMap[od.orderID]) {
                orderDetailsMap[od.orderID] = [];
            }
            orderDetailsMap[od.orderID].push(od);
        });

        // ========================================================================
        // 1. TẠO FILE TRANSACTIONS (định dạng: itemID itemID itemID...)
        // ========================================================================
        console.log('📝 Đang tạo file transactions...');
        let transactionLines = [];
        let validOrderCount = 0;

        orders.forEach(order => {
            const details = orderDetailsMap[order.orderID] || [];
            if (details.length > 0) {
                // Lấy danh sách productID từ SKU
                const productIDs = details.map(d => {
                    // SKU format: PRODUCT_ID-SIZE-COLOR_ID hoặc PRODUCT_ID-COLOR_ID
                    const parts = d.SKU.split('-');
                    return parseInt(parts[0]);
                }).filter(id => !isNaN(id));

                if (productIDs.length > 0) {
                    transactionLines.push(productIDs.join(' '));
                    validOrderCount++;
                }
            }
        });

        const transactionFile = path.join(__dirname, '../../CoIUM_Final/datasets/fashion_store.dat');
        fs.writeFileSync(transactionFile, transactionLines.join('\n'), 'utf8');
        console.log(`✅ Đã tạo ${transactionFile}`);
        console.log(`   - ${validOrderCount} transactions hợp lệ\n`);

        // ========================================================================
        // 2. TẠO FILE PROFITS (định dạng: itemID:profit itemID:profit...)
        // ========================================================================
        console.log('💰 Đang tạo file profits...');
        
        // Lấy tất cả unique productIDs từ transactions
        const allProductIDs = new Set();
        transactionLines.forEach(line => {
            line.split(' ').forEach(id => allProductIDs.add(parseInt(id)));
        });

        // Tạo profit line
        const profitPairs = [];
        Array.from(allProductIDs).sort((a, b) => a - b).forEach(productID => {
            const profit = productProfitMap[productID] || 1000; // Default 1000 nếu không tìm thấy
            profitPairs.push(`${productID}:${profit}`);
        });

        const profitFile = path.join(__dirname, '../../CoIUM_Final/profits/fashion_store_profits.txt');
        // Format: item profit (mỗi cặp trên 1 dòng) để phù hợp với load_profits_from_file
        const profitLines = profitPairs.map(pair => pair.replace(':', ' '));
        fs.writeFileSync(profitFile, profitLines.join('\n'), 'utf8');
        console.log(`✅ Đã tạo ${profitFile}`);
        console.log(`   - ${profitPairs.length} sản phẩm có profit\n`);

        // ========================================================================
        // 3. THỐNG KÊ
        // ========================================================================
        console.log('📊 THỐNG KÊ DỮ LIỆU:\n');
        console.log('═'.repeat(80));
        console.log(`Tổng số orders        : ${orders.length}`);
        console.log(`Orders hợp lệ         : ${validOrderCount}`);
        console.log(`Tổng order details    : ${orderDetails.length}`);
        console.log(`Tổng sản phẩm unique  : ${allProductIDs.size}`);
        console.log(`Tổng sản phẩm có profit: ${profitPairs.length}`);
        console.log('═'.repeat(80));

        // Thống kê số items per transaction
        const itemsPerTrans = transactionLines.map(line => line.split(' ').length);
        const avgItems = (itemsPerTrans.reduce((a, b) => a + b, 0) / itemsPerTrans.length).toFixed(2);
        const minItems = Math.min(...itemsPerTrans);
        const maxItems = Math.max(...itemsPerTrans);

        console.log(`\nSố items/transaction:`);
        console.log(`  - Trung bình: ${avgItems}`);
        console.log(`  - Min: ${minItems}`);
        console.log(`  - Max: ${maxItems}`);

        // Top 10 sản phẩm xuất hiện nhiều nhất
        const productCount = {};
        transactionLines.forEach(line => {
            line.split(' ').forEach(id => {
                productCount[id] = (productCount[id] || 0) + 1;
            });
        });

        console.log(`\n🏆 TOP 10 SẢN PHẨM XUẤT HIỆN NHIỀU NHẤT:\n`);
        Object.entries(productCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([productID, count], index) => {
                const product = products.find(p => p.productID === parseInt(productID));
                const name = product ? product.name : 'Unknown';
                console.log(`${index + 1}. Product #${productID} (${name}): ${count} lần`);
            });

        console.log('\n✅ XUẤT DỮ LIỆU HOÀN TẤT!\n');
        console.log('📁 Files đã tạo:');
        console.log(`   - ${transactionFile}`);
        console.log(`   - ${profitFile}\n`);
        console.log('🚀 Bây giờ bạn có thể chạy CoIUM với lệnh:');
        console.log('   cd ../CoIUM_Final');
        console.log('   python run_fashion_store.py\n');

    } catch (error) {
        console.error('❌ Lỗi:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
    }
}

// Chạy script
exportDataForCoIUM();
