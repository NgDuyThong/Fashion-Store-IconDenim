/**
 * ===============================================
 * PDF GENERATOR UTILITIES - ICONDENIM
 * ===============================================
 * Tạo các loại PDF theo biểu mẫu chuẩn IconDenim:
 * 1. Phiếu Nhập Kho
 * 2. Hóa Đơn Bán Hàng
 * 3. Xác Nhận Đơn Hàng
 * 4. Biểu Mẫu Phản Hồi Khách Hàng
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===== FONT CONFIGURATION =====
// Cấu hình font Unicode để hiển thị tiếng Việt
const setupVietnameseFont = (doc) => {
    // jsPDF sử dụng font mặc định hỗ trợ tiếng Việt kém
    // Workaround: Sử dụng font Helvetica và encode UTF-8
    doc.setFont('helvetica');
};

// ===== COMPANY INFO =====
const COMPANY_INFO = {
    name: 'ICONDENIM',
    address: 'Địa chỉ cửa hàng',
    phone: 'Số điện thoại',
    email: 'email@icondenim.com',
    website: 'www.icondenim.com'
};

// ===== HELPER FUNCTIONS =====

/**
 * Chuyển tiếng Việt có dấu sang không dấu để tránh lỗi hiển thị PDF
 */
const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.toString();
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    return str;
};

/**
 * Format số tiền VND - chỉ hiển thị số
 */
const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return '0';
    return new Intl.NumberFormat('vi-VN').format(amount);
};

/**
 * Format ngày tháng Việt Nam
 */
const formatDate = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
};

/**
 * Thêm header với logo IconDenim
 */
const addHeader = (doc, title, formCode) => {
    const pageWidth = doc.internal.pageSize.width;
    
    // Company name - right aligned
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, pageWidth - 15, 15, { align: 'right' });
    
    // Form info - left aligned
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Don vi:.....................', 15, 15);
    doc.text('Bo phan:.....................', 15, 20);
    
    // Form code - right aligned
    doc.text(`Mau so ${formCode}`, pageWidth - 15, 20, { align: 'right' });
    
    // Title - centered
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 35, { align: 'center' });
    
    return 45; // Return Y position after header
};

/**
 * Thêm footer với chữ ký
 */
const addFooter = (doc, yPos, signatories) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Đảm bảo footer ở cuối trang hoặc sau nội dung
    let footerY = Math.max(yPos + 20, pageHeight - 60);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Số chữ ký
    const signatureCount = signatories.length;
    const spacing = pageWidth / (signatureCount + 1);
    
    signatories.forEach((sig, index) => {
        const xPos = spacing * (index + 1);
        
        // Tiêu đề chữ ký
        doc.setFont('helvetica', 'bold');
        doc.text(sig.title, xPos, footerY, { align: 'center' });
        
        // Subtitle (nếu có)
        if (sig.subtitle) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(sig.subtitle, xPos, footerY + 5, { align: 'center' });
        }
        
        // Khoảng trống cho chữ ký
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('(Ky, ghi ro ho ten)', xPos, footerY + 15, { align: 'center' });
    });
};

// ===== PDF GENERATORS =====

/**
 * 1. PHIẾU NHẬP KHO
 * Sử dụng trong Product Management khi nhập hàng
 */
