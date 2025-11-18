/**
 * ===============================================
 * PDF GENERATOR UTILITIES - ICONDENIM (FIXED VERSION)
 * ===============================================
 * Tạo các loại PDF theo biểu mẫu chuẩn IconDenim:
 * 1. Phiếu Nhập Kho
 * 2. Hóa Đơn Bán Hàng
 * 3. Xác Nhận Đơn Hàng
 * 4. Biểu Mẫu Phản Hồi Khách Hàng
 */

// IMPORT ĐÚNG CÁCH CHO JSPDF 3.x và jspdf-autotable 5.x
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ===== FONT CONFIGURATION =====
const setupVietnameseFont = (doc) => {
    // Sử dụng font Times vì hỗ trợ Unicode tốt hơn Helvetica
    doc.setFont('times');
};

// ===== HELPER FUNCTIONS =====

/**
 * Chuyển tiếng Việt có dấu sang không dấu để tránh lỗi hiển thị
 */
const removeVietnameseTones = (str) => {
    if (!str) return '';
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    return str;
};

/**
 * Format text an toàn cho PDF - loại bỏ ký tự đặc biệt
 */
const sanitizeText = (text) => {
    if (!text) return '';
    // Chuyển sang không dấu
    return removeVietnameseTones(text.toString());
};

/**
 * Format số tiền VND
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
        
        // Subtitle
        if (sig.subtitle) {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(sig.subtitle, xPos, footerY + 5, { align: 'center' });
        }
        
        // Phần chữ ký (để trống)
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
    
    // Thêm dòng tổng cộng
    tableData.push({
        stt: '',
        description: 'Cong',
        code: 'x',
        unit: 'x',
        qty_doc: 'x',
        qty_actual: 'x',
        price: 'x',
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
            valign: 'middle'
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        bodyStyles: {
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 20 },
            3: { cellWidth: 15 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
            6: { cellWidth: 25 },
            7: { cellWidth: 28 }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Tổng tiền bằng chữ
    doc.setFont('helvetica', 'italic');
    doc.text(`Cong thanh tien (viet bang chu): ${data.totalInWords || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`So chung tu goc kem theo: ${data.attachedDocuments || '............................'}`, 15, yPos);
    yPos += 10;
    
    // Footer chữ ký
    addFooter(doc, yPos, [
        { title: 'NGUOI LAP PHIEU', subtitle: '' },
        { title: 'NGUOI GIAO HANG', subtitle: '' },
        { title: 'THU KHO', subtitle: '' },
        { title: 'KE TOAN TRUONG', subtitle: '' }
    ]);
    
    // Lưu file với dialog chọn nơi lưu
    const fileName = `PhieuNhapKho_${data.importNumber || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 2. HÓA ĐƠN BÁN HÀNG (ĐƠN LẺ)
 * Sử dụng trong Order Management - xuất từng đơn hàng
 */
