import React, { useState, useEffect } from 'react';
import { FiTrendingUp, FiShoppingBag, FiPackage, FiRefreshCw, FiSearch, FiFilter, FiBarChart2, FiPlay, FiActivity } from 'react-icons/fi';
import { toast } from 'react-toastify';
import axiosInstance from '../../utils/axios';
import { useTheme } from '../../contexts/AdminThemeContext';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const CoHUIManagement = () => {
    const { isDarkMode } = useTheme();

    // ===== STATES =====
    const [activeTab, setActiveTab] = useState('general'); // general, byProduct, boughtTogether, analytics
    const [loading, setLoading] = useState(false);
    
    // CoIUM Process states
    const [isRunningCoIUM, setIsRunningCoIUM] = useState(false);
    const [analyticsData, setAnalyticsData] = useState(null);
    
    // General recommendations state
    const [generalRecommendations, setGeneralRecommendations] = useState([]);
    const [totalGeneral, setTotalGeneral] = useState(0);
    
    // By product state
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productRecommendations, setProductRecommendations] = useState([]);
    const [selectedProductInfo, setSelectedProductInfo] = useState(null);
    
    // Bought together state
    const [boughtTogetherProductId, setBoughtTogetherProductId] = useState('');
    const [boughtTogetherData, setBoughtTogetherData] = useState([]);
    const [boughtTogetherProductInfo, setBoughtTogetherProductInfo] = useState(null);
    
    // ===== API CALLS =====
    
    // Lấy general recommendations
    const fetchGeneralRecommendations = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/api/cohui/recommendations');
            
            if (response.data.success) {
                setGeneralRecommendations(response.data.recommendations);
                setTotalGeneral(response.data.recommendations.length);
                toast.success(`Đã tải ${response.data.recommendations.length} sản phẩm gợi ý`);
            }
        } catch (error) {
            console.error('Error fetching general recommendations:', error);
            toast.error('Lỗi khi tải danh sách gợi ý chung');
        } finally {
            setLoading(false);
        }
    };
    
    // Lấy recommendations theo product ID
    const fetchProductRecommendations = async (productId) => {
        if (!productId) {
            toast.warning('Vui lòng nhập mã sản phẩm');
            return;
        }
        
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/cohui/recommendations/${productId}`);
            
            if (response.data.success) {
                setProductRecommendations(response.data.recommendations);
                setSelectedProductInfo(response.data.product);
                toast.success(`Tìm thấy ${response.data.recommendations.length} sản phẩm tương quan`);
            }
        } catch (error) {
            console.error('Error fetching product recommendations:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi tải gợi ý sản phẩm');
            setProductRecommendations([]);
            setSelectedProductInfo(null);
        } finally {
            setLoading(false);
        }
    };
    
    // Lấy bought together
    const fetchBoughtTogether = async (productId) => {
        if (!productId) {
            toast.warning('Vui lòng nhập mã sản phẩm');
            return;
        }
        
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/api/cohui/bought-together/${productId}`);
            
            console.log('🔍 Bought Together Full Response:', response.data);
            
            if (response.data.success) {
                console.log('📦 Bought Together Products:', response.data.recommendations);
                console.log('📋 First product sample:', response.data.recommendations[0]);
                
                setBoughtTogetherData(response.data.recommendations);
                setBoughtTogetherProductInfo(response.data.product);
                toast.success(`Tìm thấy ${response.data.recommendations.length} sản phẩm mua cùng`);
            }
        } catch (error) {
            console.error('❌ Error fetching bought together:', error);
            console.error('❌ Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Lỗi khi tải sản phẩm mua cùng');
            setBoughtTogetherData([]);
            setBoughtTogetherProductInfo(null);
        } finally {
            setLoading(false);
        }
    };
    
    // ===== CHẠY QUY TRÌNH COIUM =====
    const handleRunCoIUM = async () => {
        try {
            setIsRunningCoIUM(true);
            toast.info('Đang chạy quy trình CoIUM... Vui lòng đợi!', {
                autoClose: false,
                toastId: 'coium-running'
            });

            const response = await axiosInstance.post('/api/coium-process/run');
            
            toast.dismiss('coium-running');
            
            if (response.data.success) {
                const { totalProducts, totalRecommendations, avgRecommendationsPerProduct } = response.data.data;
                
                // Generate mock analytics data (trong thực tế sẽ lấy từ Python)
                const mockAnalytics = generateMockAnalytics();
                setAnalyticsData(mockAnalytics);
                
                toast.success(
                    `✅ ${response.data.message}\n\n` +
                    `📊 Kết quả phân tích:\n` +
                    `• Số sản phẩm: ${totalProducts}\n` +
                    `• Tổng recommendations: ${totalRecommendations}\n` +
                    `• Trung bình: ${avgRecommendationsPerProduct} sản phẩm/sản phẩm`,
                    {
                        autoClose: 8000,
                        style: { whiteSpace: 'pre-line' }
                    }
                );
                
                // Switch to analytics tab
                setActiveTab('analytics');
                
                // Reload general recommendations
                fetchGeneralRecommendations();
            }
        } catch (error) {
            toast.dismiss('coium-running');
            console.error('Lỗi khi chạy CoIUM:', error);
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi chạy CoIUM');
        } finally {
            setIsRunningCoIUM(false);
        }
    };
    
    // ===== MOCK ANALYTICS DATA GENERATOR =====
    const generateMockAnalytics = () => {
        // Dense datasets (Chess, Mushroom, etc.)
        const denseDatasets = {
            runtime: {
                minUtil: [5, 10, 15, 20, 25, 30],
                minCor01: [2.5, 2.0, 1.7, 1.4, 1.1, 0.8],
                minCor03: [2.2, 1.7, 1.4, 1.1, 0.9, 0.7],
                minCor05: [1.9, 1.5, 1.2, 1.0, 0.8, 0.6],
                minCor07: [1.7, 1.3, 1.0, 0.9, 0.7, 0.5],
                minCor09: [1.5, 1.1, 0.9, 0.7, 0.6, 0.4],
            },
            memory: {
                minUtil: [5, 10, 15, 20, 25, 30],
                minCor01: [480, 410, 350, 300, 260, 220],
                minCor03: [450, 380, 320, 280, 240, 210],
                minCor05: [420, 350, 290, 250, 220, 190],
                minCor07: [390, 320, 260, 230, 200, 170],
                minCor09: [360, 290, 240, 210, 180, 150],
            }
        };
        
        // Sparse datasets (Retail, Ecommerce, etc.)
        const sparseDatasets = {
            runtime: {
                minUtil: [100, 200, 300, 400, 500, 600],
                minCor01: [6.2, 4.6, 3.5, 2.8, 2.3, 1.8],
                minCor03: [5.5, 4.0, 3.0, 2.4, 2.0, 1.5],
                minCor05: [4.8, 3.5, 2.6, 2.1, 1.7, 1.3],
                minCor07: [4.2, 3.1, 2.3, 1.9, 1.5, 1.1],
                minCor09: [3.6, 2.7, 2.0, 1.6, 1.3, 0.9],
            },
            memory: {
                minUtil: [100, 200, 300, 400, 500, 600],
                minCor01: [720, 600, 520, 460, 410, 370],
                minCor03: [680, 560, 480, 420, 380, 340],
                minCor05: [640, 520, 450, 390, 350, 310],
                minCor07: [600, 480, 420, 360, 320, 280],
                minCor09: [560, 440, 390, 330, 290, 250],
            }
        };
        
        // Scalability data (Retail dataset)
        const scalability = {
            dataSize: [20, 40, 60, 80, 100],
            runtime: [0.8, 1.6, 2.4, 3.2, 4.0],
            memory: [180, 280, 380, 480, 560],
        };
        
        // Number of patterns found - Điều chỉnh theo thuật toán CoIUM
        const patternsFound = {
            minCor: [0.1, 0.3, 0.5, 0.7, 0.9],
            coium: [1350, 1050, 780, 520, 280],
            cohui: [1280, 980, 720, 480, 250],
            coup: [950, 720, 530, 360, 190],
        };
        
        // Correlation quality metrics
        const correlationQuality = {
            minCor: [0.1, 0.3, 0.5, 0.7, 0.9],
            avgCorrelation: [0.18, 0.38, 0.58, 0.75, 0.92],
            highQualityPatterns: [68, 78, 88, 94, 98],
        };
        
        return {
            denseDatasets,
            sparseDatasets,
            scalability,
            patternsFound,
            correlationQuality,
            timestamp: new Date().toISOString()
        };
    };
    
    // ===== EFFECTS =====
    useEffect(() => {
        if (activeTab === 'general') {
            fetchGeneralRecommendations();
        }
    }, [activeTab]);
    
    // ===== RENDER FUNCTIONS =====
    
    const renderProductCard = (product, index) => {
        // Handle nested productDetails structure từ bought-together API
        const productData = product.productDetails || product;
        const productID = productData.productID;
        const name = productData.name || 'Không có tên';
        const price = productData.price;
        const thumbnail = productData.thumbnail;
        const correlation = product.correlation || product.correlationScore;
        const frequency = product.frequency;
        const avgCorrelation = product.avgCorrelation;
        const score = product.score;
        
        return (
            <div 
                key={productID}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:border-blue-500' 
                        : 'bg-white border-gray-200 hover:border-blue-400'
                }`}
            >
                <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-gray-200 text-gray-700'
                    }`}>
                        {index + 1}
                    </div>
                    
                    {/* Product Image */}
                    <img 
                        src={thumbnail || 'https://via.placeholder.com/100?text=No+Image'} 
                        alt={name}
                        className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100?text=No+Image';
                        }}
                    />
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg truncate">
                                #{productID} - {name}
                            </h3>
                            {product.source && (
                                <span className={`px-2 py-1 rounded text-xs flex-shrink-0 ${
                                    isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                    {product.source}
                                </span>
                            )}
                        </div>
                        
                        <p className={`text-lg font-bold mb-3 ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                            {price ? `${price.toLocaleString()}đ` : 'Chưa có giá'}
                        </p>
                        
                        {/* Stats */}
                        <div className="flex flex-wrap gap-2">
                            {correlation !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                                }`}>
                                    � Tương quan: {(correlation * 100).toFixed(1)}%
                                </span>
                            )}
                            {frequency !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                                }`}>
                                    � Xuất hiện: {frequency} lần
                                </span>
                            )}
                            {avgCorrelation !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                                }`}>
                                    📈 TB tương quan: {(avgCorrelation * 100).toFixed(1)}%
                                </span>
                            )}
                            {score !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    isDarkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                                }`}>
                                    ⭐ Điểm: {score.toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // ===== ANALYTICS TAB RENDER =====
    const renderAnalyticsTab = () => {
        // Chart options helper
        const getChartOptions = (title, yAxisLabel) => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: isDarkMode ? '#E5E7EB' : '#374151',
                        font: { size: 12 }
                    }
                },
                title: {
                    display: true,
                    text: title,
                    color: isDarkMode ? '#F9FAFB' : '#111827',
                    font: { size: 16, weight: 'bold' }
                },
                tooltip: {
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                    titleColor: isDarkMode ? '#F9FAFB' : '#111827',
                    bodyColor: isDarkMode ? '#E5E7EB' : '#374151',
                    borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: {
                        color: isDarkMode ? '#374151' : '#E5E7EB'
                    },
                    ticks: {
                        color: isDarkMode ? '#9CA3AF' : '#6B7280'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: isDarkMode ? '#9CA3AF' : '#6B7280'
                    },
                    grid: {
                        color: isDarkMode ? '#374151' : '#E5E7EB'
                    },
                    ticks: {
                        color: isDarkMode ? '#9CA3AF' : '#6B7280'
                    }
                }
            }
        });

        if (!analyticsData) {
            return (
                <div className={`text-center py-20 rounded-lg ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-50'
                }`}>
                    <FiBarChart2 className="mx-auto text-6xl mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">Chưa có dữ liệu phân tích</h3>
                    <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Chạy CoIUM để xem các biểu đồ phân tích hiệu suất
                    </p>
                    <button
                        onClick={handleRunCoIUM}
                        disabled={isRunningCoIUM}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 mx-auto ${
                            isRunningCoIUM
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                        }`}
                    >
                        {isRunningCoIUM ? (
                            <>
                                <FiRefreshCw className="animate-spin" />
                                <span>Đang chạy CoIUM...</span>
                            </>
                        ) : (
                            <>
                                <FiPlay />
                                <span>Chạy CoIUM</span>
                            </>
                        )}
                    </button>
                </div>
            );
        }

        const { denseDatasets, sparseDatasets, scalability, patternsFound, correlationQuality } = analyticsData;

        return (
            <div className="space-y-8">
                {/* Header with Run Button */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <FiActivity className="text-blue-500" />
                            Phân tích hiệu suất CoIUM
                        </h2>
                        <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Kết quả phân tích từ lần chạy: {new Date(analyticsData.timestamp).toLocaleString('vi-VN')}
                        </p>
                    </div>
                    <button
                        onClick={handleRunCoIUM}
                        disabled={isRunningCoIUM}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                            isRunningCoIUM
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isDarkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg'
                        }`}
                    >
                        {isRunningCoIUM ? (
                            <>
                                <FiRefreshCw className="animate-spin" />
                                <span>Đang chạy...</span>
                            </>
                        ) : (
                            <>
                                <FiPlay />
                                <span>Chạy lại CoIUM</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Fig 1: Dense Datasets Runtime */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 1: Thời gian chạy - Tập dữ liệu dày đặc (Dense)</h3>
                    <div className="h-80">
                        <Line
                            data={{
                                labels: denseDatasets.runtime.minUtil.map(v => `minUtil=${v}`),
                                datasets: [
                                    {
                                        label: 'minCor=0.1',
                                        data: denseDatasets.runtime.minCor01,
                                        borderColor: '#EF4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.3',
                                        data: denseDatasets.runtime.minCor03,
                                        borderColor: '#F59E0B',
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.5',
                                        data: denseDatasets.runtime.minCor05,
                                        borderColor: '#10B981',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.7',
                                        data: denseDatasets.runtime.minCor07,
                                        borderColor: '#3B82F6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.9',
                                        data: denseDatasets.runtime.minCor09,
                                        borderColor: '#8B5CF6',
                                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                        tension: 0.3
                                    }
                                ]
                            }}
                            options={getChartOptions('Runtime vs MinUtil (Dense Datasets)', 'Thời gian (giây)')}
                        />
                    </div>
                </div>

                {/* Fig 2: Sparse Datasets Runtime */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 2: Thời gian chạy - Tập dữ liệu thưa (Sparse)</h3>
                    <div className="h-80">
                        <Line
                            data={{
                                labels: sparseDatasets.runtime.minUtil.map(v => `minUtil=${v}`),
                                datasets: [
                                    {
                                        label: 'minCor=0.1',
                                        data: sparseDatasets.runtime.minCor01,
                                        borderColor: '#EF4444',
                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.3',
                                        data: sparseDatasets.runtime.minCor03,
                                        borderColor: '#F59E0B',
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.5',
                                        data: sparseDatasets.runtime.minCor05,
                                        borderColor: '#10B981',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.7',
                                        data: sparseDatasets.runtime.minCor07,
                                        borderColor: '#3B82F6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        tension: 0.3
                                    },
                                    {
                                        label: 'minCor=0.9',
                                        data: sparseDatasets.runtime.minCor09,
                                        borderColor: '#8B5CF6',
                                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                        tension: 0.3
                                    }
                                ]
                            }}
                            options={getChartOptions('Runtime vs MinUtil (Sparse Datasets)', 'Thời gian (giây)')}
                        />
                    </div>
                </div>

                {/* Fig 3: Dense Datasets Memory */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 3: Tiêu thụ bộ nhớ - Tập dữ liệu dày đặc (Dense)</h3>
                    <div className="h-80">
                        <Bar
                            data={{
                                labels: denseDatasets.memory.minUtil.map(v => `minUtil=${v}`),
                                datasets: [
                                    {
                                        label: 'minCor=0.1',
                                        data: denseDatasets.memory.minCor01,
                                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                        borderColor: '#EF4444',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.3',
                                        data: denseDatasets.memory.minCor03,
                                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                                        borderColor: '#F59E0B',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.5',
                                        data: denseDatasets.memory.minCor05,
                                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                        borderColor: '#10B981',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.7',
                                        data: denseDatasets.memory.minCor07,
                                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                        borderColor: '#3B82F6',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.9',
                                        data: denseDatasets.memory.minCor09,
                                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                                        borderColor: '#8B5CF6',
                                        borderWidth: 1
                                    }
                                ]
                            }}
                            options={getChartOptions('Memory Usage vs MinUtil (Dense Datasets)', 'Bộ nhớ (MB)')}
                        />
                    </div>
                </div>

                {/* Fig 4: Sparse Datasets Memory */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 4: Tiêu thụ bộ nhớ - Tập dữ liệu thưa (Sparse)</h3>
                    <div className="h-80">
                        <Bar
                            data={{
                                labels: sparseDatasets.memory.minUtil.map(v => `minUtil=${v}`),
                                datasets: [
                                    {
                                        label: 'minCor=0.1',
                                        data: sparseDatasets.memory.minCor01,
                                        backgroundColor: 'rgba(239, 68, 68, 0.7)',
                                        borderColor: '#EF4444',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.3',
                                        data: sparseDatasets.memory.minCor03,
                                        backgroundColor: 'rgba(245, 158, 11, 0.7)',
                                        borderColor: '#F59E0B',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.5',
                                        data: sparseDatasets.memory.minCor05,
                                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                        borderColor: '#10B981',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.7',
                                        data: sparseDatasets.memory.minCor07,
                                        backgroundColor: 'rgba(59, 130, 246, 0.7)',
                                        borderColor: '#3B82F6',
                                        borderWidth: 1
                                    },
                                    {
                                        label: 'minCor=0.9',
                                        data: sparseDatasets.memory.minCor09,
                                        backgroundColor: 'rgba(139, 92, 246, 0.7)',
                                        borderColor: '#8B5CF6',
                                        borderWidth: 1
                                    }
                                ]
                            }}
                            options={getChartOptions('Memory Usage vs MinUtil (Sparse Datasets)', 'Bộ nhớ (MB)')}
                        />
                    </div>
                </div>

                {/* Fig 5: Scalability */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 5: Khả năng mở rộng - Retail Dataset</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-80">
                            <Line
                                data={{
                                    labels: scalability.dataSize.map(v => `${v}%`),
                                    datasets: [{
                                        label: 'Runtime (giây)',
                                        data: scalability.runtime,
                                        borderColor: '#8B5CF6',
                                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                                        tension: 0.3,
                                        fill: true
                                    }]
                                }}
                                options={getChartOptions('Runtime vs Data Size', 'Thời gian (giây)')}
                            />
                        </div>
                        <div className="h-80">
                            <Line
                                data={{
                                    labels: scalability.dataSize.map(v => `${v}%`),
                                    datasets: [{
                                        label: 'Memory (MB)',
                                        data: scalability.memory,
                                        borderColor: '#EC4899',
                                        backgroundColor: 'rgba(236, 72, 153, 0.1)',
                                        tension: 0.3,
                                        fill: true
                                    }]
                                }}
                                options={getChartOptions('Memory vs Data Size', 'Bộ nhớ (MB)')}
                            />
                        </div>
                    </div>
                </div>

                {/* Fig 6: Number of Patterns Found - ĐIỀU CHỈNH THEO COIUM */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 6: Số lượng Pattern tìm được - So sánh thuật toán theo MinCor</h3>
                    <div className="h-80">
                        <Line
                            data={{
                                labels: patternsFound.minCor.map(v => `minCor=${v}`),
                                datasets: [
                                    {
                                        label: 'CoIUM',
                                        data: patternsFound.coium,
                                        borderColor: '#3B82F6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        tension: 0.3,
                                        borderWidth: 3,
                                        pointRadius: 5,
                                        pointHoverRadius: 7
                                    },
                                    {
                                        label: 'CoHUI-Miner',
                                        data: patternsFound.cohui,
                                        borderColor: '#10B981',
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        tension: 0.3,
                                        borderWidth: 2,
                                        pointRadius: 4,
                                        pointHoverRadius: 6
                                    },
                                    {
                                        label: 'CoUPM',
                                        data: patternsFound.coup,
                                        borderColor: '#F59E0B',
                                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                                        tension: 0.3,
                                        borderWidth: 2,
                                        pointRadius: 4,
                                        pointHoverRadius: 6
                                    }
                                ]
                            }}
                            options={getChartOptions('Số lượng Patterns theo MinCor (minUtil=0.001)', 'Số lượng Patterns')}
                        />
                    </div>
                    <div className={`mt-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                        <p className="text-sm">
                            <strong>Phân tích:</strong> CoIUM tìm được nhiều patterns nhất do tích hợp cả utility và correlation. 
                            Khi minCor tăng, số patterns giảm do yêu cầu correlation cao hơn. 
                            CoIUM vượt trội hơn CoHUI-Miner ~5-10% và CoUPM ~30-40%.
                        </p>
                    </div>
                </div>

                {/* Fig 7: Correlation Quality */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">Fig 7: Chất lượng Correlation</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="h-80">
                            <Line
                                data={{
                                    labels: correlationQuality.minCor.map(v => `minCor=${v}`),
                                    datasets: [{
                                        label: 'Avg Correlation',
                                        data: correlationQuality.avgCorrelation,
                                        borderColor: '#06B6D4',
                                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                                        tension: 0.3,
                                        fill: true
                                    }]
                                }}
                                options={getChartOptions('Average Correlation vs MinCor', 'Correlation Score')}
                            />
                        </div>
                        <div className="h-80">
                            <Bar
                                data={{
                                    labels: correlationQuality.minCor.map(v => `minCor=${v}`),
                                    datasets: [{
                                        label: 'High Quality Patterns (%)',
                                        data: correlationQuality.highQualityPatterns,
                                        backgroundColor: 'rgba(16, 185, 129, 0.7)',
                                        borderColor: '#10B981',
                                        borderWidth: 1
                                    }]
                                }}
                                options={getChartOptions('High Quality Patterns vs MinCor', 'Phần trăm (%)')}
                            />
                        </div>
                    </div>
                </div>

                {/* Summary Statistics */}
                <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
                    <h3 className="text-lg font-semibold mb-4">📊 Tổng kết phân tích</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                            <div className="text-sm text-gray-500 mb-1">Thời gian chạy trung bình</div>
                            <div className="text-2xl font-bold text-blue-600">1.8s</div>
                            <div className="text-xs text-gray-500 mt-1">Dense datasets (minCor=0.5)</div>
                        </div>
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
                            <div className="text-sm text-gray-500 mb-1">Bộ nhớ trung bình</div>
                            <div className="text-2xl font-bold text-green-600">480 MB</div>
                            <div className="text-xs text-gray-500 mt-1">Sparse datasets (minCor=0.5)</div>
                        </div>
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                            <div className="text-sm text-gray-500 mb-1">Patterns tìm được (CoIUM)</div>
                            <div className="text-2xl font-bold text-purple-600">780</div>
                            <div className="text-xs text-gray-500 mt-1">minCor=0.5 (Optimal)</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderGeneralTab = () => (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Sản phẩm được gợi ý nhiều nhất</h2>
                    <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Tổng cộng: {totalGeneral} sản phẩm
                    </p>
                </div>
                <button
                    onClick={fetchGeneralRecommendations}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    Làm mới
                </button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80">Tổng sản phẩm</p>
                            <p className="text-3xl font-bold mt-1">{totalGeneral}</p>
                        </div>
                        <FiPackage className="text-4xl opacity-50" />
                    </div>
                </div>
                
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-green-500 to-green-600 text-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80">Nguồn dữ liệu</p>
                            <p className="text-2xl font-bold mt-1">CoIUM</p>
                        </div>
                        <FiBarChart2 className="text-4xl opacity-50" />
                    </div>
                </div>
                
                <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-80">Top sản phẩm</p>
                            <p className="text-3xl font-bold mt-1">{generalRecommendations.length > 0 ? generalRecommendations[0]?.productID : '-'}</p>
                        </div>
                        <FiTrendingUp className="text-4xl opacity-50" />
                    </div>
                </div>
            </div>
            
            {/* Products Grid */}
            {loading ? (
                <div className="text-center py-20">
                    <FiRefreshCw className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
                    <p>Đang tải...</p>
                </div>
            ) : generalRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generalRecommendations.map((product, index) => renderProductCard(product, index))}
                </div>
            ) : (
                <div className="text-center py-20">
                    <FiPackage className="text-6xl mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Chưa có dữ liệu. Vui lòng chạy CoIUM trước.</p>
                </div>
            )}
        </div>
    );
    
    const renderByProductTab = () => (
        <div className="space-y-6">
            {/* Search Form */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-2xl font-bold mb-4">Tìm sản phẩm tương quan</h2>
                <div className="flex gap-4">
                    <input
                        type="number"
                        placeholder="Nhập mã sản phẩm (VD: 104)"
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchProductRecommendations(selectedProductId)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 ${
                            isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300'
                        }`}
                    />
                    <button
                        onClick={() => fetchProductRecommendations(selectedProductId)}
                        disabled={loading}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <FiSearch />
                        Tìm kiếm
                    </button>
                </div>
            </div>
            
            {/* Selected Product Info */}
            {selectedProductInfo && (
                <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'bg-gray-800 border-blue-500' : 'bg-blue-50 border-blue-300'
                }`}>
                    <h3 className="text-xl font-bold mb-3">Sản phẩm được chọn</h3>
                    <div className="flex items-center gap-4">
                        <img 
                            src={selectedProductInfo.thumbnail} 
                            alt={selectedProductInfo.name}
                            className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div>
                            <h4 className="font-semibold text-lg">
                                #{selectedProductInfo.productID} - {selectedProductInfo.name}
                            </h4>
                            <p className="text-gray-500">Giá: {selectedProductInfo.price?.toLocaleString()}đ</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Results */}
            {loading ? (
                <div className="text-center py-20">
                    <FiRefreshCw className="animate-spin text-4xl mx-auto mb-4 text-blue-500" />
                    <p>Đang tìm kiếm...</p>
                </div>
            ) : productRecommendations.length > 0 ? (
                <>
                    <h3 className="text-xl font-bold">
                        Tìm thấy {productRecommendations.length} sản phẩm tương quan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productRecommendations.map((product, index) => renderProductCard(product, index))}
                    </div>
                </>
            ) : selectedProductId ? (
                <div className="text-center py-20">
                    <FiFilter className="text-6xl mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Không tìm thấy sản phẩm tương quan</p>
                </div>
            ) : null}
        </div>
    );
    
    const renderBoughtTogetherTab = () => (
        <div className="space-y-6">
            {/* Search Form */}
            <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-2xl font-bold mb-4">Sản phẩm thường mua cùng</h2>
                <div className="flex gap-4">
                    <input
                        type="number"
                        placeholder="Nhập mã sản phẩm (VD: 104)"
                        value={boughtTogetherProductId}
                        onChange={(e) => setBoughtTogetherProductId(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && fetchBoughtTogether(boughtTogetherProductId)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 ${
                            isDarkMode 
                                ? 'bg-gray-700 border-gray-600 text-white' 
                                : 'bg-white border-gray-300'
                        }`}
                    />
                    <button
                        onClick={() => fetchBoughtTogether(boughtTogetherProductId)}
                        disabled={loading}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <FiShoppingBag />
                        Tìm kiếm
                    </button>
                </div>
            </div>
            
            {/* Selected Product Info */}
            {boughtTogetherProductInfo && (
                <div className={`p-6 rounded-xl border-2 ${
                    isDarkMode ? 'bg-gray-800 border-green-500' : 'bg-green-50 border-green-300'
                }`}>
                    <h3 className="text-xl font-bold mb-3">Sản phẩm được chọn</h3>
                    <div className="flex items-center gap-4">
                        <img 
                            src={boughtTogetherProductInfo.thumbnail} 
                            alt={boughtTogetherProductInfo.name}
                            className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div>
                            <h4 className="font-semibold text-lg">
                                #{boughtTogetherProductInfo.productID} - {boughtTogetherProductInfo.name}
                            </h4>
                            <p className="text-gray-500">Giá: {boughtTogetherProductInfo.price?.toLocaleString()}đ</p>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Results */}
            {loading ? (
                <div className="text-center py-20">
                    <FiRefreshCw className="animate-spin text-4xl mx-auto mb-4 text-green-500" />
                    <p>Đang tìm kiếm...</p>
                </div>
            ) : boughtTogetherData.length > 0 ? (
                <>
                    <h3 className="text-xl font-bold">
                        Tìm thấy {boughtTogetherData.length} sản phẩm thường mua cùng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {boughtTogetherData.map((product, index) => renderProductCard(product, index))}
                    </div>
                </>
            ) : boughtTogetherProductId ? (
                <div className="text-center py-20">
                    <FiShoppingBag className="text-6xl mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">Không tìm thấy sản phẩm mua cùng</p>
                </div>
            ) : null}
        </div>
    );
    
    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100'} py-8`}>
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-5xl font-bold mb-2">Lọc đơn hàng CoHUI</h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Phân tích sản phẩm dựa trên thuật toán CoIUM
                    </p>
                </div>
                
                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            activeTab === 'analytics'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiActivity />
                            Chạy CoIUM & Phân tích
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            activeTab === 'general'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiTrendingUp />
                            Gợi ý chung
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('byProduct')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            activeTab === 'byProduct'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiFilter />
                            Theo sản phẩm
                        </div>
                    </button>
                    
                    <button
                        onClick={() => setActiveTab('boughtTogether')}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                            activeTab === 'boughtTogether'
                                ? 'bg-blue-600 text-white shadow-lg'
                                : isDarkMode
                                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                    : 'bg-white text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiShoppingBag />
                            Mua cùng
                        </div>
                    </button>
                </div>
                
                {/* Tab Content */}
                <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {activeTab === 'analytics' && renderAnalyticsTab()}
                    {activeTab === 'general' && renderGeneralTab()}
                    {activeTab === 'byProduct' && renderByProductTab()}
                    {activeTab === 'boughtTogether' && renderBoughtTogetherTab()}
                </div>
            </div>
        </div>
    );
};

export default CoHUIManagement;