export const generateInventoryImportPDF = (data) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    // Header
    let yPos = addHeader(doc, 'PHIEU NHAP KHO', '01 - VT');
    
    // Thông tin phiếu
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    const today = new Date();
    const dateStr = `Ngay ..... thang ..... nam ${today.getFullYear()}`;
    doc.text(dateStr, 15, yPos);
    yPos += 7;
    
    doc.text(`So: ${data.importNumber || '............................'}`, 15, yPos);
    const pageWidth = doc.internal.pageSize.width;
    doc.text(`No: ${data.debtorNumber || '..........'}`, pageWidth - 15, yPos - 7, { align: 'right' });
    doc.text(`Co: ${data.creditorNumber || '..........'}`, pageWidth - 15, yPos, { align: 'right' });
    yPos += 7;
    
    doc.text(`- Ho va ten nguoi giao: ${data.deliveryPerson || '............................'}`, 15, yPos);
    yPos += 7;
    
    doc.text(`- Theo ............ so ........... ngay ..... thang ..... nam ..... cua ${data.issuer || '............................'}`, 15, yPos);
    yPos += 7;
    
    doc.text(`Nhap tai kho: ${data.warehouseLocation || '............................da diem'}`, 15, yPos);
    yPos += 10;
    
    // Bảng sản phẩm
    const tableColumns = [
        { header: 'STT', dataKey: 'stt' },
        { header: 'Ten, nhan hieu, quy cach,\nphham chat va chat luong co, sp,\nhang hoa', dataKey: 'description' },
        { header: 'Ma so', dataKey: 'code' },
        { header: 'DVT', dataKey: 'unit' },
        { header: 'So luong\n\nTheo chung tu', dataKey: 'qty_doc' },
        { header: '\n\nThuc nhap', dataKey: 'qty_actual' },
        { header: 'Don gia', dataKey: 'price' },
        { header: 'Thanh tien', dataKey: 'total' }
    ];
    
    const tableData = data.items.map((item, index) => ({
        stt: index + 1,
        description: item.productName,
        code: item.productCode || '',
        unit: item.unit || 'Cai',
        qty_doc: item.quantity,
        qty_actual: item.actualQuantity || item.quantity,
        price: formatCurrency(item.price),
        total: formatCurrency(item.total)
    }));
    
    // Tính tổng số lượng và tổng tiền
    const totalQtyDoc = data.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalQtyActual = data.items.reduce((sum, item) => sum + (item.actualQuantity || item.quantity || 0), 0);
    const totalAmount = data.items.reduce((sum, item) => sum + (item.total || 0), 0);
    
    // Thêm dòng CỘNG - tổng cộng
    tableData.push({
        stt: '',
        description: 'CONG',
        code: '',
        unit: '',
        qty_doc: totalQtyDoc,
        qty_actual: totalQtyActual,
        price: '',
        total: formatCurrency(totalAmount)
    });
    
    autoTable(doc, {
        startY: yPos,
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 8,
            cellPadding: 3,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 8,
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, // STT
            1: { cellWidth: 50, halign: 'left' }, // Tên
            2: { cellWidth: 18, halign: 'center' }, // Mã số
            3: { cellWidth: 12, halign: 'center' }, // ĐVT
            4: { cellWidth: 18, halign: 'center' }, // Số lượng theo chứng từ
            5: { cellWidth: 18, halign: 'center' }, // Thực nhập
            6: { cellWidth: 28, halign: 'right' }, // Đơn giá
            7: { cellWidth: 30, halign: 'right' } // Thành tiền
        },
        didParseCell: function(data) {
            // Dòng CỘNG (dòng cuối cùng)
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 220, 220];
                data.cell.styles.fontSize = 9;
                data.cell.styles.lineWidth = 0.5;
            }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Thông tin thêm
    doc.text(`- Tong so tien (viet bang chu): ${data.totalInWords || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`- So chung tu goc kem theo: ${data.attachedDocuments || '............................'}`, 15, yPos);
    yPos += 15;
    
    // Footer với chữ ký
    addFooter(doc, yPos, [
        { title: 'Nguoi lap phieu', subtitle: '(Ky, ho ten)' },
        { title: 'Nguoi giao hang', subtitle: '(Ky, ho ten)' },
        { title: 'Thu kho', subtitle: '(Ky, ho ten)' },
        { title: 'Ke toan truong', subtitle: '(Hoac bo phan co nhu cau nhap)', subtitle2: '(Ky, ho ten)' }
    ]);
    
    // Lưu file
    const fileName = `PhieuNhapKho_${data.importNumber || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 2. HÓA ĐƠN BÁN HÀNG
 * Sử dụng trong Order Management
 */
export const generateSalesInvoicePDF = (orderData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.width;
    doc.text(COMPANY_INFO.name, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dia chi: ${orderData.shopAddress || COMPANY_INFO.address}`, pageWidth / 2, 27, { align: 'center' });
    doc.text(`DT: ${orderData.shopPhone || COMPANY_INFO.phone}`, pageWidth / 2, 32, { align: 'center' });
    
    // Tiêu đề
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let yPos = 45;
    doc.text('HOA DON BAN HANG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Thông tin khách hàng
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ten khach hang: ${removeVietnameseTones(orderData.customerName) || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`Dia chi: ${removeVietnameseTones(orderData.customerAddress) || '............................'}`, 15, yPos);
    yPos += 10;
    
    // Bảng sản phẩm
    const tableColumns = [
        { header: 'STT', dataKey: 'stt' },
        { header: 'Ten hang hoa, quy cach, pham chat', dataKey: 'productName' },
        { header: 'DVT', dataKey: 'unit' },
        { header: 'So luong', dataKey: 'quantity' },
        { header: 'Don gia', dataKey: 'price' },
        { header: 'Thanh tien', dataKey: 'total' }
    ];
    
    const tableData = orderData.items.map((item, index) => ({
        stt: index + 1,
        productName: `${removeVietnameseTones(item.productName)}${item.color ? `\nMau: ${removeVietnameseTones(item.color)}` : ''}${item.size ? ` - Size: ${item.size}` : ''}`,
        unit: 'Cai',
        quantity: item.quantity,
        price: formatCurrency(item.price),
        total: formatCurrency(item.price * item.quantity)
    }));
    
    // Tính tổng tiền hàng (chưa giảm giá)
    const subtotalAmount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Dòng CỘNG - tổng tiền hàng
    tableData.push({
        stt: '',
        productName: 'CONG',
        unit: '',
        quantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
        price: '',
        total: formatCurrency(subtotalAmount)
    });
    
    // Nếu có giảm giá, thêm dòng giảm giá
    if (orderData.discount && orderData.discount > 0) {
        tableData.push({
            stt: '',
            productName: 'Giam gia / Khuyen mai',
            unit: '',
            quantity: '',
            price: '',
            total: `-${formatCurrency(orderData.discount)}`
        });
    }
    
    // Dòng TỔNG CỘNG THANH TOÁN
    const finalAmount = orderData.finalPrice || orderData.paymentPrice || subtotalAmount;
    tableData.push({
        stt: '',
        productName: 'TONG CONG THANH TOAN',
        unit: '',
        quantity: '',
        price: '',
        total: formatCurrency(finalAmount)
    });
    
    autoTable(doc, {
        startY: yPos,
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            fontSize: 9,
            lineWidth: 0.5,
            lineColor: [0, 0, 0],
            halign: 'center',
            valign: 'middle'
        },
        bodyStyles: {
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, // STT
            1: { cellWidth: 70, halign: 'left' }, // Tên hàng
            2: { cellWidth: 15, halign: 'center' }, // ĐVT
            3: { cellWidth: 20, halign: 'center' }, // Số lượng
            4: { cellWidth: 33, halign: 'right' }, // Đơn giá
            5: { cellWidth: 35, halign: 'right' } // Thành tiền
        },
        didParseCell: function(data) {
            const rowIndex = data.row.index;
            const totalProductRows = orderData.items.length;
            
            // Dòng CỘNG
            if (rowIndex === totalProductRows) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [250, 250, 250];
                data.cell.styles.fontSize = 10;
            }
            
            // Dòng giảm giá (nếu có)
            if (orderData.discount > 0 && rowIndex === totalProductRows + 1) {
                data.cell.styles.fontStyle = 'italic';
                data.cell.styles.fillColor = [255, 255, 255];
            }
            
            // Dòng TỔNG CỘNG THANH TOÁN (luôn là dòng cuối)
            if (rowIndex === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [220, 220, 220];
                data.cell.styles.fontSize = 11;
                data.cell.styles.lineWidth = 0.7;
            }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Tổng tiền
    doc.setFont('helvetica', 'italic');
    doc.text(`Thanh tien (viet bang chu): ${orderData.totalInWords || '............................'}`, 15, yPos);
    yPos += 10;
    
    // Chữ ký
    const today = new Date();
    const dateStr = `Ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`;
    doc.text(dateStr, pageWidth - 15, yPos, { align: 'right' });
    yPos += 7;
    
    addFooter(doc, yPos, [
        { title: 'KHACH HANG', subtitle: '' },
        { title: 'NGUOI BAN HANG', subtitle: '' }
    ]);
    
    // Lưu file
    const fileName = `HoaDon_${orderData.orderID || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 2B. HÓA ĐƠN BÁN HÀNG THEO NGÀY
 * Xuất tất cả đơn hàng trong 1 ngày
 */
export const generateDailyInvoicePDF = (dailyData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY_INFO.name, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Dia chi: ${dailyData.shopAddress || COMPANY_INFO.address}`, pageWidth / 2, 27, { align: 'center' });
    doc.text(`DT: ${dailyData.shopPhone || COMPANY_INFO.phone}`, pageWidth / 2, 32, { align: 'center' });
    
    // Tiêu đề
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let yPos = 45;
    doc.text('HOA DON BAN HANG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 7;
    
    // Ngày xuất hóa đơn
    const invoiceDate = new Date(dailyData.date);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ngay: ${invoiceDate.getDate()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Tổng hợp theo từng đơn hàng
    let grandTotal = 0;
    let orderCount = 0;
    
    dailyData.orders.forEach((orderData, orderIndex) => {
        // Kiểm tra xem có đủ không gian không, nếu không thì thêm trang mới
        if (yPos > pageHeight - 80) {
            doc.addPage();
            yPos = 20;
        }
        
        orderCount++;
        
        // Thông tin đơn hàng
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Don hang #${orderData.orderID}`, 15, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Khach hang: ${removeVietnameseTones(orderData.customerName) || 'N/A'}`, 15, yPos);
        yPos += 5;
        doc.text(`Dia chi: ${removeVietnameseTones(orderData.customerAddress) || 'N/A'}`, 15, yPos);
        yPos += 7;
        
        // Bảng sản phẩm cho đơn hàng này
        const tableColumns = [
            { header: 'STT', dataKey: 'stt' },
            { header: 'Ten hang hoa', dataKey: 'productName' },
            { header: 'DVT', dataKey: 'unit' },
            { header: 'SL', dataKey: 'quantity' },
            { header: 'Don gia', dataKey: 'price' },
            { header: 'Thanh tien', dataKey: 'total' }
        ];
        
        const tableData = orderData.items.map((item, index) => ({
            stt: index + 1,
            productName: `${removeVietnameseTones(item.productName)}${item.color ? ` - ${removeVietnameseTones(item.color)}` : ''}${item.size ? ` (${item.size})` : ''}`,
            unit: 'Cai',
            quantity: item.quantity,
            price: formatCurrency(item.price),
            total: formatCurrency(item.price * item.quantity)
        }));
        
        // Tính tổng tiền hàng (chưa giảm giá)
        const orderSubtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        // Dòng CỘNG
        tableData.push({
            stt: '',
            productName: 'CONG',
            unit: '',
            quantity: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
            price: '',
            total: formatCurrency(orderSubtotal)
        });
        
        // Nếu có giảm giá, thêm dòng giảm giá
        if (orderData.discount && orderData.discount > 0) {
            tableData.push({
                stt: '',
                productName: 'Giam gia / Khuyen mai',
                unit: '',
                quantity: '',
                price: '',
                total: `-${formatCurrency(orderData.discount)}`
            });
        }
        
        // Dòng TỔNG CỘNG
        const finalOrderTotal = orderData.finalPrice || orderData.totalPrice || orderSubtotal;
        tableData.push({
            stt: '',
            productName: 'TONG CONG',
            unit: '',
            quantity: '',
            price: '',
            total: formatCurrency(finalOrderTotal)
        });
        
        // Cộng vào tổng lớn (dùng giá sau giảm)
        grandTotal += finalOrderTotal;
        
        autoTable(doc, {
            startY: yPos,
            head: [tableColumns.map(col => col.header)],
            body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 8,
                cellPadding: 3,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.2,
                lineColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [235, 235, 235],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                fontSize: 8,
                lineWidth: 0.4,
                lineColor: [0, 0, 0],
                halign: 'center'
            },
            bodyStyles: {
                lineWidth: 0.2,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' }, // STT
                1: { cellWidth: 70, halign: 'left' }, // Tên hàng
                2: { cellWidth: 12, halign: 'center' }, // ĐVT
                3: { cellWidth: 15, halign: 'center' }, // SL
                4: { cellWidth: 35, halign: 'right' }, // Đơn giá
                5: { cellWidth: 38, halign: 'right' } // Thành tiền
            },
            didParseCell: function(data) {
                const rowIndex = data.row.index;
                const totalProductRows = orderData.items.length;
                
                // Dòng CỘNG
                if (rowIndex === totalProductRows) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [250, 250, 250];
                    data.cell.styles.fontSize = 9;
                }
                
                // Dòng giảm giá (nếu có)
                if (orderData.discount > 0 && rowIndex === totalProductRows + 1) {
                    data.cell.styles.fontStyle = 'italic';
                    data.cell.styles.fillColor = [255, 255, 255];
                }
                
                // Dòng TỔNG CỘNG (luôn là dòng cuối)
                if (rowIndex === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [220, 220, 220];
                    data.cell.styles.fontSize = 9;
                    data.cell.styles.lineWidth = 0.5;
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
    });
    
    // Tổng kết cuối ngày
    if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
    }
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TONG KET NGAY:', 15, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tong so don hang: ${orderCount}`, 15, yPos);
    yPos += 6;
    doc.text(`Tong doanh thu: ${formatCurrency(grandTotal)}`, 15, yPos);
    yPos += 10;
    
    // Chữ ký
    const today = new Date();
    const dateStr = `Ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`;
    doc.text(dateStr, pageWidth - 15, yPos, { align: 'right' });
    yPos += 10;
    
    addFooter(doc, yPos, [
        { title: 'NGUOI LAP', subtitle: '(Ky, ghi ro ho ten)' },
        { title: 'KE TOAN', subtitle: '(Ky, ghi ro ho ten)' },
        { title: 'GIAM DOC', subtitle: '(Ky, ghi ro ho ten)' }
    ]);
    
    // Lưu file
    const fileName = `HoaDon_Ngay_${invoiceDate.getDate()}-${invoiceDate.getMonth() + 1}-${invoiceDate.getFullYear()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 3. XÁC NHẬN ĐƠN HÀNG
 * Sử dụng trong Order Management
 */
export const generateOrderConfirmationPDF = (orderData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPos = 20;
    
    // ===== HEADER: Logo =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ICONDENIM', 15, yPos);
    yPos += 15;
    
    // ===== TIÊU ĐỀ CHÍNH =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('XAC NHAN DON HANG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // ===== THÔNG TIN 2 CỘT =====
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const leftColX = 15;
    const rightColX = pageWidth - 15;
    
    // Dòng 1
    doc.text(`Ma don hang: ${removeVietnameseTones(orderData.orderID || '')}`, leftColX, yPos);
    doc.text(`Ben Mua: ${removeVietnameseTones(orderData.customerName || '')}`, rightColX, yPos, { align: 'right' });
    yPos += 5;
    
    // Dòng 2
    doc.text(`Ben Ban: Icondenim`, leftColX, yPos);
    doc.text(`SDT dat hang:`, rightColX, yPos, { align: 'right' });
    yPos += 5;
    
    // Dòng 3
    doc.text(`Ma so thue: 0123456789`, leftColX, yPos);
    const addressLines = doc.splitTextToSize(`Dia chi giao hang: ${removeVietnameseTones(orderData.customerAddress || '')}`, 80);
    doc.text(addressLines, rightColX, yPos, { align: 'right' });
    yPos += 5 * Math.max(1, addressLines.length);
    
    // Dòng 4
    const createdDate = orderData.createdAt ? new Date(orderData.createdAt) : new Date();
    doc.text(`Ngay xuat don: ${createdDate.toLocaleDateString('vi-VN')}`, leftColX, yPos);
    yPos += 5;
    
    // Dòng 5
    doc.text(`Ngay nhan hang: 7 ngay lam viec ke tu ngay bat mua dat coc`, leftColX, yPos);
    yPos += 10;
    
    // ===== BẢNG SẢN PHẨM =====
    const tableColumns = [
        { header: 'STT', dataKey: 'stt' },
        { header: 'San pham', dataKey: 'product' },
        { header: 'DVT', dataKey: 'unit' },
        { header: 'So luong', dataKey: 'quantity' },
        { header: 'Don gia(chua VAT) (dong)', dataKey: 'price' },
        { header: 'Thanh tien (dong)', dataKey: 'total' }
    ];
    
    // Tạo dữ liệu bảng chính
    const tableData = orderData.items.map((item, index) => {
        const productName = removeVietnameseTones(item.productName || '');
        const color = item.color ? removeVietnameseTones(item.color) : '';
        const size = item.size || '';
        const fullName = `${productName}${color ? ' - ' + color : ''}${size ? ' (' + size + ')' : ''}`;
        
        return {
            stt: index + 1,
            product: fullName,
            unit: '',
            quantity: item.quantity,
            price: formatCurrency(item.price),
            total: formatCurrency(item.price * item.quantity)
        };
    });
    
    // Thêm một dòng trống cho giao diện đẹp
    tableData.push({
        stt: '',
        product: '',
        unit: '',
        quantity: '',
        price: '',
        total: ''
    });
    
    autoTable(doc, {
        startY: yPos,
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.3,
            lineColor: [0, 0, 0],
            halign: 'center'
        },
        bodyStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            lineWidth: 0.3,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 20, halign: 'center' },
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 22, halign: 'center' },
            4: { cellWidth: 35, halign: 'right' },
            5: { cellWidth: 35, halign: 'right' }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 8;
    
    // ===== PHẦN TỔNG TIỀN =====
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const summaryX = 15;
    const summaryValueX = pageWidth - 30;
    
    // Tính toán tổng tiền hàng (chưa giảm giá)
    const totalBeforeDiscount = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // VAT 10%
    const vatAmount = Math.round(totalBeforeDiscount * 0.1);
    doc.text(`VAT (10%)`, summaryX, yPos);
    yPos += 5;
    
    // Tổng tiền (sau khuyến mãi sản phẩm nhưng chưa voucher)
    const totalAfterPromotion = orderData.totalPrice || totalBeforeDiscount;
    doc.text(`Tong tien`, summaryX, yPos);
    doc.text(formatCurrency(totalAfterPromotion), summaryValueX, yPos, { align: 'right' });
    yPos += 5;
    
    // Giảm giá (voucher)
    const discount = orderData.discount || 0;
    if (discount > 0) {
        doc.text(`Giam gia (Voucher)`, summaryX, yPos);
        doc.text(`-${formatCurrency(discount)}`, summaryValueX, yPos, { align: 'right' });
        yPos += 5;
    }
    
    // Đặt cọc
    doc.text(`Dat coc`, summaryX, yPos);
    yPos += 5;
    
    // Thanh toán khi giao hàng (tổng cuối cùng)
    const finalTotal = orderData.finalPrice || totalAfterPromotion;
    doc.setFont('helvetica', 'bold');
    doc.text(`Thanh toan khi giao hang`, summaryX, yPos);
    doc.text(formatCurrency(finalTotal), summaryValueX, yPos, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    yPos += 20;
    
    // ===== CHỮ KÝ =====
    const signatureY = yPos;
    const leftSignX = 60;
    const rightSignX = pageWidth - 60;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('BEN BAN', leftSignX, signatureY, { align: 'center' });
    doc.text('BEN MUA', rightSignX, signatureY, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('(ky, ghi ro ho ten)', leftSignX, signatureY + 5, { align: 'center' });
    doc.text('(ky, ghi ro ho ten)', rightSignX, signatureY + 5, { align: 'center' });
    
    // Lưu file
    const fileName = `XacNhanDonHang_${orderData.orderID || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 4. BIỂU MẪU PHẢN HỒI KHÁCH HÀNG
 * Sử dụng trong Customer Management
 */
export const generateCustomerFeedbackPDF = (customerData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    // Header với logo
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const pageWidth = doc.internal.pageSize.width;
    
    let yPos = 20;
    doc.text(COMPANY_INFO.name, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Tiêu đề
    doc.setFontSize(14);
    doc.text('BIEU MAU GHI NHAN PHAN HOI KHACH HANG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;
    
    // Phần I: Thông tin khách hàng
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('I. THONG TIN KHACH HANG', 15, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ho va ten: ${customerData.fullname || ''}`, 15, yPos);
    yPos += 7;
    doc.text(`So dien thoai: ${customerData.phone || ''}`, 15, yPos);
    yPos += 7;
    doc.text(`Email: ${customerData.email || ''}`, 15, yPos);
    yPos += 7;
    doc.text(`Dia chi: ${customerData.address || ''}`, 15, yPos);
    yPos += 7;
    doc.text(`Ngay phan hoi: ${formatDate(customerData.feedbackDate || new Date())}`, 15, yPos);
    yPos += 12;
    
    // Phần II: Nội dung phản hồi
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('II. NOI DUNG PHAN HOI CUA KHACH HANG', 15, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Noi dung phan hoi:', 15, yPos);
    yPos += 7;
    
    // Box cho nội dung phản hồi
    const boxHeight = 40;
    doc.rect(15, yPos, pageWidth - 30, boxHeight);
    
    // Split feedback text để fit trong box
    if (customerData.feedback) {
        const splitText = doc.splitTextToSize(customerData.feedback, pageWidth - 40);
        doc.text(splitText, 20, yPos + 5);
    }
    
    yPos += boxHeight + 12;
    
    // Phần III: Phương án xử lý
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('III. PHUONG AN XU LY CUA NHAN VIEN/SHOP', 15, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Phuong an xu ly:', 15, yPos);
    yPos += 7;
    
    // Box cho phương án xử lý
    doc.rect(15, yPos, pageWidth - 30, boxHeight);
    
    if (customerData.resolution) {
        const splitText = doc.splitTextToSize(customerData.resolution, pageWidth - 40);
        doc.text(splitText, 20, yPos + 5);
    }
    
    yPos += boxHeight + 12;
    
    // Phần IV: Đánh giá
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('IV. DANH GIA SAU XU LY CUA KHACH HANG', 15, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Muc do hai long: Danh X', 15, yPos);
    yPos += 7;
    
    // Rating boxes
    const ratings = ['Rat hai long', 'Hai long', 'Binh thuong', 'Khong hai long'];
    const boxSize = 5;
    const startX = 15;
    const spacing = 45;
    
    ratings.forEach((rating, index) => {
        const xPos = startX + (index * spacing);
        doc.rect(xPos, yPos, boxSize, boxSize); // Checkbox
        doc.text(rating, xPos + boxSize + 3, yPos + 4);
        
        // Đánh dấu nếu có rating
        if (customerData.rating && customerData.rating === rating) {
            doc.text('X', xPos + 1, yPos + 4);
        }
    });
    
    yPos += 15;
    
    // Chữ ký
    addFooter(doc, yPos, [
        { title: 'Nguoi ghi nhan', subtitle: '(Ky, ghi ro ho ten)' },
        { title: 'Khach hang', subtitle: '(Ky, ghi ro ho ten)' }
    ]);
    
    // Lưu file
    const fileName = `PhanHoiKhachHang_${customerData.userID || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * ===== EXPORT ALL FUNCTIONS =====
 */
export default {
    generateInventoryImportPDF,
    generateSalesInvoicePDF,
    generateOrderConfirmationPDF,
    generateCustomerFeedbackPDF,
    formatCurrency,
    formatDate
};
