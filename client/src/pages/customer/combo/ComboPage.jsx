// ComboPage.jsx - Trang hiển thị tất cả combo sản phẩm

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTag, FaArrowRight, FaTimes, FaCheck } from 'react-icons/fa';
import { useTheme } from '../../../contexts/CustomerThemeContext';
import axiosInstance from '../../../utils/axios';
import { toast } from 'react-toastify';
import PageBanner from '../../../components/PageBanner';
import { getColorCode, isPatternOrStripe, getBackgroundSize } from '../../../utils/colorUtils';

const ComboPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, male, female
  
  // Modal states
  const [showComboModal, setShowComboModal] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [product1Full, setProduct1Full] = useState(null);
  const [product2Full, setProduct2Full] = useState(null);
  const [selectedColor1, setSelectedColor1] = useState(null);
  const [selectedSize1, setSelectedSize1] = useState('');
  const [selectedColor2, setSelectedColor2] = useState(null);
  const [selectedSize2, setSelectedSize2] = useState('');
  const [addingCombo, setAddingCombo] = useState(false);

  useEffect(() => {
    fetchAllCombos();
  }, []);

  // Fetch tất cả combo từ API
  const fetchAllCombos = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách tất cả sản phẩm (không filter theo target)
      const response = await axiosInstance.get('/api/products', {
        params: {
          limit: 1000, // Lấy nhiều sản phẩm
          isActivated: true
        }
      });
      const products = response.data.products;
      
      console.log('Fetched products:', products.length);
      console.log('Products by targetID:', {
        male: products.filter(p => p.targetID === 1).length,
        female: products.filter(p => p.targetID === 2).length,
        other: products.filter(p => p.targetID !== 1 && p.targetID !== 2).length
      });

      // Tạo combo cho mỗi sản phẩm (lấy sản phẩm tương quan cao nhất)
      const comboPromises = products.map(async (product) => {
        try {
          const cohuiResponse = await axiosInstance.get(`/api/cohui/bought-together/${product.productID}`);
          
          if (cohuiResponse.data.success && cohuiResponse.data.recommendations && cohuiResponse.data.recommendations.length > 0) {
            // Lọc bỏ sản phẩm hiện tại và chỉ lấy sản phẩm cùng giới tính
            const filtered = cohuiResponse.data.recommendations.filter(item => {
              if (!item.productDetails) return false;
              if (item.productDetails.productID === product.productID) return false;
              
              const currentTargetID = product.targetID && product.targetID !== 'undefined' 
                ? parseInt(product.targetID) 
                : null;
              const itemTargetID = item.productDetails.targetID;
              
              if (currentTargetID && itemTargetID) {
                return itemTargetID === currentTargetID;
              }
              
              if (product.target && item.productDetails.target) {
                return item.productDetails.target === product.target;
              }
              
              return true;
            });
            
            if (filtered.length > 0) {
              return {
                mainProduct: product,
                comboProduct: filtered[0].productDetails,
                targetID: product.targetID
              };
            }
          }
          return null;
        } catch (error) {
          return null;
        }
      });

      const allCombos = await Promise.all(comboPromises);
      const validCombos = allCombos.filter(combo => combo !== null);
      
      // Loại bỏ combo trùng lặp (A+B và B+A là giống nhau)
      const uniqueCombos = [];
      const seenPairs = new Set();
      
      validCombos.forEach(combo => {
        const id1 = combo.mainProduct.productID;
        const id2 = combo.comboProduct.productID;
        
        // Tạo key duy nhất cho cặp sản phẩm (luôn sắp xếp để A+B = B+A)
        const pairKey = [id1, id2].sort((a, b) => a - b).join('-');
        
        if (!seenPairs.has(pairKey)) {
          seenPairs.add(pairKey);
          uniqueCombos.push(combo);
        }
      });
      
      console.log('=== COMBO DATA DEBUG ===');
      console.log('Total valid combos before dedup:', validCombos.length);
      console.log('Unique combos after dedup:', uniqueCombos.length);
      console.log('Sample combo data:', uniqueCombos.slice(0, 3).map(c => ({
        productName: c.mainProduct.name,
        productID: c.mainProduct.productID,
        targetID: c.mainProduct.targetID,
        targetIDType: typeof c.mainProduct.targetID,
        target: c.mainProduct.target,
        comboWith: c.comboProduct.name
      })));
      
      // Phân loại combo theo targetID
      const maleCount = uniqueCombos.filter(c => {
        const tid = c.mainProduct.targetID;
        return tid === 1 || tid === '1' || parseInt(tid) === 1;
      }).length;
      const femaleCount = validCombos.filter(c => {
        const tid = c.mainProduct.targetID;
        return tid === 2 || tid === '2' || parseInt(tid) === 2;
      }).length;
      console.log('Male combos:', maleCount, 'Female combos:', femaleCount);
      
      setCombos(uniqueCombos);
    } catch (error) {
      console.error('Lỗi khi tải danh sách combo:', error);
      toast.error('Không thể tải danh sách combo');
    } finally {
      setLoading(false);
    }
  };

  // Mở modal combo và load thông tin đầy đủ
  const handleOpenComboModal = async (combo) => {
    try {
      setShowComboModal(true);
      setSelectedCombo(combo);
      
      // Fetch thông tin đầy đủ của sản phẩm 1
      const product1Response = await axiosInstance.get(`/api/products/${combo.mainProduct.productID}`);
      const product1Data = product1Response.data.product || product1Response.data;
      setProduct1Full(product1Data);
      
      // Set màu và size mặc định cho sản phẩm 1
      if (product1Data.colors?.length > 0) {
        setSelectedColor1(product1Data.colors[0]);
        if (product1Data.colors[0].sizes?.length > 0) {
          setSelectedSize1(product1Data.colors[0].sizes[0].size);
        }
      }
      
      // Fetch thông tin đầy đủ của sản phẩm 2
      const product2Response = await axiosInstance.get(`/api/products/${combo.comboProduct.productID}`);
      const product2Data = product2Response.data.product || product2Response.data;
      setProduct2Full(product2Data);
      
      // Set màu và size mặc định cho sản phẩm 2
      if (product2Data.colors?.length > 0) {
        setSelectedColor2(product2Data.colors[0]);
        if (product2Data.colors[0].sizes?.length > 0) {
          setSelectedSize2(product2Data.colors[0].sizes[0].size);
        }
      }
    } catch (error) {
      console.error('Error loading combo details:', error);
      toast.error('Không thể tải thông tin combo');
    }
  };

  // Đóng modal và reset states
  const handleCloseModal = () => {
    setShowComboModal(false);
    setSelectedCombo(null);
    setProduct1Full(null);
    setProduct2Full(null);
    setSelectedColor1(null);
    setSelectedSize1('');
    setSelectedColor2(null);
    setSelectedSize2('');
  };

  // Thêm combo vào giỏ từ modal
  const handleAddComboFromModal = async () => {
    try {
      // Kiểm tra đăng nhập
      const token = localStorage.getItem('customerToken');
      if (!token) {
        toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        navigate('/login');
        return;
      }

      // Validate selections
      if (!selectedColor1 || !selectedSize1) {
        toast.error('Vui lòng chọn màu sắc và kích thước cho sản phẩm 1');
        return;
      }
      if (!selectedColor2 || !selectedSize2) {
        toast.error('Vui lòng chọn màu sắc và kích thước cho sản phẩm 2');
        return;
      }

      setAddingCombo(true);

      // Thêm sản phẩm 1 vào giỏ
      await axiosInstance.post('/api/carts', {
        productID: selectedCombo.mainProduct.productID,
        colorName: selectedColor1.colorName,
        size: selectedSize1,
        quantity: 1
      });

      // Thêm sản phẩm 2 vào giỏ
      await axiosInstance.post('/api/carts', {
        productID: selectedCombo.comboProduct.productID,
        colorName: selectedColor2.colorName,
        size: selectedSize2,
        quantity: 1
      });

      toast.success('✅ Đã thêm combo vào giỏ hàng!');
      handleCloseModal();
      
      // Hỏi người dùng muốn xem giỏ hàng
      setTimeout(() => {
        toast.info(
          <div>
            <p className="font-bold mb-2">Xem giỏ hàng của bạn?</p>
            <button
              onClick={() => navigate('/cart')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Xem giỏ hàng
            </button>
          </div>,
          { autoClose: 5000 }
        );
      }, 500);

    } catch (error) {
      console.error('Error adding combo:', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Không thể thêm combo vào giỏ hàng');
      }
    } finally {
      setAddingCombo(false);
    }
  };

  // Thêm combo vào giỏ hàng (OLD - DEPRECATED)
  const handleAddComboToCart = async (combo, index) => {
    try {
      // Kiểm tra đăng nhập
      const token = localStorage.getItem('token');
      if (!token) {
        toast.info('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
        navigate('/login');
        return;
      }

      setAddingToCart(prev => ({ ...prev, [index]: true }));

      console.log('=== ADDING COMBO TO CART ===');
      console.log('Main Product ID:', combo.mainProduct.productID);
      console.log('Combo Product ID:', combo.comboProduct.productID);

      // Lấy màu và size mặc định cho sản phẩm chính
      const mainProductResponse = await axiosInstance.get(`/api/products/${combo.mainProduct.productID}`);
      const mainProductFull = mainProductResponse.data;
      console.log('Main Product Full:', mainProductFull);
      
      // Lấy màu và size mặc định cho sản phẩm combo
      const comboProductResponse = await axiosInstance.get(`/api/products/${combo.comboProduct.productID}`);
      const comboProductFull = comboProductResponse.data;
      console.log('Combo Product Full:', comboProductFull);

      // Kiểm tra có colors và sizes không
      if (!mainProductFull.colors || mainProductFull.colors.length === 0) {
        toast.error(`Sản phẩm "${combo.mainProduct.name}" chưa có màu sắc`);
        console.error('Main product has no colors');
        return;
      }
      if (!comboProductFull.colors || comboProductFull.colors.length === 0) {
        toast.error(`Sản phẩm "${combo.comboProduct.name}" chưa có màu sắc`);
        console.error('Combo product has no colors');
        return;
      }

      const mainColor = mainProductFull.colors[0];
      const comboColor = comboProductFull.colors[0];

      console.log('Main Color:', mainColor);
      console.log('Combo Color:', comboColor);

      if (!mainColor.sizes || mainColor.sizes.length === 0) {
        toast.error(`Sản phẩm "${combo.mainProduct.name}" chưa có kích thước`);
        console.error('Main product has no sizes');
        return;
      }
      if (!comboColor.sizes || comboColor.sizes.length === 0) {
        toast.error(`Sản phẩm "${combo.comboProduct.name}" chưa có kích thước`);
        console.error('Combo product has no sizes');
        return;
      }

      const mainSize = mainColor.sizes[0];
      const comboSize = comboColor.sizes[0];

      console.log('Main Size:', mainSize);
      console.log('Combo Size:', comboSize);

      // Kiểm tra tồn kho
      if (mainSize.stock < 1) {
        toast.error(`Sản phẩm "${combo.mainProduct.name}" đã hết hàng`);
        console.error('Main product out of stock');
        return;
      }
      if (comboSize.stock < 1) {
        toast.error(`Sản phẩm "${combo.comboProduct.name}" đã hết hàng`);
        console.error('Combo product out of stock');
        return;
      }

      // Thêm sản phẩm chính vào giỏ
      console.log('Adding main product to cart:', {
        productID: combo.mainProduct.productID,
        colorID: mainColor.colorID,
        sizeID: mainSize.sizeID,
        quantity: 1
      });
      
      const addMainResponse = await axiosInstance.post('/api/cart/add', {
        productID: combo.mainProduct.productID,
        colorID: mainColor.colorID,
        sizeID: mainSize.sizeID,
        quantity: 1
      });
      console.log('Main product added:', addMainResponse.data);

      // Thêm sản phẩm combo vào giỏ
      console.log('Adding combo product to cart:', {
        productID: combo.comboProduct.productID,
        colorID: comboColor.colorID,
        sizeID: comboSize.sizeID,
        quantity: 1
      });
      
      const addComboResponse = await axiosInstance.post('/api/cart/add', {
        productID: combo.comboProduct.productID,
        colorID: comboColor.colorID,
        sizeID: comboSize.sizeID,
        quantity: 1
      });
      console.log('Combo product added:', addComboResponse.data);

      toast.success('✅ Đã thêm combo vào giỏ hàng!');
      
      // Hỏi người dùng muốn tiếp tục mua hay thanh toán
      setTimeout(() => {
        toast.info(
          <div>
            <p className="font-bold mb-2">Bạn muốn làm gì tiếp theo?</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/cart')}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Xem giỏ hàng
              </button>
            </div>
          </div>,
          { autoClose: 5000 }
        );
      }, 500);

    } catch (error) {
      console.error('=== ERROR ADDING COMBO ===');
      console.error('Error:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại');
        navigate('/login');
      } else {
        const errorMsg = error.response?.data?.message || 'Không thể thêm combo vào giỏ hàng';
        toast.error(errorMsg);
        console.error('Error message:', errorMsg);
      }
    } finally {
      setAddingToCart(prev => ({ ...prev, [index]: false }));
    }
  };

  // Tính giá combo với discount
  const calculateComboPrice = (mainProduct, comboProduct) => {
    const mainPrice = mainProduct.finalPrice || mainProduct.price;
    const comboPrice = comboProduct.finalPrice || comboProduct.price;
    const totalPrice = mainPrice + comboPrice;
    
    // Logic khuyến mãi mới:
    // - Dưới 1 triệu: giảm 3%
    // - Dưới 3 triệu: giảm 5%
    // - Từ 3 triệu trở lên: giảm 10%
    let discountPercent = 0;
    if (totalPrice >= 3000000) {
      discountPercent = 10;
    } else if (totalPrice >= 1000000) {
      discountPercent = 5;
    } else {
      discountPercent = 3;
    }
    
    const discountAmount = totalPrice * (discountPercent / 100);
    const finalPrice = totalPrice - discountAmount;
    
    return {
      originalPrice: totalPrice,
      discountPercent,
      discountAmount,
      finalPrice,
      savings: discountAmount
    };
  };

  // Filter combo theo giới tính
  const filteredCombos = combos.filter(combo => {
    if (selectedFilter === 'all') return true;
    
    // Lấy targetID từ mainProduct
    const targetID = combo.mainProduct?.targetID;
    
    // Xử lý targetID có thể là string, number, hoặc undefined
    let normalizedTargetID;
    if (targetID === undefined || targetID === null) {
      return false; // Bỏ qua sản phẩm không có targetID
    }
    
    if (typeof targetID === 'string') {
      normalizedTargetID = parseInt(targetID);
    } else {
      normalizedTargetID = targetID;
    }
    
    // Check if parsing failed
    if (isNaN(normalizedTargetID)) {
      console.warn('Invalid targetID for product:', combo.mainProduct?.name, targetID);
      return false;
    }
    
    if (selectedFilter === 'male') return normalizedTargetID === 1;
    if (selectedFilter === 'female') return normalizedTargetID === 2;
    return false;
  });
  
  console.log('=== FILTER DEBUG ===');
  console.log('Selected filter:', selectedFilter);
  console.log('Total combos:', combos.length);
  console.log('Filtered combos:', filteredCombos.length);
  
  // DEBUG: In ra targetID của TẤT CẢ combos để xem
  console.log('ALL COMBO targetIDs:', combos.map(c => ({
    name: c.mainProduct?.name,
    targetID: c.mainProduct?.targetID,
    type: typeof c.mainProduct?.targetID,
    isNumber: typeof c.mainProduct?.targetID === 'number',
    equals1: c.mainProduct?.targetID === 1,
    equalsString1: c.mainProduct?.targetID === '1'
  })));
  
  if (filteredCombos.length > 0) {
    console.log('First 3 filtered combos:', filteredCombos.slice(0, 3).map(c => ({
      name: c.mainProduct.name,
      targetID: c.mainProduct.targetID
    })));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PageBanner 
        title="COMBO ƯU ĐÃI"
        subtitle="Mua combo tiết kiệm hơn - Sản phẩm thường mua cùng"
        breadcrumbText="Combo"
      />

      <div className="container mx-auto px-4 py-12">
        {/* Filter buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedFilter === 'all'
                ? theme === 'tet'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setSelectedFilter('male')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedFilter === 'male'
                ? theme === 'tet'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Nam
          </button>
          <button
            onClick={() => setSelectedFilter('female')}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              selectedFilter === 'female'
                ? theme === 'tet'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Nữ
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-transparent ${
              theme === 'tet' ? 'border-red-600' : 'border-blue-600'
            }`}></div>
          </div>
        ) : filteredCombos.length === 0 ? (
          <div className="text-center py-20">
            <FaTag className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-600">Chưa có combo nào</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCombos.map((combo, index) => {
              const priceInfo = calculateComboPrice(combo.mainProduct, combo.comboProduct);
              
              return (
                <div 
                  key={index}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border-2 ${
                    theme === 'tet' ? 'border-red-200 hover:border-red-400' : 'border-blue-200 hover:border-blue-400'
                  }`}
                >
                  {/* Badge discount */}
                  {priceInfo.discountPercent > 0 && (
                    <div className={`absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-white font-bold text-sm ${
                      theme === 'tet' ? 'bg-red-600' : 'bg-blue-600'
                    }`}>
                      -{priceInfo.discountPercent}%
                    </div>
                  )}

                  {/* Combo products images */}
                  <div className="grid grid-cols-2 gap-2 p-4 bg-gray-50">
                    <div className="aspect-square overflow-hidden rounded-lg bg-white">
                      <img 
                        src={combo.mainProduct.thumbnail || '/placeholder-product.png'}
                        alt={combo.mainProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square overflow-hidden rounded-lg bg-white">
                      <img 
                        src={combo.comboProduct.thumbnail || '/placeholder-product.png'}
                        alt={combo.comboProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Combo info */}
                  <div className="p-4">
                    <h3 className={`text-lg font-bold mb-2 ${theme === 'tet' ? 'text-red-700' : 'text-blue-700'}`}>
                      <FaTag className="inline mr-2" />
                      Combo Tiết Kiệm
                    </h3>
                    
                    <div className="space-y-1 mb-3 text-sm text-gray-600">
                      <p className="line-clamp-1">• {combo.mainProduct.name}</p>
                      <p className="line-clamp-1">• {combo.comboProduct.name}</p>
                    </div>

                    <div className="border-t pt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Giá gốc:</span>
                        <span className="line-through text-gray-400">
                          {priceInfo.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>Giá combo:</span>
                        <span className={theme === 'tet' ? 'text-red-600' : 'text-blue-600'}>
                          {priceInfo.finalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <p className="text-xs text-green-600 text-center">
                        ⭐ Tiết kiệm {priceInfo.savings.toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    {/* Buttons */}
                    <div className="mt-4">
                      <button
                        onClick={() => handleOpenComboModal(combo)}
                        className={`w-full py-3 rounded-full font-bold text-white flex items-center justify-center transition-all ${
                          theme === 'tet'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        <FaTag className="mr-2" />
                        Xem Chi Tiết & Chọn Combo
                        <FaArrowRight className="ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Combo - Chọn màu và size */}
      {showComboModal && selectedCombo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`sticky top-0 z-10 p-4 border-b flex items-center justify-between ${
              theme === 'tet' ? 'bg-red-50' : 'bg-blue-50'
            }`}>
              <h2 className={`text-2xl font-bold flex items-center ${
                theme === 'tet' ? 'text-red-700' : 'text-blue-700'
              }`}>
                <FaTag className="mr-2" />
                Chọn Màu & Size Cho Combo
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Loading State or Content */}
            {!product1Full || !product2Full ? (
              <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4 ${
                    theme === 'tet' ? 'border-red-600' : 'border-blue-600'
                  }`}></div>
                  <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Discount Badge */}
                {calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).discountPercent > 0 && (
                  <div className={`text-center mb-6 p-4 rounded-xl ${
                    theme === 'tet' ? 'bg-red-50' : 'bg-blue-50'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      🎉 Giảm {calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).discountPercent}% - Tiết kiệm {calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).savings.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sản phẩm 1 */}
                  <div className="border rounded-xl p-4">
                    <h3 
                      onClick={() => navigate(`/product/${selectedCombo.mainProduct.productID}`)}
                      className="text-lg font-bold mb-3 cursor-pointer hover:text-blue-600 transition"
                    >
                      Sản phẩm 1: {selectedCombo.mainProduct.name}
                    </h3>
                    <img 
                      src={selectedCombo.mainProduct.thumbnail}
                      alt={selectedCombo.mainProduct.name}
                      onClick={() => navigate(`/product/${selectedCombo.mainProduct.productID}`)}
                      className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition"
                    />
                    <p className={`text-xl font-bold mb-2 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                      {(selectedCombo.mainProduct.finalPrice || selectedCombo.mainProduct.price).toLocaleString('vi-VN')}đ
                    </p>
                  
                    {/* Chọn màu */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Chọn màu sắc:</label>
                      <div className="flex flex-wrap gap-2">
                        {product1Full?.colors?.filter(color => color && color.colorName).map((color) => (
                          <button
                            key={color.colorID}
                            onClick={() => {
                              setSelectedColor1(color);
                              setSelectedSize1('');
                            }}
                            className={`relative group`}
                            title={color.colorName}
                          >
                            <div
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                selectedColor1?.colorID === color.colorID
                                  ? theme === 'tet'
                                    ? 'border-red-600 ring-2 ring-red-300'
                                    : 'border-blue-600 ring-2 ring-blue-300'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                background: getColorCode(color.colorName),
                                backgroundImage: isPatternOrStripe(color.colorName) ? getColorCode(color.colorName) : 'none',
                                backgroundSize: getBackgroundSize(color.colorName),
                              }}
                            />
                            {selectedColor1?.colorID === color.colorID && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                                theme === 'tet' ? 'bg-red-600' : 'bg-blue-600'
                              } flex items-center justify-center`}>
                                <FaCheck className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chọn size */}
                    {selectedColor1 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Chọn kích thước:</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedColor1.sizes?.map((sizeObj) => (
                            <button
                              key={sizeObj.size}
                              onClick={() => setSelectedSize1(sizeObj.size)}
                              disabled={sizeObj.stock === 0}
                              className={`px-4 py-2 rounded-lg font-medium border-2 transition-all ${
                                sizeObj.stock === 0
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : selectedSize1 === sizeObj.size
                                    ? theme === 'tet'
                                      ? 'bg-red-600 text-white border-red-600'
                                      : 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {sizeObj.size}
                              {sizeObj.stock === 0 && ' (Hết)'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sản phẩm 2 */}
                  <div className="border rounded-xl p-4">
                    <h3 
                      onClick={() => navigate(`/product/${selectedCombo.comboProduct.productID}`)}
                      className="text-lg font-bold mb-3 cursor-pointer hover:text-blue-600 transition"
                    >
                      Sản phẩm 2: {selectedCombo.comboProduct.name}
                    </h3>
                    <img 
                      src={selectedCombo.comboProduct.thumbnail}
                      alt={selectedCombo.comboProduct.name}
                      onClick={() => navigate(`/product/${selectedCombo.comboProduct.productID}`)}
                      className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition"
                    />
                    <p className={`text-xl font-bold mb-2 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                      {(selectedCombo.comboProduct.finalPrice || selectedCombo.comboProduct.price).toLocaleString('vi-VN')}đ
                    </p>
                  
                    {/* Chọn màu */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Chọn màu sắc:</label>
                      <div className="flex flex-wrap gap-2">
                        {product2Full?.colors?.filter(color => color && color.colorName).map((color) => (
                          <button
                            key={color.colorID}
                            onClick={() => {
                              setSelectedColor2(color);
                              setSelectedSize2('');
                            }}
                            className={`relative group`}
                            title={color.colorName}
                          >
                            <div
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                selectedColor2?.colorID === color.colorID
                                  ? theme === 'tet'
                                    ? 'border-red-600 ring-2 ring-red-300'
                                    : 'border-blue-600 ring-2 ring-blue-300'
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              style={{
                                background: getColorCode(color.colorName),
                                backgroundImage: isPatternOrStripe(color.colorName) ? getColorCode(color.colorName) : 'none',
                                backgroundSize: getBackgroundSize(color.colorName),
                              }}
                            />
                            {selectedColor2?.colorID === color.colorID && (
                              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                                theme === 'tet' ? 'bg-red-600' : 'bg-blue-600'
                              } flex items-center justify-center`}>
                                <FaCheck className="text-white text-xs" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chọn size */}
                    {selectedColor2 && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Chọn kích thước:</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedColor2.sizes?.map((sizeObj) => (
                            <button
                              key={sizeObj.size}
                              onClick={() => setSelectedSize2(sizeObj.size)}
                              disabled={sizeObj.stock === 0}
                              className={`px-4 py-2 rounded-lg font-medium border-2 transition-all ${
                                sizeObj.stock === 0
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : selectedSize2 === sizeObj.size
                                    ? theme === 'tet'
                                      ? 'bg-red-600 text-white border-red-600'
                                      : 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {sizeObj.size}
                              {sizeObj.stock === 0 && ' (Hết)'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Tổng giá gốc:</span>
                    <span className="line-through text-gray-400">
                      {calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).originalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Giảm giá ({calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).discountPercent}%):</span>
                    <span className="text-green-600 font-bold">
                      -{calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).savings.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className={`flex justify-between items-center text-2xl font-bold ${
                    theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    <span>Giá combo:</span>
                    <span>{calculateComboPrice(selectedCombo.mainProduct, selectedCombo.comboProduct).finalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddComboFromModal}
                  disabled={addingCombo || !selectedColor1 || !selectedSize1 || !selectedColor2 || !selectedSize2}
                  className={`w-full mt-6 py-4 rounded-full font-bold text-white text-lg flex items-center justify-center transition-all ${
                    addingCombo || !selectedColor1 || !selectedSize1 || !selectedColor2 || !selectedSize2
                      ? 'bg-gray-300 cursor-not-allowed'
                      : theme === 'tet'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {addingCombo ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-2"></div>
                      Đang thêm...
                    </>
                  ) : (
                    <>
                      <FaShoppingCart className="mr-2" />
                      Thêm Combo Vào Giỏ Hàng
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboPage;