export const generateSalesInvoicePDF = (orderData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    
    // ===== HEADER =====
    let yPos = 20;
    
    // Logo/Tên công ty
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.text('ICONDENIM', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Địa chỉ
    doc.setFontSize(9);
    doc.setFont('times', 'normal');
    doc.text(`Dia chi: ${sanitizeText(orderData.shopAddress || 'Thu Duc, Thanh pho Ho Chi Minh')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(`DT: ${orderData.shopPhone || '0123456789'}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // ===== TIÊU ĐỀ =====
    doc.setFontSize(16);
    doc.setFont('times', 'bold');
    doc.text('HOA DON BAN HANG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // Ngày
    const today = new Date();
    doc.setFontSize(11);
    doc.setFont('times', 'normal');
    doc.text(`Ngay: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // ===== THÔNG TIN ĐƠN HÀNG =====
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text(`Don hang #${orderData.orderID}`, margin, yPos);
    yPos += 7;
    
    // ===== THÔNG TIN KHÁCH HÀNG =====
    doc.setFont('times', 'normal');
    doc.text(`Khach hang: ${sanitizeText(orderData.customerName)}`, margin, yPos);
    yPos += 6;
    doc.text(`Dia chi: ${sanitizeText(orderData.customerAddress)}`, margin, yPos);
    yPos += 10;
    
    // ===== BẢNG SẢN PHẨM =====
    const tableColumns = [
        { header: 'TT', dataKey: 'stt' },
        { header: 'TEN HANG', dataKey: 'productName' },
        { header: 'SL', dataKey: 'quantity' },
        { header: 'DON GIA', dataKey: 'price' },
        { header: 'THANH TIEN', dataKey: 'total' }
    ];
    
    const tableData = [];
    
    // Thêm từng sản phẩm
    orderData.items.forEach((item, index) => {
        let fullProductName = sanitizeText(item.productName);
        if (item.color || item.size) {
            const details = [];
            if (item.color) details.push(`Mau: ${sanitizeText(item.color)}`);
            if (item.size) details.push(`Size: ${item.size}`);
            fullProductName += `\n${details.join(' - ')}`;
        }
        
        tableData.push({
            stt: index + 1,
            productName: fullProductName,
            quantity: item.quantity,
            price: formatCurrency(item.price),
            total: formatCurrency(item.price * item.quantity)
        });
    });
    
    // Dòng tổng cộng
    const totalAmount = orderData.totalPrice || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    tableData.push({
        stt: '',
        productName: 'Tong don',
        quantity: '',
        price: '',
        total: formatCurrency(totalAmount)
    });
    
    // Vẽ bảng
    autoTable(doc, {
        startY: yPos,
        head: [tableColumns.map(col => col.header)],
        body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
        theme: 'grid',
        styles: {
            font: 'times',
            fontSize: 10,
            cellPadding: 3,
            halign: 'center',
            valign: 'middle',
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold'
        },
        bodyStyles: {
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 80, halign: 'left' },
            2: { cellWidth: 25, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
        },
        didParseCell: function(data) {
            if (data.row.index === tableData.length - 1) {
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fillColor = [245, 245, 245];
            }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // ===== TỔNG TIỀN BẰNG CHỮ =====
    doc.setFont('times', 'italic');
    doc.text(`Thanh tien (viet bang chu): ............................`, margin, yPos);
    yPos += 15;
    
    // ===== CHỮ KÝ =====
    const dateStr = `Ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`;
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.text(dateStr, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;
    
    const signatureSpacing = (pageWidth - 2 * margin) / 2;
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.text('KHACH HANG', margin + signatureSpacing * 0.5, yPos, { align: 'center' });
    doc.text('NGUOI BAN HANG', margin + signatureSpacing * 1.5, yPos, { align: 'center' });
    
    // Lưu file
    const fileName = `HoaDon_${orderData.orderID}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 2B. HÓA ĐƠN BÁN HÀNG THEO NGÀY
 * Xuất tất cả đơn hàng trong 1 ngày theo format biểu mẫu
 */
export const generateDailyInvoicePDF = (dailyData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    
    // ===== HEADER =====
    let yPos = 20;
    
    // Logo/Tên công ty - ICONDENIM (in đậm, căn giữa, size lớn)
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ICONDENIM', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Địa chỉ (nhỏ hơn, bình thường)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const addressLine1 = 'Dia chi: Thu Duc, Thanh pho Ho Chi Minh';
    const addressLine2 = 'DT: 0123456789 - Email: contact@icondenim.com';
    doc.text(addressLine1, pageWidth / 2, yPos, { align: 'center' });
    yPos += 5;
    doc.text(addressLine2, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    // ===== TIÊU ĐỀ HÓA ĐƠN =====
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('HOA DON BAN HANG', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    
    // Ngày
    const invoiceDate = new Date(dailyData.date);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Ngay: ${invoiceDate.getDate()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 12;
    
    // ===== TỔNG HỢP TỪNG ĐƠN HÀNG =====
    let grandTotal = 0;
    let orderCount = 0;
    
    dailyData.orders.forEach((orderData, orderIndex) => {
        // Kiểm tra nếu cần trang mới
        if (yPos > pageHeight - 100) {
            doc.addPage();
            yPos = 20;
        }
        
        orderCount++;
        
        // ===== THÔNG TIN ĐƠN HÀNG =====
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Don hang #${orderData.orderID}`, margin, yPos);
        yPos += 7;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Khach hang: ${orderData.customerName || 'N/A'}`, margin, yPos);
        yPos += 5;
        doc.text(`Dia chi: ${orderData.customerAddress || 'N/A'}`, margin, yPos);
        yPos += 8;
        
        // ===== BẢNG SẢN PHẨM =====
        const tableColumns = [
            { header: 'TT', dataKey: 'stt' },
            { header: 'TEN HANG', dataKey: 'productName' },
            { header: 'SL', dataKey: 'quantity' },
            { header: 'DON GIA', dataKey: 'price' },
            { header: 'THANH TIEN', dataKey: 'total' }
        ];
        
        // Chuẩn bị dữ liệu bảng
        const tableData = [];
        
        // Thêm từng sản phẩm
        orderData.items.forEach((item, index) => {
            // Tên sản phẩm đầy đủ với màu và size
            let fullProductName = item.productName || 'N/A';
            if (item.color || item.size) {
                const details = [];
                if (item.color) details.push(`Mau: ${item.color}`);
                if (item.size) details.push(`Size: ${item.size}`);
                fullProductName += `\n${details.join(' - ')}`;
            }
            
            tableData.push({
                stt: index + 1,
                productName: fullProductName,
                quantity: item.quantity,
                price: formatCurrency(item.price),
                total: formatCurrency(item.price * item.quantity)
            });
        });
        
        // Tính tổng đơn hàng
        const orderTotal = orderData.totalPrice || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        grandTotal += orderTotal;
        
        // Thêm dòng tổng đơn
        tableData.push({
            stt: '',
            productName: 'Tong don',
            quantity: '',
            price: '',
            total: formatCurrency(orderTotal)
        });
        
        // Vẽ bảng
        autoTable(doc, {
            startY: yPos,
            head: [tableColumns.map(col => col.header)],
            body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 3,
                halign: 'center',
                valign: 'middle',
                lineWidth: 0.5,
                lineColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 15, halign: 'center' },      // TT
                1: { cellWidth: 80, halign: 'left' },         // TÊN HÀNG
                2: { cellWidth: 20, halign: 'center' },       // SL
                3: { cellWidth: 30, halign: 'right' },        // ĐƠN GIÁ
                4: { cellWidth: 35, halign: 'right' }         // THÀNH TIỀN
            },
            // Style cho dòng tổng
            didParseCell: function(data) {
                // Dòng cuối cùng (Tổng đơn) - in đậm
                if (data.row.index === tableData.length - 1) {
                    data.cell.styles.fontStyle = 'bold';
                    data.cell.styles.fillColor = [245, 245, 245];
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
        
        // Đường kẻ phân cách giữa các đơn (trừ đơn cuối)
        if (orderIndex < dailyData.orders.length - 1) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 10;
        }
    });
    
    // ===== TỔNG KẾT NGÀY =====
    // Kiểm tra nếu cần trang mới cho phần tổng kết
    if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
    }
    
    // Đường kẻ đậm trước tổng kết
    yPos += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    // Tiêu đề tổng kết
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TONG KET NGAY:', margin, yPos);
    yPos += 8;
    
    // Chi tiết tổng kết
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tong so don hang: ${orderCount}`, margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Tong doanh thu: ${formatCurrency(grandTotal)}`, margin, yPos);
    yPos += 15;
    
    // ===== CHỮ KÝ =====
    const today = new Date();
    const dateStr = `Ngay ${today.getDate()} thang ${today.getMonth() + 1} nam ${today.getFullYear()}`;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text(dateStr, pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;
    
    // Vị trí chữ ký
    const signatureY = Math.max(yPos, pageHeight - 40);
    const signatureSpacing = (pageWidth - 2 * margin) / 2;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Khách hàng
    doc.text('KHACH HANG', margin + signatureSpacing * 0.5, signatureY, { align: 'center' });
    
    // Người bán hàng
    doc.text('NGUOI BAN HANG', margin + signatureSpacing * 1.5, signatureY, { align: 'center' });
    
    // Lưu file
    const fileName = `HoaDon_Ngay_${invoiceDate.getDate()}-${invoiceDate.getMonth() + 1}-${invoiceDate.getFullYear()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 3. XÁC NHẬN ĐƠN HÀNG
 * Sử dụng trong Order Management khi xác nhận đơn
 */
export const generateOrderConfirmationPDF = (orderData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    // Header
    let yPos = addHeader(doc, 'XAC NHAN DON HANG', '02 - DH');
    
    // Thông tin đơn hàng
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    const pageWidth = doc.internal.pageSize.width;
    const orderDate = new Date(orderData.createdAt || new Date());
    const dateStr = `Ngay ${orderDate.getDate()} thang ${orderDate.getMonth() + 1} nam ${orderDate.getFullYear()}`;
    doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.text(`Ma don hang: ${orderData.orderID || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`Ten khach hang: ${orderData.customerName || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`Dia chi: ${orderData.customerAddress || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`So dien thoai: ${orderData.customerPhone || '............................'}`, 15, yPos);
    yPos += 10;
    
    // Bảng sản phẩm
    const tableColumns = [
        { header: 'STT', dataKey: 'stt' },
        { header: 'TEN SAN PHAM', dataKey: 'productName' },
        { header: 'MAU SAC', dataKey: 'color' },
        { header: 'KICH CO', dataKey: 'size' },
        { header: 'SO LUONG', dataKey: 'quantity' },
        { header: 'DON GIA', dataKey: 'price' },
        { header: 'THANH TIEN', dataKey: 'total' }
    ];
    
    const tableData = orderData.items.map((item, index) => ({
        stt: index + 1,
        productName: item.productName,
        color: item.color || '-',
        size: item.size || '-',
        quantity: item.quantity,
        price: formatCurrency(item.price),
        total: formatCurrency(item.price * item.quantity)
    }));
    
    // Dòng tổng cộng
    const totalAmount = orderData.totalPrice || orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    tableData.push({
        stt: '',
        productName: 'TONG CONG',
        color: '',
        size: '',
        quantity: '',
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
            fontSize: 9,
            cellPadding: 2,
            halign: 'center',
            valign: 'middle'
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        bodyStyles: {
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 60, halign: 'left' },
            2: { cellWidth: 20 },
            3: { cellWidth: 20 },
            4: { cellWidth: 20 },
            5: { cellWidth: 28 },
            6: { cellWidth: 30 }
        }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Ghi chú
    doc.setFont('helvetica', 'italic');
    doc.text(`Ghi chu: ${orderData.notes || 'Khong co'}`, 15, yPos);
    yPos += 7;
    doc.text(`Phuong thuc thanh toan: ${orderData.paymentMethod || 'Chua xac dinh'}`, 15, yPos);
    yPos += 10;
    
    // Footer chữ ký
    addFooter(doc, yPos, [
        { title: 'KHACH HANG', subtitle: '(Xac nhan)' },
        { title: 'NHAN VIEN BAN HANG', subtitle: '' },
        { title: 'NGUOI DUYET', subtitle: '' }
    ]);
    
    // Lưu file với dialog chọn nơi lưu
    const fileName = `XacNhanDonHang_${orderData.orderID || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};

/**
 * 4. BIỂU MẪU PHẢN HỒI KHÁCH HÀNG
 * Sử dụng trong Review Management
 */
export const generateCustomerFeedbackPDF = (feedbackData) => {
    const doc = new jsPDF();
    setupVietnameseFont(doc);
    
    // Header
    let yPos = addHeader(doc, 'PHIEU PHAN HOI KHACH HANG', '03 - PH');
    
    // Thông tin phản hồi
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    yPos += 10;
    
    const pageWidth = doc.internal.pageSize.width;
    const feedbackDate = new Date(feedbackData.createdAt || new Date());
    const dateStr = `Ngay ${feedbackDate.getDate()} thang ${feedbackDate.getMonth() + 1} nam ${feedbackDate.getFullYear()}`;
    doc.text(dateStr, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    
    doc.text(`Ma phan hoi: ${feedbackData.reviewID || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`Ten khach hang: ${feedbackData.customerName || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`San pham: ${feedbackData.productName || '............................'}`, 15, yPos);
    yPos += 7;
    doc.text(`Danh gia: ${feedbackData.rating || '....'} / 5 sao`, 15, yPos);
    yPos += 10;
    
    // Nội dung phản hồi
    doc.setFont('helvetica', 'bold');
    doc.text('NOI DUNG PHAN HOI:', 15, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const feedbackText = feedbackData.comment || 'Khong co noi dung';
    const splitText = doc.splitTextToSize(feedbackText, pageWidth - 30);
    doc.text(splitText, 15, yPos);
    yPos += splitText.length * 7 + 10;
    
    // Bảng sản phẩm đã mua (nếu có)
    if (feedbackData.items && feedbackData.items.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('SAN PHAM LIEN QUAN:', 15, yPos);
        yPos += 7;
        
        const tableColumns = [
            { header: 'STT', dataKey: 'stt' },
            { header: 'TEN SAN PHAM', dataKey: 'productName' },
            { header: 'SO LUONG', dataKey: 'quantity' },
            { header: 'GIA', dataKey: 'price' }
        ];
        
        const tableData = feedbackData.items.map((item, index) => ({
            stt: index + 1,
            productName: item.productName,
            quantity: item.quantity,
            price: formatCurrency(item.price)
        }));
        
        autoTable(doc, {
            startY: yPos,
            head: [tableColumns.map(col => col.header)],
            body: tableData.map(row => tableColumns.map(col => row[col.dataKey])),
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 9,
                cellPadding: 3,
                halign: 'center',
                valign: 'middle'
            },
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineWidth: 0.5,
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                lineWidth: 0.5,
                lineColor: [0, 0, 0]
            },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 90, halign: 'left' },
                2: { cellWidth: 30 },
                3: { cellWidth: 40 }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 10;
    }
    
    // Phần xử lý
    doc.setFont('helvetica', 'bold');
    doc.text('PHAN XU LY:', 15, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    const responseText = feedbackData.response || '............................................................................................';
    const splitResponse = doc.splitTextToSize(responseText, pageWidth - 30);
    doc.text(splitResponse, 15, yPos);
    yPos += splitResponse.length * 7 + 10;
    
    // Footer chữ ký
    addFooter(doc, yPos, [
        { title: 'NGUOI TIEP NHAN', subtitle: '' },
        { title: 'NGUOI XU LY', subtitle: '' },
        { title: 'QUAN LY', subtitle: '' }
    ]);
    
    // Lưu file với dialog chọn nơi lưu
    const fileName = `PhanHoiKhachHang_${feedbackData.reviewID || Date.now()}.pdf`;
    doc.save(fileName);
    
    return fileName;
};
