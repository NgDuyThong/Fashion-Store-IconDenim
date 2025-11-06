const { exec } = require('child_process');
const path = require('path');
const util = require('util');
const fs = require('fs').promises;
const execPromise = util.promisify(exec);

// Hàm chạy toàn bộ quy trình CoIUM
const runCoIUMProcess = async (req, res) => {
    try {
        const serverPath = path.join(__dirname, '..');
        const projectRoot = path.join(serverPath, '..');
        const coiumPath = path.join(projectRoot, 'CoIUM_Final');
        
        console.log('Bắt đầu quy trình CoIUM...');
        console.log('Server path:', serverPath);
        console.log('Project root:', projectRoot);
        console.log('CoIUM path:', coiumPath);
        
        // Bước 1: Export orders từ MongoDB
        console.log('Bước 1/4: Export orders từ MongoDB...');
        const exportCmd = `node "${path.join(serverPath, 'CoIUM', 'export-orders-for-coium.js')}"`;
        const { stdout: exportOutput, stderr: exportError } = await execPromise(exportCmd, {
            cwd: serverPath,
            maxBuffer: 10 * 1024 * 1024 // 10MB buffer
        });
        
        if (exportError) {
            console.error('Export stderr:', exportError);
        }
        console.log('Export output:', exportOutput);
        
        // Bước 2: Chạy CoIUM algorithm
        console.log('Bước 2/4: Chạy CoIUM algorithm...');
        const pythonCmd = `python run_fashion_store.py`;
        const { stdout: pythonOutput, stderr: pythonError } = await execPromise(pythonCmd, {
            cwd: coiumPath,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            timeout: 300000 // 5 minutes timeout
        });
        
        if (pythonError && !pythonError.includes('WARNING')) {
            console.error('Python stderr:', pythonError);
        }
        console.log('Python output:', pythonOutput);
        
        // Bước 3: Phân tích correlation
        console.log('Bước 3/4: Phân tích correlation...');
        const analyzeCmd = `python analyze_correlation_results.py`;
        const { stdout: analyzeOutput, stderr: analyzeError } = await execPromise(analyzeCmd, {
            cwd: coiumPath,
            maxBuffer: 10 * 1024 * 1024
        });
        
        if (analyzeError && !analyzeError.includes('WARNING')) {
            console.error('Analyze stderr:', analyzeError);
        }
        console.log('Analyze output:', analyzeOutput);
        
        // Bước 4: Generate correlation map
        console.log('Bước 4/4: Generate correlation map...');
        const generateCmd = `node "${path.join(serverPath, 'CoIUM', 'generate-correlation-map.js')}"`;
        const { stdout: generateOutput, stderr: generateError } = await execPromise(generateCmd, {
            cwd: serverPath,
            maxBuffer: 10 * 1024 * 1024
        });
        
        if (generateError) {
            console.error('Generate stderr:', generateError);
        }
        console.log('Generate output:', generateOutput);
        
        // Đọc file correlation_map.json để lấy số lượng sản phẩm
        const correlationMapPath = path.join(serverPath, 'CoIUM', 'correlation_map.json');
        let totalProducts = 0;
        let totalRecommendations = 0;
        
        try {
            const correlationMapData = await fs.readFile(correlationMapPath, 'utf8');
            const correlationMap = JSON.parse(correlationMapData);
            totalProducts = Object.keys(correlationMap).length;
            
            // Đếm tổng số recommendations
            Object.values(correlationMap).forEach(recommendations => {
                totalRecommendations += recommendations.length;
            });
        } catch (error) {
            console.error('Lỗi khi đọc correlation_map.json:', error.message);
        }
        
        console.log('Hoàn thành quy trình CoIUM!');
        console.log(`Tổng số sản phẩm: ${totalProducts}`);
        console.log(`Tổng số recommendations: ${totalRecommendations}`);
        
        res.json({
            success: true,
            message: 'Chạy CoIUM thành công!',
            data: {
                totalProducts,
                totalRecommendations,
                avgRecommendationsPerProduct: totalProducts > 0 ? (totalRecommendations / totalProducts).toFixed(2) : 0,
                steps: [
                    { step: 1, name: 'Export orders', status: 'completed' },
                    { step: 2, name: 'Run CoIUM', status: 'completed' },
                    { step: 3, name: 'Analyze correlation', status: 'completed' },
                    { step: 4, name: 'Generate correlation map', status: 'completed' }
                ]
            }
        });
        
    } catch (error) {
        console.error('Lỗi khi chạy CoIUM:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi chạy CoIUM',
            error: error.message,
            stderr: error.stderr,
            stdout: error.stdout
        });
    }
};

module.exports = {
    runCoIUMProcess
};
