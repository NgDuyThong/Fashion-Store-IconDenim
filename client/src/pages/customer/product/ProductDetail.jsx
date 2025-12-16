// ProductDetail.jsx - Trang chi tiết sản phẩm

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaHeart, FaStar, FaMinus, FaPlus, FaArrowRight, FaHome, FaChevronRight, FaRegHeart, FaTag, FaEye, FaMedal, FaRuler, FaPalette, FaBolt, FaChevronDown, FaInfoCircle, FaPhoneAlt, FaFacebookMessenger, FaEdit, FaTrash, FaTshirt, FaTimes, FaCheck, FaFire } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, Thumbs, EffectFade, EffectCreative, EffectCards } from 'swiper/modules';
import { useTheme } from '../../../contexts/CustomerThemeContext';
import axiosInstance from '../../../utils/axios';
import { toast } from 'react-toastify';
import RecommendationCarousel from '../../../components/RecommendationCarousel';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/effect-fade';
import 'swiper/css/autoplay';
import { getColorCode, isPatternOrStripe, getBackgroundSize } from '../../../utils/colorUtils';
import PageBanner from '../../../components/PageBanner';

const ProductDetail = () => {
  const { id } = useParams();
  const { theme } = useTheme();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [expandedSection, setExpandedSection] = useState(null);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const navigate = useNavigate();

  // State cho phần review
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingCounts: {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    }
  });
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });

  // Thêm state để theo dõi trạng thái yêu thích
  const [isFavorite, setIsFavorite] = useState(false);

  // Thêm state để theo dõi đánh giá đang chỉnh sửa
  const [editingReview, setEditingReview] = useState({
    id: null,
    rating: 5,
    comment: ''
  });

  // State cho sản phẩm tương tự (CoHUI recommendations)
  const [similarProducts, setSimilarProducts] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // State cho combo
  const [comboProduct, setComboProduct] = useState(null); // Sản phẩm tương quan cao nhất
  const [showCombo, setShowCombo] = useState(false); // Hiển thị combo box
  const [comboLoading, setComboLoading] = useState(false);
  
  // State cho modal combo
  const [showComboModal, setShowComboModal] = useState(false);
  const [productFull, setProductFull] = useState(null); // Product hiện tại với colors đầy đủ
  const [comboProductFull, setComboProductFull] = useState(null);
  const [comboSelectedColor, setComboSelectedColor] = useState(null); 
  const [comboSelectedSize, setComboSelectedSize] = useState('');
  const [addingCombo, setAddingCombo] = useState(false);

  // Fetch thông tin sản phẩm và đánh giá khi component mount hoặc id thay đổi
  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        // Lấy thông tin sản phẩm
        const response = await axiosInstance.get(`/api/products/${id}`);
        setProduct(response.data.product);
        
        // Tự động chọn màu và size đầu tiên nếu có
        if (response.data.product.availableColors.length > 0) {
          setSelectedColor(response.data.product.availableColors[0]);
        }
        if (response.data.product.availableSizes.length > 0) {
          setSelectedSize(response.data.product.availableSizes[0]);
        }

        // Lấy danh sách đánh giá cho sản phẩm
        const reviewsResponse = await axiosInstance.get(`/api/reviews/product/${id}`);
        setReviews(reviewsResponse.data.reviews);

        // Tính toán thống kê đánh giá
        const stats = {
          averageRating: 0,
          totalReviews: reviewsResponse.data.reviews.length,
          ratingCounts: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        };

        // Tính số lượng mỗi loại đánh giá và điểm trung bình
        reviewsResponse.data.reviews.forEach(review => {
          stats.averageRating += review.rating;
          stats.ratingCounts[review.rating]++;
        });

        // Tính điểm trung bình và làm tròn đến 1 chữ số thập phân
        stats.averageRating = stats.totalReviews > 0
          ? Math.round((stats.averageRating / stats.totalReviews) * 10) / 10
          : 0;

        setReviewStats(stats);
      } catch (error) {
        toast.error('Không thể tải thông tin sản phẩm và đánh giá');
        console.error('Lỗi khi tải thông tin sản phẩm và đánh giá(ProductDetail.jsx):', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductAndReviews();
  }, [id]);

  // Kiểm tra trạng thái yêu thích của sản phẩm khi component mount
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      try {
        // Kiểm tra token đăng nhập
        const token = localStorage.getItem('customerToken');
        if (!token) return;

        // Kiểm tra đã chọn màu và size chưa
        if (!selectedColor || !selectedSize) return;

        // Lấy thông tin color và size để tạo SKU
        const color = product.colors.find(c => c.colorName === selectedColor);
        const stockResponse = await axiosInstance.get(`/api/product-size-stock/color/${color.colorID}`);
        const sizeStock = stockResponse.data.find(item => item.size === selectedSize);

        if (!sizeStock) return;

        // Sử dụng SKU có sẵn từ API response thay vì tạo mới
        const SKU = sizeStock.SKU || `${product.productID}_${color.colorID}_${selectedSize}_${sizeStock.sizeStockID}`;
        console.log('SKU:', SKU, '(from API:', sizeStock.SKU ? 'yes' : 'no, generated)');
        
        // URL encode SKU để tránh lỗi với ký tự đặc biệt
        const encodedSKU = encodeURIComponent(SKU);
        const response = await axiosInstance.get(`/api/favorite/check/${encodedSKU}`);

        setIsFavorite(response.data.isFavorite);
      } catch (error) {
        console.error('Lỗi khi check trạng thái yêu thích(ProductDetail.jsx):', error);
      }
    };

    checkFavoriteStatus();
  }, [product, selectedColor, selectedSize]);

  // Fetch sản phẩm tương tự từ CoHUI API với fallback
  useEffect(() => {
    const fetchSimilarProducts = async () => {
      if (!id || !product) {
        console.log('⏭️ Bỏ qua fetch similar products:', { id, hasProduct: !!product });
        return;
      }
      
      try {
        // ✅ Reset state trước khi fetch mới
        setSimilarProducts([]);
        setSimilarLoading(true);
        console.log('🔄 BẮT ĐẦU fetch similar products cho sản phẩm #' + id);
        
        // Bước 1: Thử lấy từ CoHUI API (sản phẩm có tương quan cao)
        try {
          const cohuiResponse = await axiosInstance.get(`/api/cohui/bought-together/${id}`);
          
          if (cohuiResponse.data.success && cohuiResponse.data.recommendations && cohuiResponse.data.recommendations.length > 0) {
            // Debug: Log thông tin sản phẩm hiện tại
            console.log('📌 Sản phẩm hiện tại:', {
              productID: product.productID,
              targetID: product.targetID,
              'targetID type': typeof product.targetID,
              target: product.target,
              'target type': typeof product.target,
              category: product.category
            });
            
            // Debug: Log recommendations trước khi filter
            console.log('📦 CoHUI recommendations (trước filter):', 
              cohuiResponse.data.recommendations.map(item => ({
                id: item.productDetails?.productID,
                name: item.productDetails?.name,
                targetID: item.productDetails?.targetID,
                target: item.productDetails?.target
              }))
            );
            
            // Lọc bỏ sản phẩm hiện tại và chỉ lấy sản phẩm cùng giới tính (targetID)
            const filtered = cohuiResponse.data.recommendations.filter(item => {
              if (!item.productDetails) return false;
              if (item.productDetails.productID === parseInt(id)) return false;
              
              // ✅ FIX: Kiểm tra targetID - ưu tiên targetID (number), fallback sang target name (string)
              // Xử lý cả trường hợp targetID là undefined hoặc string "undefined"
              const currentTargetID = product.targetID && product.targetID !== 'undefined' 
                ? parseInt(product.targetID) 
                : null;
              const itemTargetID = item.productDetails.targetID;
              
              console.log(`🔍 Checking #${item.productDetails.productID}:`, {
                'item.targetID': itemTargetID,
                'current.targetID': currentTargetID,
                'item.target': item.productDetails.target,
                'current.target': product.target,
                'match by ID': currentTargetID && itemTargetID && itemTargetID === currentTargetID,
                'match by name': product.target && item.productDetails.target && item.productDetails.target === product.target
              });
              
              // So sánh theo targetID (nếu có)
              if (currentTargetID && itemTargetID) {
                return itemTargetID === currentTargetID;
              }
              
              // Fallback: So sánh theo target name (string)
              if (product.target && item.productDetails.target) {
                return item.productDetails.target === product.target;
              }
              
              // Nếu không có targetID và target → Cho qua (hiển thị tất cả)
              return true;
            });
            
            // Debug: Log sau khi filter
            console.log('✅ CoHUI recommendations (sau filter):', 
              filtered.map(item => ({
                id: item.productDetails?.productID,
                name: item.productDetails?.name,
                targetID: item.productDetails?.targetID,
                target: item.productDetails?.target
              }))
            );
            
            // Chỉ dùng CoHUI nếu có ĐỦ sản phẩm (ít nhất 2 sản phẩm cùng giới tính)
            // ✅ Giảm từ 3 xuống 2 vì correlation_map đã được filter, số lượng ít hơn
            if (filtered.length >= 2) {
              console.log('✅ CoHUI: Tìm thấy', filtered.length, 'sản phẩm cùng giới tính → Sử dụng CoHUI');
              setSimilarProducts(filtered);
              return; // Đã có kết quả CoHUI, không cần fallback
            } else if (filtered.length > 0) {
              console.log('⚠️ CoHUI chỉ tìm thấy', filtered.length, 'sản phẩm cùng giới tính (< 2) → Chuyển sang fallback');
            }
          }
        } catch (cohuiError) {
          console.log('⚠️ CoHUI không có kết quả, chuyển sang fallback...');
        }
        
        // Bước 2: Fallback - Lấy sản phẩm cùng category và cùng giới tính
        console.log('🔄 Đang lấy sản phẩm cùng danh mục và giới tính...', {
          categoryID: product.categoryID,
          targetID: product.targetID,
          targetName: product.target,
          apiParam: { target: product.targetID }
        });
        const fallbackResponse = await axiosInstance.get('/api/products', {
          params: {
            categoryID: product.categoryID,
            target: product.targetID, // Sử dụng 'target' thay vì 'targetID'
            limit: 10
          }
        });
        
        console.log('📦 Fallback response:', {
          total: fallbackResponse.data.products?.length,
          products: fallbackResponse.data.products?.map(p => ({
            id: p.productID,
            name: p.name,
            targetID: p.targetID,
            target: p.target
          }))
        });
        
        if (fallbackResponse.data.products) {
          // Lọc bỏ sản phẩm hiện tại và tính điểm tương đồng dựa trên giá
          const currentPrice = product.price;
          const fallbackProducts = fallbackResponse.data.products
            .filter(p => p.productID !== parseInt(id))
            .map(p => {
              // Tính điểm tương đồng dựa trên khoảng cách giá (càng gần càng cao)
              const priceDiff = Math.abs(p.price - currentPrice);
              const maxDiff = currentPrice * 0.5; // 50% giá hiện tại
              const similarity = Math.max(0, (1 - priceDiff / maxDiff) * 100);
              
              return {
                productDetails: p,
                score: similarity * 10000, // Scale để giống CoHUI score
                confidence: similarity.toFixed(1),
                frequency: 1,
                isFallback: true // Đánh dấu là fallback
              };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 6);
          
          console.log('✅ Fallback: Tìm thấy', fallbackProducts.length, 'sản phẩm cùng danh mục và giới tính');
          setSimilarProducts(fallbackProducts);
        } else {
          setSimilarProducts([]);
        }
        
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm tương tự:', error);
        setSimilarProducts([]);
      } finally {
        setSimilarLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [id, product]); // ✅ Cần cả id và product vì logic filter dùng product.targetID

  // Fetch combo product (sản phẩm tương quan cao nhất)
  useEffect(() => {
    const fetchComboProduct = async () => {
      if (!id || !product) return;
      
      try {
        setComboLoading(true);
        
        // Lấy sản phẩm tương quan cao nhất từ CoHUI API
        const response = await axiosInstance.get(`/api/cohui/bought-together/${id}`);
        
        if (response.data.success && response.data.recommendations && response.data.recommendations.length > 0) {
          // Lọc bỏ sản phẩm hiện tại và chỉ lấy sản phẩm cùng giới tính
          const filtered = response.data.recommendations.filter(item => {
            if (!item.productDetails) return false;
            if (item.productDetails.productID === parseInt(id)) return false;
            
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
          
          // Lấy sản phẩm đầu tiên (tương quan cao nhất)
          if (filtered.length > 0) {
            setComboProduct(filtered[0].productDetails);
            setShowCombo(true);
          } else {
            setShowCombo(false);
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải combo product:', error);
        setShowCombo(false);
      } finally {
        setComboLoading(false);
      }
    };

    fetchComboProduct();
  }, [id, product]);

  // Hàm lấy danh sách đánh giá từ API
  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await axiosInstance.get(`/api/reviews/product/${id}`);
      setReviews(response.data.reviews);

      // Tìm userID từ localStorage
      const userID = localStorage.getItem('customerInfo') ? JSON.parse(localStorage.getItem('customerInfo')).userID : null;

      // Tìm đánh giá của user hiện tại nếu có
      const userReview = response.data.reviews.find(review => review.userInfo.userID === userID);
      setUserReview(userReview);
    } catch (error) {
      console.error('Lỗi khi tải đánh giá(ProductDetail.jsx):', error);
      toast.error('Không thể tải đánh giá sản phẩm');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Hàm xử lý gửi đánh giá mới hoặc cập nhật đánh giá
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    // Kiểm tra đăng nhập
    const token = localStorage.getItem('customerToken');
    if (!token) {
      toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
      navigate('/login');
      return;
    }

    try {
      // Gửi đánh giá mới hoặc cập nhật đánh giá hiện tại
      const reviewData = {
        productID: parseInt(id),
        rating: newReview.rating,
        comment: newReview.comment
      };

      if (userReview) {
        // Nếu đã có đánh giá thì cập nhật
        await axiosInstance.put(`/api/reviews/${userReview.reviewID}`, reviewData);
        toast.success('Đã cập nhật đánh giá thành công');
      } else {
        // Nếu chưa có thì tạo mới
        await axiosInstance.post('/api/reviews', reviewData);
        toast.success('Đã gửi đánh giá thành công');
      }

      setShowReviewForm(false);
      setNewReview({ rating: 5, comment: '' });
      fetchReviews(); // Tải lại danh sách đánh giá

      // Cập nhật lại điểm đánh giá trung bình
      const updatedReviews = await axiosInstance.get(`/api/reviews/product/${id}`);
      const updatedStats = {
        averageRating: 0,
        totalReviews: updatedReviews.data.reviews.length,
        ratingCounts: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      };

      updatedReviews.data.reviews.forEach(review => {
        updatedStats.averageRating += review.rating;
        updatedStats.ratingCounts[review.rating]++;
      });

      updatedStats.averageRating = updatedStats.totalReviews > 0
        ? Math.round((updatedStats.averageRating / updatedStats.totalReviews) * 10) / 10
        : 0;

      setReviewStats(updatedStats);
    } catch (error) {
      console.error('Lỗi khi gửi hoặc cập nhật đánh giá(ProductDetail.jsx):', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn');
        localStorage.removeItem('customerToken');
        navigate('/login');
      } else {
        toast.error('Không thể gửi hoặc cập nhật đánh giá');
      }
    }
  };

  // Hàm xử lý xóa đánh giá
  const handleDeleteReview = async (reviewID) => {
    try {
        const token = localStorage.getItem('customerToken');
        if (!token) {
            toast.error('Vui lòng đăng nhập để xóa đánh giá');
            navigate('/login');
            return;
        }

        await axiosInstance.delete(`/api/reviews/${reviewID}`);
        toast.success('Đã xóa đánh giá');
        setUserReview(null);

        // Cập nhật lại danh sách đánh giá
        const updatedReviews = reviews.filter(review => review.reviewID !== reviewID);
        setReviews(updatedReviews);

        // Tính toán lại thống kê đánh giá
        const newStats = {
            averageRating: 0,
            totalReviews: updatedReviews.length,
            ratingCounts: {
                1: 0,
                2: 0,
                3: 0,
                4: 0,
                5: 0
            }
        };

        // Tính lại số lượng mỗi loại đánh giá và điểm trung bình
        updatedReviews.forEach(review => {
            newStats.averageRating += review.rating;
            newStats.ratingCounts[review.rating]++;
        });

        // Tính lại điểm trung bình và làm tròn đến 1 chữ số thập phân
        newStats.averageRating = newStats.totalReviews > 0
            ? Math.round((newStats.averageRating / newStats.totalReviews) * 10) / 10
            : 0;

        setReviewStats(newStats); // Cập nhật lại thống kê
    } catch (error) {
        console.error('Lỗi xóa đánh giá(ProductDetail.jsx):', error);
        if (error.response?.status === 401) {
            toast.error('Phiên đăng nhập đã hết hạn');
            localStorage.removeItem('customerToken');
            navigate('/login');
        } else {
            toast.error('Không thể xóa đánh giá');
        }
    }
};

  // Tải đánh giá khi chuyển tab hoặc id thay đổi
  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchReviews();
    }
  }, [activeTab, id]);

  // Hàm format giá tiền với dấu chấm phân cách
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Hàm kiểm tra số lượng tồn kho cho size và màu đã chọn
  const getStockForSelectedOptions = () => {
    if (!selectedColor || !selectedSize) return 0;
    const color = product.colors.find(c => c.colorName === selectedColor);
    if (!color) return 0;
    const size = color.sizes.find(s => s.size === selectedSize);
    return size ? size.stock : 0;
  };

  // Hàm kiểm tra xem một size có còn hàng không (với màu đã chọn)
  const isSizeAvailable = (size) => {
    if (!selectedColor) return true; // Nếu chưa chọn màu thì hiển thị tất cả size
    const color = product.colors.find(c => c.colorName === selectedColor);
    if (!color) return false;
    const sizeObj = color.sizes.find(s => s.size === size);
    return sizeObj && sizeObj.stock > 0;
  };

  // Hàm kiểm tra xem một màu có còn hàng không (với size đã chọn)
  const isColorAvailable = (colorName) => {
    if (!selectedSize) return true; // Nếu chưa chọn size thì hiển thị tất cả màu
    const color = product.colors.find(c => c.colorName === colorName);
    if (!color) return false;
    const sizeObj = color.sizes.find(s => s.size === selectedSize);
    return sizeObj && sizeObj.stock > 0;
  };

  // Hàm lấy danh sách ảnh của màu đã chọn
  const getSelectedColorImages = () => {
    if (!selectedColor) return [];
    const color = product.colors.find(c => c.colorName === selectedColor);
    return color ? color.images : [];
  };

  // Hàm tính giá combo với discount
  const calculateComboPrice = () => {
    if (!product || !comboProduct) return null;
    
    const currentProductPrice = product.finalPrice || product.price;
    const comboProductPrice = comboProduct.finalPrice || comboProduct.price;
    const totalPrice = currentProductPrice + comboProductPrice;
    
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

  // Hàm xử lý thêm vào giỏ hàng
  const handleAddToCart = async () => {
    try {
      // Kiểm tra đã chọn size và màu
      if (!selectedSize || !selectedColor) {
        toast.error('Vui lòng chọn size và màu sắc');
        return;
      }

      // Kiểm tra số lượng tồn kho
      const stock = getStockForSelectedOptions();
      if (stock <= 0) {
        toast.error('Sản phẩm đã hết hàng');
        return;
      }

      // Lấy thông tin color và size
      const color = product.colors.find(c => c.colorName === selectedColor);
      console.log('Selected Color:', color);
      console.log('Selected Size:', selectedSize);
      console.log('Product Colors:', product.colors);

      // Tìm size trong color.sizes
      const size = color.sizes.find(s => s.size === selectedSize);
      console.log('Size:', size);

      if (!color || !size) {
        toast.error('Không tìm thấy thông tin size hoặc màu sắc');
        return;
      }

      // Lấy thông tin sizeStockID từ API
      const stockResponse = await axiosInstance.get(`/api/product-size-stock/color/${color.colorID}`);
      const sizeStock = stockResponse.data.find(item => item.size === selectedSize);

      if (!sizeStock) {
        toast.error('Không tìm thấy thông tin tồn kho');
        return;
      }

      // Sử dụng SKU có sẵn từ API response thay vì tạo mới
      const SKU = sizeStock.SKU || `${product.productID}_${color.colorID}_${selectedSize}_${sizeStock.sizeStockID}`;
      console.log('SKU:', SKU, '(from API:', sizeStock.SKU ? 'yes' : 'no, generated)');

      // Kiểm tra đăng nhập
      const token = localStorage.getItem('customerToken');
      if (!token) {
        navigate('/login');
        return;
      }

      // Gọi API thêm vào giỏ hàng
      console.log('📤 Sending POST to /api/cart/add with SKU:', SKU, 'quantity:', quantity);
      const response = await axiosInstance.post('/api/cart/add', {
        SKU,
        quantity
      });
      console.log('📥 Response from /api/cart/add:', response);

      if (response.status === 201) {
        toast.success('Đã thêm vào giỏ hàng');
        window.dispatchEvent(new Event('cartChange'));
      } else {
        toast.error('Không thể thêm vào giỏ hàng');
      }
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng(ProductDetail.jsx):', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn');
        localStorage.removeItem('customerToken');
        sessionStorage.removeItem('customerToken');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Số lượng sản phẩm trong kho không đủ');
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || 'Sản phẩm không tồn tại');
      } else {
        toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
      }
    }
  };

  // Hàm xử lý thêm combo vào giỏ hàng
  const handleAddComboToCart = async () => {
    try {
      // Kiểm tra đăng nhập
      const token = localStorage.getItem('customerToken');
      if (!token) {
        toast.error('Vui lòng đăng nhập để mua hàng');
        navigate('/login');
        return;
      }

      // Kiểm tra đã chọn size và màu cho sản phẩm hiện tại
      if (!selectedSize || !selectedColor) {
        toast.error('Vui lòng chọn màu sắc và kích thước cho sản phẩm này');
        return;
      }

      // Kiểm tra đã chọn size và màu cho sản phẩm combo
      if (!comboSelectedSize || !comboSelectedColor) {
        toast.error('Vui lòng chọn màu sắc và kích thước cho sản phẩm combo');
        return;
      }

      setAddingCombo(true);
      console.log('=== ADDING COMBO FROM PRODUCT DETAIL ===');
      console.log('Current Product:', {
        productID: product.productID,
        name: product.name,
        selectedColor,
        selectedSize
      });
      console.log('Combo Product:', {
        productID: comboProduct.productID,
        name: comboProduct.name,
        comboSelectedColor,
        comboSelectedSize
      });

      // ✅ FIX: Lấy colorID - kiểm tra selectedColor là object hay string
      let currentColorID;
      if (typeof selectedColor === 'object' && selectedColor !== null) {
        currentColorID = selectedColor.colorID;
        console.log('✅ Current color is object, colorID:', currentColorID);
      } else {
        // Nếu selectedColor là string (tên màu), tìm trong productFull.colors
        console.log('⚠️ Current color is string, finding in productFull...');
        const colorObj = productFull?.colors?.find(c => c.colorName === selectedColor);
        if (!colorObj) {
          toast.error('Không tìm thấy màu sắc cho sản phẩm này');
          console.error('❌ Color not found:', selectedColor);
          return;
        }
        currentColorID = colorObj.colorID;
        console.log('✅ Found colorID:', currentColorID);
      }

      // Lấy sizeID cho sản phẩm hiện tại
      const currentColorObj = productFull?.colors?.find(c => c.colorID === currentColorID);
      if (!currentColorObj) {
        toast.error('Không tìm thấy thông tin màu sắc');
        console.error('❌ Color object not found for colorID:', currentColorID);
        console.error('Available colors:', productFull?.colors);
        return;
      }

      console.log('🔍 Looking for size in currentColorObj:', {
        selectedSize,
        availableSizes: currentColorObj.sizes
      });

      const currentSize = currentColorObj.sizes?.find(s => s.size === selectedSize);
      if (!currentSize) {
        toast.error('Không tìm thấy kích thước cho sản phẩm này');
        console.error('❌ Size not found:', selectedSize);
        console.error('Available sizes:', currentColorObj.sizes);
        return;
      }

      console.log('✅ Current product - Full size object:', currentSize);
      console.log('✅ Current product - colorID:', currentColorID, 'sizeStockID:', currentSize.sizeStockID, 'stock:', currentSize.stock);

      // Lấy sizeStockID cho sản phẩm combo
      const comboColorID = comboSelectedColor.colorID;
      const comboColorObj = comboProductFull?.colors?.find(c => c.colorID === comboColorID);
      if (!comboColorObj) {
        toast.error('Không tìm thấy thông tin màu sắc cho sản phẩm combo');
        console.error('❌ Combo color object not found for colorID:', comboColorID);
        console.error('Available colors:', comboProductFull?.colors);
        return;
      }

      console.log('🔍 Looking for size in comboColorObj:', {
        comboSelectedSize,
        availableSizes: comboColorObj.sizes
      });

      const comboSize = comboColorObj.sizes?.find(s => s.size === comboSelectedSize);
      if (!comboSize) {
        toast.error('Không tìm thấy kích thước cho sản phẩm combo');
        console.error('❌ Combo size not found:', comboSelectedSize);
        console.error('Available sizes:', comboColorObj.sizes);
        return;
      }

      console.log('✅ Combo product - Full size object:', comboSize);
      console.log('✅ Combo product - colorID:', comboColorID, 'sizeStockID:', comboSize.sizeStockID, 'stock:', comboSize.stock);

      // Kiểm tra tồn kho
      if (currentSize.stock < 1) {
        toast.error(`Sản phẩm "${product.name}" đã hết hàng`);
        return;
      }

      if (comboSize.stock < 1) {
        toast.error(`Sản phẩm "${comboProduct.name}" đã hết hàng`);
        return;
      }

      const requestData = {
        product1: {
          productID: product.productID,
          colorID: currentColorID,
          sizeStockID: currentSize.sizeStockID
        },
        product2: {
          productID: comboProduct.productID,
          colorID: comboColorID,
          sizeStockID: comboSize.sizeStockID
        }
      };

      console.log('📤 Sending request to /api/cart/add-combo:', requestData);

      // Gọi API thêm combo
      const response = await axiosInstance.post('/api/cart/add-combo', requestData);

      console.log('📥 Response:', response.data);

      if (response.data.success) {
        const discountInfo = calculateComboPrice();
        toast.success(`🎉 Đã thêm COMBO vào giỏ hàng! Tiết kiệm ${discountInfo?.discountPercent || 5}%`);
        window.dispatchEvent(new Event('cartChange'));
        setShowComboModal(false);
        
        // Reset state combo
        setProductFull(null);
        setComboProductFull(null);
        setComboSelectedColor(null);
        setComboSelectedSize('');
        
        // Tự động chọn lại màu đầu tiên của sản phẩm chính
        if (product?.availableColors && product.availableColors.length > 0) {
          setSelectedColor(product.availableColors[0]);
        }
        // Tự động chọn lại size đầu tiên
        if (product?.availableSizes && product.availableSizes.length > 0) {
          setSelectedSize(product.availableSizes[0]);
        }
      } else {
        toast.error(response.data.message || 'Có lỗi khi thêm combo');
      }

    } catch (error) {
      console.error('=== ERROR ADDING COMBO ===');
      console.error('Error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || 'Có lỗi khi thêm combo vào giỏ hàng';
      toast.error(errorMessage);
    } finally {
      setAddingCombo(false);
    }
  };

  // Mở modal combo và load thông tin đầy đủ
  const handleOpenComboModal = async () => {
    try {
      setShowComboModal(true);
      
      // ✅ RESET state cũ để force reload
      setProductFull(null);
      setComboProductFull(null);
      
      console.log('=== OPENING COMBO MODAL ===');
      console.log('Current product:', product);
      console.log('Combo product:', comboProduct);
      
      // Fetch thông tin đầy đủ của sản phẩm hiện tại - LUÔN LUÔN LOAD MỚI
      console.log('Fetching full details for product 1...');
      const currentProductResponse = await axiosInstance.get(`/api/products/${id}?t=${Date.now()}`);
      
      // Xử lý response có thể có .product hoặc trực tiếp
      const product1Data = currentProductResponse.data.product || currentProductResponse.data;
      
      console.log('🔍 Product 1 API Response:', product1Data);
      console.log('🔍 Product 1 Colors:', product1Data.colors);
      if (product1Data.colors?.[0]?.sizes?.[0]) {
        console.log('🔍 Product 1 First Size Object:', JSON.stringify(product1Data.colors[0].sizes[0]));
      }
      
      setProductFull(product1Data);
      
      // ✅ Set màu và size mặc định - đảm bảo là object
      if (product1Data.colors?.length > 0) {
        const firstColor = product1Data.colors[0];
        console.log('✅ Setting default color for product 1:', firstColor);
        setSelectedColor(firstColor); // ✅ Set object có colorID
        
        if (firstColor.sizes?.length > 0) {
          const firstSize = firstColor.sizes[0];
          console.log('✅ Setting default size for product 1:', firstSize);
          setSelectedSize(firstSize.size);
        }
      }
      
      // Fetch thông tin đầy đủ của sản phẩm combo - LUÔN LUÔN LOAD MỚI
      if (comboProduct) {
        console.log('Fetching full details for product 2...');
        const response = await axiosInstance.get(`/api/products/${comboProduct.productID}?t=${Date.now()}`);
        
        // Xử lý response có thể có .product hoặc trực tiếp
        const product2Data = response.data.product || response.data;
        
        console.log('🔍 Product 2 API Response:', product2Data);
        console.log('🔍 Product 2 Colors:', product2Data.colors);
        if (product2Data.colors?.[0]?.sizes?.[0]) {
          console.log('🔍 Product 2 First Size Object:', JSON.stringify(product2Data.colors[0].sizes[0]));
        }
        
        setComboProductFull(product2Data);
        
        // ✅ Set màu và size mặc định cho sản phẩm 2
        if (product2Data.colors?.length > 0) {
          const firstColor = product2Data.colors[0];
          console.log('✅ Setting default color for product 2:', firstColor);
          setComboSelectedColor(firstColor); // ✅ Set object có colorID
          
          if (firstColor.sizes?.length > 0) {
            const firstSize = firstColor.sizes[0];
            console.log('✅ Setting default size for product 2:', firstSize);
            setComboSelectedSize(firstSize.size);
          }
        }
      }
      
      console.log('=== COMBO MODAL OPENED ===');
      
    } catch (error) {
      console.error('❌ Error loading combo product details:', error);
      toast.error('Không thể tải thông tin sản phẩm combo');
    }
  };

  // Hàm xử lý thêm/xóa yêu thích
  const handleToggleFavorite = async () => {
    try {
      // Kiểm tra đăng nhập
      const token = localStorage.getItem('customerToken');
      if (!token) {
        toast.error('Vui lòng đăng nhập để thêm vào danh sách yêu thích');
        navigate('/login');
        return;
      }

      // Kiểm tra đã chọn size và màu
      if (!selectedSize || !selectedColor) {
        toast.error('Vui lòng chọn size và màu sắc');
        return;
      }

      // Lấy thông tin color và size
      const color = product.colors.find(c => c.colorName === selectedColor);
      if (!color) {
        toast.error('Không tìm thấy thông tin màu sắc');
        return;
      }

      const stockResponse = await axiosInstance.get(`/api/product-size-stock/color/${color.colorID}`);
      const sizeStock = stockResponse.data.find(item => item.size === selectedSize);

      if (!sizeStock) {
        toast.error('Không tìm thấy thông tin tồn kho');
        return;
      }

      // Sử dụng SKU có sẵn từ API response thay vì tạo mới
      const SKU = sizeStock.SKU || `${product.productID}_${color.colorID}_${selectedSize}_${sizeStock.sizeStockID}`;
      console.log('Toggle favorite for SKU:', SKU, '(from API:', sizeStock.SKU ? 'yes' : 'no, generated)');

      if (isFavorite) {
        // Nếu đã yêu thích thì xóa - URL encode SKU để tránh lỗi với ký tự đặc biệt
        const encodedSKU = encodeURIComponent(SKU);
        const response = await axiosInstance.delete(`/api/favorite/${encodedSKU}`);
        if (response.status === 200) {
          toast.success('Đã xóa khỏi danh sách yêu thích');
          window.dispatchEvent(new Event('wishlistChange'));
          setIsFavorite(false);
        }
      } else {
        // Nếu chưa yêu thích thì thêm
        console.log('📤 Sending POST to /api/favorite/add with SKU:', SKU);
        const response = await axiosInstance.post('/api/favorite/add', { SKU });
        console.log('📥 Response from /api/favorite/add:', response);
        if (response.status === 201) {
          toast.success('Đã thêm vào danh sách yêu thích');
          window.dispatchEvent(new Event('wishlistChange'));
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error('Lỗi khi toggle favorite:', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn');
        localStorage.removeItem('customerToken');
        sessionStorage.removeItem('customerToken');
        navigate('/login');
      } else if (error.response?.status === 400) {
        toast.error(error.response?.data?.message || 'Sản phẩm đã có trong danh sách yêu thích');
      } else if (error.response?.status === 404) {
        toast.error(error.response?.data?.message || 'Không tìm thấy sản phẩm');
      } else {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thao tác với danh sách yêu thích');
      }
    }
  };

  // Hàm cập nhật đánh giá
  const handleUpdateReview = async (reviewID) => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        toast.error('Vui lòng đăng nhập để đánh giá sản phẩm');
        navigate('/login');
        return;
      }

      const response = await axiosInstance.put(`/api/reviews/${reviewID}`, {
        rating: editingReview.rating,
        comment: editingReview.comment
      });

      if (response.status === 200) {
        // Cập nhật lại danh sách đánh giá
        const updatedReviews = reviews.map(review =>
          review.reviewID === reviewID
            ? {
                ...review,
                rating: editingReview.rating,
                comment: editingReview.comment
              }
            : review
        );
        setReviews(updatedReviews);

        // Tính toán lại thống kê đánh giá
        const newStats = {
          averageRating: 0,
          totalReviews: updatedReviews.length,
          ratingCounts: {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0
          }
        };

        // Tính lại số lượng mỗi loại đánh giá và điểm trung bình
        updatedReviews.forEach(review => {
          newStats.averageRating += review.rating;
          newStats.ratingCounts[review.rating]++;
        });

        // Tính lại điểm trung bình và làm tròn đến 1 chữ số thập phân
        newStats.averageRating = newStats.totalReviews > 0
          ? Math.round((newStats.averageRating / newStats.totalReviews) * 10) / 10
          : 0;

        setReviewStats(newStats);
        setEditingReview({ id: null, rating: 5, comment: '' }); // Reset trạng thái chỉnh sửa
        toast.success('Cập nhật đánh giá thành công');
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật đánh giá:', error);
      if (error.response?.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn');
        localStorage.removeItem('customerToken');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Không thể cập nhật đánh giá');
      }
    }
  };

  // Trạng thái loading
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'tet' ? 'bg-red-50' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className={`inline-block w-16 h-16 rounded-full border-4 border-t-transparent animate-spin ${theme === 'tet' ? 'border-red-500' : 'border-blue-500'}`}></div>
          <p className={`mt-4 text-lg font-medium ${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`}>
            Đang tải sản phẩm...
          </p>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo nếu không tìm thấy sản phẩm
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Không tìm thấy sản phẩm</div>
      </div>
    );
  }

  // Hiển thị nội dung sản phẩm
  return (
    <div className={`min-h-screen ${theme === 'tet' ? 'bg-gray-50' : 'bg-gray-50'}`}>
      {/* Thay thế breadcrumb bằng PageBanner */}
      <PageBanner
        icon={FaTshirt}
        title={product.name}
        subtitle={
          product.promotion 
            ? `Giảm giá ${product.promotion.discountPercent}% - Còn ${formatPrice(product.promotion.discountedPrice)}đ` 
            : `${formatPrice(product.price)}đ`
        }
        extraContent={
          <div className="mt-6 flex flex-wrap items-center gap-4">
            {/* Số lượng đã bán */}
            <div className={`px-4 py-2 rounded-full ${
              theme === 'tet' 
                ? 'bg-red-500/20 text-yellow-300' 
                : 'bg-blue-500/20 text-blue-200'
            }`}>
              <span className="text-sm font-medium">
                Đã bán: {product.soldCount || 0}
              </span>
            </div>

            {/* Số lượng màu sắc */}
            <div className={`px-4 py-2 rounded-full ${
              theme === 'tet' 
                ? 'bg-red-500/20 text-yellow-300' 
                : 'bg-blue-500/20 text-blue-200'
            }`}>
              <span className="text-sm font-medium">
                {product.availableColors.length} màu sắc
              </span>
            </div>

            {/* Số lượng kích thước */}
            <div className={`px-4 py-2 rounded-full ${
              theme === 'tet' 
                ? 'bg-red-500/20 text-yellow-300' 
                : 'bg-blue-500/20 text-blue-200'
            }`}>
              <span className="text-sm font-medium">
                {product.availableSizes.length} kích thước
              </span>
            </div>

            {/* Rating trung bình */}
            <div className={`px-4 py-2 rounded-full ${
              theme === 'tet' 
                ? 'bg-yellow-500/20 text-yellow-300' 
                : 'bg-green-500/20 text-green-200'
            }`}>
              <span className="text-sm font-medium flex items-center gap-1">
                <FaStar className="inline-block" />
                {reviewStats.averageRating.toFixed(1)} ({reviewStats.totalReviews} đánh giá)
              </span>
            </div>
          </div>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ảnh và thông tin sản phẩm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Ảnh */}
          <div className="relative">
            {/* Swiper chính */}
            <Swiper
              modules={[Navigation, Pagination, Autoplay, Thumbs, EffectFade]}
              effect="fade"
              speed={800}
              navigation={{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
              }}

              // Phân trang
              pagination={{
                el: '.swiper-pagination',
                type: 'bullets',
                clickable: true,
                dynamicBullets: true,
              }}

              // Tự động chuyển ảnh
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
                pauseOnMouseEnter: false,
              }}

              // Lặp lại ảnh
              loop={true}
              thumbs={{ swiper: thumbsSwiper }}
              className={`product-main-swiper h-[500px] rounded-2xl overflow-hidden mb-4 group ${theme === 'tet' ? 'ring-2 ring-red-200' : 'ring-1 ring-gray-200'}`}
            >
              {getSelectedColorImages().map((image, index) => (
                <SwiperSlide key={index}>
                  <div className="relative w-full h-full">
                    <img
                      src={image}
                      alt={`${product.name} - ${selectedColor}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 ${theme === 'tet' ? 'bg-gradient-to-b from-transparent to-red-900/20' : 'bg-gradient-to-b from-transparent to-black/20'}`}></div>
                  </div>
                </SwiperSlide>
              ))}

              {/* Nút điều hướng tùy chỉnh */}
              <div className={`swiper-button-prev after:!text-base !w-10 !h-10 !backdrop-blur-sm ${theme === 'tet' ? '!bg-red-500/20 hover:!bg-red-500/30' : '!bg-white/20 hover:!bg-white/30'} !rounded-full -translate-x-4 opacity-0 group-hover:opacity-100 transition-all duration-300 !left-4`}></div>
              <div className={`swiper-button-next after:!text-base !w-10 !h-10 !backdrop-blur-sm ${theme === 'tet' ? '!bg-red-500/20 hover:!bg-red-500/30' : '!bg-white/20 hover:!bg-white/30'} !rounded-full translate-x-4 opacity-0 group-hover:opacity-100 transition-all duration-300 !right-4`}></div>

              {/* Phân trang tùy chỉnh */}
              <div className="swiper-pagination !bottom-4"></div>
            </Swiper>

            {/* Swiper thumbnails */}
            <div className="px-2">
              <Swiper
                onSwiper={setThumbsSwiper}
                modules={[Navigation, Thumbs]}
                spaceBetween={16}
                slidesPerView={4}
                watchSlidesProgress
                className="thumbs-swiper mt-4"
              >
                {getSelectedColorImages().map((image, index) => (
                  <SwiperSlide key={index}>
                    <div className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${theme === 'tet' ? 'hover:ring-2 hover:ring-red-500' : 'hover:ring-2 hover:ring-gray-500'} h-24`}>
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover hover:opacity-75 transition-all duration-300"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          {/* Thông tin sản phẩm */}
          <div className="space-y-6">
            <h1 className={`text-3xl font-medium ${theme === 'tet' ? 'text-red-600' : 'text-gray-900'}`}>{product.name}</h1>

            {/* Giá và khuyến mãi */}
            <div className="space-y-2">
              <div className={`p-4 rounded-lg ${
                theme === 'tet' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                {product.promotion ? (
                  <>
                    {/* Giá gốc */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <span className="text-gray-600 min-w-[100px]">Giá gốc:</span>
                        <span className="text-xl text-gray-500 line-through">
                          {formatPrice(product.price)}đ
                        </span>
                      </div>

                      {/* Giá khuyến mãi */}
                      <div className="flex items-center">
                        <span className="text-gray-600 min-w-[100px]">Giá ưu đãi:</span>
                        <span className={`text-2xl font-bold ${
                          theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {formatPrice(product.promotion.discountedPrice)}đ
                        </span>
                      </div>

                      {/* Tiết kiệm */}
                      <div className="flex items-center">
                        <span className="text-gray-600 min-w-[100px]">Tiết kiệm:</span>
                        <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${
                          theme === 'tet' ? 'bg-red-500' : 'bg-blue-500'
                        }`}>
                          {formatPrice((product.price - product.promotion.discountedPrice))}đ
                        </span>
                      </div>
                    </div>

                    {/* Hiển thị thông tin khuyến mãi */}
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className={`font-medium ${
                        theme === 'tet' ? 'text-red-700' : 'text-blue-700'
                      }`}>
                        {product.promotion.name}
                      </p>
                      <p className={`text-sm mt-1 ${
                        theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {product.promotion.description}
                      </p>
                      <p className={`text-sm mt-1 ${
                        theme === 'tet' ? 'text-red-500' : 'text-blue-500'
                      }`}>
                        Kết thúc: {new Date(product.promotion.endDate).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center">
                    <span className="text-gray-600 min-w-[100px]">Giá bán:</span>
                    <span className={`text-2xl font-bold ${
                      theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {formatPrice(product.price)}đ
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Chọn kích thước */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Kích thước</h3>
              <div className="grid grid-cols-4 gap-4">
                {product.availableSizes.map((size) => {
                  const isAvailable = isSizeAvailable(size);
                  return (
                    <button
                      key={size}
                      onClick={() => isAvailable && setSelectedSize(size)}
                      disabled={!isAvailable}
                      className={`py-2 text-center rounded-md relative transition-all ${
                        !isAvailable
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                          : selectedSize === size
                          ? `${theme === 'tet' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`
                          : `${theme === 'tet' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-200 text-gray-900 hover:bg-gray-300'}`
                      }`}
                    >
                      <span className={!isAvailable ? 'line-through' : ''}>{size}</span>
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-gray-400 rotate-[-20deg]"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {/* Thông báo về size đặc biệt */}
              <div className={`mt-3 p-3 rounded-lg ${theme === 'tet' ? 'bg-red-50/80' : 'bg-blue-50/80'} border ${theme === 'tet' ? 'border-red-100' : 'border-blue-100'}`}>
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 p-1 rounded-full ${theme === 'tet' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    <FaInfoCircle className={`w-3 h-3 ${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`} />
                  </div>
                  <div>
                    <p className={`text-sm ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'} font-medium`}>
                      Cần size XL, XXL?
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Shop có thể đặt may riêng theo số đo của bạn. Liên hệ ngay:
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <a
                        href="tel:1900xxxx"
                        className={`text-xs flex items-center gap-1 ${theme === 'tet' ? 'text-red-600 hover:text-red-700' : 'text-blue-600 hover:text-blue-700'}`}
                      >
                        <FaPhoneAlt className="w-3 h-3" />
                        <span>1900 xxxx</span>
                      </a>
                      <a
                        href="https://m.me/TVTstore"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs flex items-center gap-1 ${theme === 'tet' ? 'text-red-600 hover:text-red-700' : 'text-blue-600 hover:text-blue-700'}`}
                      >
                        <FaFacebookMessenger className="w-3 h-3" />
                        <span>Nhắn tin</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chọn màu sắc */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Màu sắc</h3>
              <div className="flex flex-wrap gap-2">
                {product.availableColors.map((color) => {
                  // Lấy thông tin màu sắc từ utils
                  const colorCode = getColorCode(color);
                  const isPattern = isPatternOrStripe(color);
                  const bgSize = getBackgroundSize(color);
                  const isAvailable = isColorAvailable(color);

                  // Hiển thị màu sắc
                  return (
                    <span key={color}
                      className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                        ${!isAvailable
                          ? 'opacity-50 cursor-not-allowed'
                          : selectedColor === color
                          ? theme === 'tet'
                            ? 'ring-2 ring-red-500'
                            : 'ring-2 ring-blue-500'
                          : 'hover:ring-1 hover:ring-gray-300 cursor-pointer'
                        } 
                        transition-all relative group`}
                      onClick={() => isAvailable && setSelectedColor(color)}
                      style={{
                        // Áp dụng màu nền hoặc pattern
                        background: colorCode,
                        backgroundSize: bgSize,
                        // Điều chỉnh màu chữ tùy theo màu nền
                        color: isPattern ? 'inherit' : (color === 'Trắng' || color === 'Trắng ngà' || color.includes('nhạt')) ? '#000' : '#fff',
                        // Thêm viền cho màu trắng để dễ nhìn
                        borderColor: color === 'Trắng' || color === 'Trắng ngà' ? '#e5e7eb' : 'transparent',
                        borderWidth: color === 'Trắng' || color === 'Trắng ngà' ? '1px' : '0',
                      }}
                    >
                      {/* Tooltip hiển thị tên màu khi hover */}
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-normal text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {color} {!isAvailable && '(Hết hàng)'}
                      </span>
                      {/* Tên màu */}
                      <span className={`${isPattern ? 'text-gray-700' : ''} ${!isAvailable ? 'line-through' : ''}`}>
                        {color}
                      </span>
                      {/* Dấu gạch chéo cho màu hết hàng */}
                      {!isAvailable && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="w-full h-0.5 bg-gray-500 rotate-[-20deg]"></div>
                        </div>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Số lượng */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Số lượng</h3>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className={` h-10 rounded-full border border-gray-300 flex items-center justify-center ${quantity <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                    } ${theme === 'tet' ? 'text-red-600' : 'text-gray-900'}`}
                >
                  <FaMinus className="w-3 h-3" />
                </button>
                <span className="text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(getStockForSelectedOptions(), quantity + 1))}
                  disabled={quantity >= getStockForSelectedOptions()}
                  className={` h-10 rounded-full border border-gray-300 flex items-center justify-center ${quantity >= getStockForSelectedOptions() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                    } ${theme === 'tet' ? 'text-red-600' : 'text-gray-900'}`}
                >
                  <FaPlus className="w-3 h-3" />
                </button>
                <span className="text-sm text-gray-500">
                  Còn {getStockForSelectedOptions()} sản phẩm
                </span>
              </div>
            </div>

            {/* Thêm vào giỏ hàng và yêu thích */}
            <div className="grid grid-cols-2 gap-4">
              <button
                disabled={!selectedSize || !selectedColor || getStockForSelectedOptions() === 0}
                onClick={handleAddToCart}
                className={`flex items-center justify-center w-full px-6 lg:px-6 py-3 lg:py-3 text-sm lg:text-base rounded-full transition-all duration-300 ${!selectedSize || !selectedColor || getStockForSelectedOptions() === 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : theme === 'tet'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                <FaShoppingCart className="mr-2 text-base sm:text-sm md:text-base lg:text-lg" />
                Thêm vào giỏ
              </button>
              <button
                disabled={!selectedSize || !selectedColor}
                onClick={handleToggleFavorite}
                className={`flex items-center justify-center w-full px-6 lg:px-6 py-3 lg:py-3 text-sm lg:text-base rounded-full transition-all duration-300 ${!selectedSize || !selectedColor
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isFavorite
                      ? theme === 'tet'
                        ? 'bg-red-100 text-red-600 hover:bg-red-200'
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                      : theme === 'tet'
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {isFavorite ? (
                  <>
                    <FaHeart className="mr-2 text-base lg:text-lg" />
                    Đã yêu thích
                  </>
                ) : (
                  <>
                    <FaRegHeart className="mr-2 text-base lg:text-lg" />
                    Thêm vào yêu thích
                  </>
                )}
              </button>
            </div>

            {/* Combo Box Thu Nhỏ - Hiển thị combo sản phẩm */}
            {showCombo && comboProduct && !comboLoading && (
              <div 
                onClick={handleOpenComboModal}
                className={`mt-6 border-2 rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg ${
                  theme === 'tet' 
                    ? 'border-red-200 bg-red-50 hover:border-red-400' 
                    : 'border-blue-200 bg-blue-50 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-bold flex items-center ${
                    theme === 'tet' ? 'text-red-700' : 'text-blue-700'
                  }`}>
                    <FaTag className="mr-2" />
                    Mua Combo Tiết Kiệm
                  </h3>
                  {calculateComboPrice() && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      theme === 'tet'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      Giảm {calculateComboPrice().discountPercent}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  {/* Sản phẩm hiện tại */}
                  <div className="bg-white rounded-lg p-2">
                    <img 
                      src={product.thumbnail || '/placeholder-product.png'} 
                      alt={product.name}
                      className="w-full h-24 object-cover rounded mb-1"
                    />
                    <h4 className="text-xs font-medium line-clamp-1">{product.name}</h4>
                  </div>

                  {/* Sản phẩm combo */}
                  <div className="bg-white rounded-lg p-2">
                    <img 
                      src={comboProduct.thumbnail || '/placeholder-product.png'} 
                      alt={comboProduct.name}
                      className="w-full h-24 object-cover rounded mb-1"
                    />
                    <h4 className="text-xs font-medium line-clamp-1">{comboProduct.name}</h4>
                  </div>
                </div>

                {/* Thông tin giá combo */}
                {calculateComboPrice() && (
                  <div className="bg-white rounded-lg p-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-bold">Giá combo:</span>
                      <span className={`text-lg font-bold ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                        {calculateComboPrice().finalPrice.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                    <p className="text-xs text-green-600 text-center mt-1">
                      ⭐ Tiết kiệm {calculateComboPrice().savings.toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                )}

                <p className={`text-sm text-center mt-3 font-medium ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                  👆 Nhấn để chọn màu & size cho combo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`relative py-4 text-sm font-medium transition-colors duration-200
                  ${activeTab === 'description'
                    ? theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Mô tả sản phẩm
                <span className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors duration-200
                  ${activeTab === 'description'
                    ? theme === 'tet' ? 'bg-red-600' : 'bg-blue-600'
                    : 'bg-transparent'
                  }`}
                ></span>
              </button>

              {/* Nút chọn tab đánh giá */}
              <button
                onClick={() => setActiveTab('reviews')}
                className={`relative py-4 text-sm font-medium transition-colors duration-200
                  ${activeTab === 'reviews'
                    ? theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <span>Đánh giá</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full 
                    ${theme === 'tet'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {reviewStats.averageRating.toFixed(1)}
                  </span>
                </div>
                <span className={`absolute bottom-0 left-0 w-full h-0.5 transition-colors duration-200
                  ${activeTab === 'reviews'
                    ? theme === 'tet' ? 'bg-red-600' : 'bg-blue-600'
                    : 'bg-transparent'
                  }`}
                ></span>
              </button>
            </div>
          </div>
        </div>

        {/* Nội dung tab */}
        {activeTab === 'description' ? (
          <>
            {/* Quick View Section */}
            <div className="mb-8">
              {/* Thanh trạng thái */}
              <div className="flex flex-col md:flex-row items-center justify-between mb-6 bg-gray-50/70 p-4 rounded-lg">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                    ${product.totalStock > 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'}`}
                  >
                    <span className={`w-2 h-2 rounded-full mr-2 ${product.totalStock > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    {product.totalStock > 0 ? 'Còn hàng' : 'Hết hàng'}
                  </div>
                  <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium
                    ${theme === 'tet' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}
                  >
                    <FaTag className="h-4 w-4 mr-1.5" />
                    {product.category}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-gray-500">
                    <FaEye className="h-5 w-5 mr-1.5" />
                    <span className="text-sm">Đã xem: {product.views || 0}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <FaMedal className="h-5 w-5 mr-1.5" />
                    <span className="text-sm">Đã bán: {product.sold || 0}</span>
                  </div>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Key Features */}
                <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${theme === 'tet' ? 'bg-red-50' : 'bg-blue-50'}`}>
                      <FaBolt className={`h-5 w-5 ${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <h4 className="font-medium text-gray-900">Đặc điểm nổi bật</h4>
                  </div>

                  {/* Hiển thị 3 đặc điểm nổi bật */}
                  <div className="space-y-3">
                    {product.description
                      ?.split('\n')
                      .filter(line => !line.includes('Chi tiết bảo quản sản phẩm') && !line.includes('Thông tin mẫu') && line.trim())
                      .slice(0, 3)
                      .map((line, index) => (
                        <div key={index} className="flex items-start group">
                          <span className={`w-1.5 h-1.5 rounded-full mt-2 mr-3 ${theme === 'tet' ? 'bg-red-400' : 'bg-blue-400'}`} />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                            {line.trim().replace(/^-\s*/, '')}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${theme === 'tet' ? 'bg-red-50' : 'bg-blue-50'}`}>
                      <FaRuler className={`h-5 w-5 ${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <h4 className="font-medium text-gray-900">Kích thước có sẵn</h4>
                  </div>

                  {/* Hiển thị các kích thước có sẵn */}
                  <div className="flex flex-wrap gap-2">
                    {product.availableSizes
                      .sort((a, b) => {
                        const order = { S: 1, M: 2, L: 3, XL: 4, XXL: 5 };
                        return order[a] - order[b];
                      })
                      .map((size) => (
                        <span key={size}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border-2 text-sm font-medium
                            ${selectedSize === size
                              ? theme === 'tet'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            } 
                            transition-all cursor-pointer`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Colors */}
                <div className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className={`p-2 rounded-lg ${theme === 'tet' ? 'bg-red-50' : 'bg-blue-50'}`}>
                      <FaPalette className={`h-5 w-5 ${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <h4 className="font-medium text-gray-900">Màu sắc có sẵn</h4>
                  </div>

                  {/* Hiển thị các màu sắc có sẵn */}
                  <div className="flex flex-wrap gap-2">
                    {product.availableColors.map((color) => (
                      <span key={color}
                        className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium
                          ${selectedColor === color
                            ? theme === 'tet'
                              ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                              : 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          } 
                          transition-all cursor-pointer`}
                        onClick={() => setSelectedColor(color)}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Các phần mở rộng */}
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'details' ? null : 'details')}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between ${expandedSection === 'details' ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                >
                  <span className="font-medium flex items-center">
                    <FaInfoCircle className={`h-4 w-4 mr-2 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`} />
                    Chi tiết sản phẩm
                  </span>
                  <FaChevronDown
                    className={`w-4 h-4 transform transition-transform ${expandedSection === 'details' ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Chi tiết sản phẩm */}
                {expandedSection === 'details' && (
                  <div className="p-4 border-t">
                    <div className="prose max-w-none">
                      <div className="space-y-6">
                        {/* Đặc điểm chi tiết */}
                        <div>
                          <h4 className={`text-base font-medium mb-3 ${theme === 'tet' ? 'text-red-600' : 'text-gray-900'}`}>
                            Đặc điểm chi tiết
                          </h4>
                          <div className="space-y-2">
                            {product.description
                              ?.split('\n')
                              .filter(line => !line.includes('Chi tiết bảo quản sản phẩm') && !line.includes('Thông tin mẫu') && line.trim())
                              .map((line, index) => (
                                <div key={index} className="flex items-start group">
                                  <span className={`w-1.5 h-1.5 rounded-full mt-2 mr-3 ${theme === 'tet' ? 'bg-red-400' : 'bg-blue-400'}`} />
                                  <span className="text-gray-600">{line.trim().replace(/^-\s*/, '')}</span>
                                </div>
                              ))}
                          </div>
                        </div>

                        {/* Thông tin người mẫu */}
                        <div>
                          <h4 className={`text-base font-medium mb-3 ${theme === 'tet' ? 'text-red-600' : 'text-gray-900'}`}>
                            Thông tin người mẫu
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            {product.description
                              ?.split('Thông tin mẫu:')[1]
                              ?.split('Chi tiết bảo quản sản phẩm')[0]
                              .split('\n')
                              .filter(line => line.trim())
                              .map((line, index) => {
                                const [label, value] = line.split(':').map(part => part.trim());
                                return (
                                  <div key={index} className="flex items-center space-x-2">
                                    <span className="text-gray-500">{label}:</span>
                                    <span className="font-medium text-gray-900">{value}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Bảng size chi tiết */}
                        <div>
                          <h4 className={`text-base font-medium mb-3 ${theme === 'tet' ? 'text-red-600' : 'text-gray-900'}`}>
                            Bảng size chi tiết
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chiều cao (cm)</th>
                                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cân nặng (kg)</th>
                                  <th className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vòng ngực (cm)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 text-sm font-medium text-gray-900">S</td>
                                  <td className="py-4 text-sm text-gray-600">150-160</td>
                                  <td className="py-4 text-sm text-gray-600">45-50</td>
                                  <td className="py-4 text-sm text-gray-600">85-90</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 text-sm font-medium text-gray-900">M</td>
                                  <td className="py-4 text-sm text-gray-600">160-165</td>
                                  <td className="py-4 text-sm text-gray-600">50-55</td>
                                  <td className="py-4 text-sm text-gray-600">90-95</td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 text-sm font-medium text-gray-900">L</td>
                                  <td className="py-4 text-sm text-gray-600">165-170</td>
                                  <td className="py-4 text-sm text-gray-600">55-60</td>
                                  <td className="py-4 text-sm text-gray-600">95-100</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-4 space-y-2">
                            <p className="text-sm text-gray-500 italic">
                              * Bảng size chỉ mang tính chất tham khảo. Kích thước thực tế có thể thay đổi từ 1-2cm.
                            </p>
                            <div className={`p-4 rounded-lg ${theme === 'tet' ? 'bg-red-50' : 'bg-blue-50'}`}>
                              <p className={`text-sm ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'} font-medium mb-1`}>
                                🎯 Cần đặt size đặc biệt (XL, XXL)?
                              </p>
                              <p className="text-sm text-gray-600">
                                Shop có thể đặt may riêng size XL, XXL theo số đo của bạn. Vui lòng liên hệ với chúng tôi qua:
                              </p>
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <FaPhoneAlt className={`${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`} />
                                  <span>Hotline: 1900 xxxx</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <FaFacebookMessenger className={`${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`} />
                                  <a 
                                    href="https://m.me/TVTstore" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`${theme === 'tet' ? 'text-red-600' : 'text-blue-600'} hover:underline`}
                                  >
                                    Nhắn tin Facebook
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hướng dẫn bảo quản */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'care' ? null : 'care')}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between ${expandedSection === 'care' ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                >
                  <span className="font-medium flex items-center">
                    <FaInfoCircle className={`h-4 w-4 mr-2 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`} />
                    Hướng dẫn bảo quản
                  </span>
                  <FaChevronDown
                    className={`w-4 h-4 transform transition-transform ${expandedSection === 'care' ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Hướng dẫn bảo quản */}
                {expandedSection === 'care' && (
                  <div className="p-4 border-t">
                    <div className="space-y-2">
                      {product.description
                        ?.split('Chi tiết bảo quản sản phẩm :')[1]
                        ?.split('\n')
                        .filter(line => line.trim())
                        .map((line, index) => (
                          <div key={index} className="flex items-start group">
                            <span className={`w-1.5 h-1.5 rounded-full mt-2 mr-3 ${theme === 'tet' ? 'bg-red-400' : 'bg-blue-400'}`} />
                            <span className="text-gray-600">{line.trim().replace(/^\*\s*/, '')}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          // Đánh giá sản phẩm
          <div className="space-y-8">
            {/* Đánh giá sản phẩm */}
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Đánh giá trung bình */}
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{reviewStats.averageRating.toFixed(1)}</div>
                  <div className="flex justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={`w-5 h-5 ${star <= reviewStats.averageRating
                            ? theme === 'tet'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                            : 'text-gray-300'
                          }`}
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-500">
                    {reviewStats.totalReviews} đánh giá
                  </div>
                </div>

                {/* Rating Bars */}
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center">
                      <div className="flex items-center w-24">
                        <span className="text-sm text-gray-600 mr-2">{rating}</span>
                        <FaStar className={`w-4 h-4 ${theme === 'tet' ? 'text-red-400' : 'text-yellow-400'}`} />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${theme === 'tet' ? 'bg-red-400' : 'bg-yellow-400'}`}
                          style={{
                            width: `${reviewStats.totalReviews > 0
                                ? (reviewStats.ratingCounts[rating] / reviewStats.totalReviews) * 100
                                : 0
                              }%`,
                          }}
                        ></div>
                      </div>
                      <span className="w-16 text-right text-sm text-gray-500">
                        {reviewStats.ratingCounts[rating]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Viết đánh giá */}
                <div className="flex flex-col justify-center items-center">
                  {!userReview ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${theme === 'tet'
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      Viết đánh giá
                    </button>
                  ) : (
                    // Đánh giá đã có
                    <div className="text-center">
                      <p className="text-gray-500 mb-2">Bạn đã đánh giá sản phẩm này</p>
                      
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form đánh giá */}
            {showReviewForm && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <form onSubmit={handleSubmitReview} className="space-y-6">
                  {/* Tiêu đề */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900">Đánh giá sản phẩm</h3>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FaTimes className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Đánh giá sao */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Bạn thấy sản phẩm này như thế nào?
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                            star <= newReview.rating 
                              ? theme === 'tet'
                                ? 'text-red-400 hover:text-red-500'
                                : 'text-yellow-400 hover:text-yellow-500'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        >
                          <FaStar className="w-8 h-8" />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-500">
                        ({newReview.rating} sao)
                      </span>
                    </div>
                  </div>

                  {/* Nhận xét */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Chia sẻ nhận xét của bạn
                    </label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      placeholder="Hãy chia sẻ những điều bạn thích về sản phẩm này..."
                      minLength={10}
                      maxLength={1000}
                      required
                    />
                    <div className="mt-2 flex justify-between items-center text-sm text-gray-500">
                      <span>Tối thiểu 10 ký tự</span>
                      <span>{newReview.comment.length}/1000</span>
                    </div>
                  </div>

                  {/* Nút gửi */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-6 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all duration-300 ${
                        theme === 'tet'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Gửi đánh giá
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Danh sách đánh giá */}
            {reviewsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : reviews.length > 0 ? (
              // Danh sách đánh giá
              <div className="space-y-6">
                {reviews.map((review) => {
                  // Lấy userID từ localStorage
                  const currentUserID = localStorage.getItem('customerInfo') 
                    ? JSON.parse(localStorage.getItem('customerInfo')).userID 
                    : null;
                  
                  // Kiểm tra xem đây có phải review của user hiện tại không
                  const isCurrentUserReview = currentUserID === review.userInfo?.userID;

                  return (
                    <div key={review.reviewID} className="bg-white p-6 rounded-xl shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-4">
                          {/* Avatar */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                            theme === 'tet' ? 'bg-red-500' : 'bg-blue-500'
                          }`}>
                            {review.userInfo?.fullName?.charAt(0).toUpperCase() || 'U'}
                          </div>

                          <div className="flex-1">
                            {/* User Info */}
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{review.userInfo?.fullName || 'Người dùng ẩn danh'}</span>
                              {isCurrentUserReview && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  theme === 'tet'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-blue-100 text-blue-600'
                                }`}>
                                  Đánh giá của bạn
                                </span>
                              )}
                            </div>

                            {/* Đánh giá */}
                            <div className="flex items-center space-x-1 mt-1">
                              {editingReview.id === review.reviewID ? (
                                <div className="mt-4 bg-gray-50/80 rounded-lg p-4 border border-gray-100">
                                  <div className="space-y-4">
                                    {/* Rating stars */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Đánh giá của bạn
                                      </label>
                                      <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setEditingReview({
                                              ...editingReview,
                                              rating: star
                                            })}
                                            className={`p-2 rounded-full transition-all duration-200 hover:scale-110 ${
                                              star <= editingReview.rating
                                                ? theme === 'tet'
                                                  ? 'text-red-400 hover:text-red-500'
                                                  : 'text-yellow-400 hover:text-yellow-500'
                                                : 'text-gray-300 hover:text-gray-400'
                                            }`}
                                          >
                                            <FaStar className="w-6 h-6" />
                                          </button>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-500">
                                          ({editingReview.rating} sao)
                                        </span>
                                      </div>
                                    </div>

                                    {/* Nhận xét */}
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nhận xét của bạn
                                      </label>
                                      <textarea
                                        value={editingReview.comment}
                                        onChange={(e) => setEditingReview({
                                          ...editingReview,
                                          comment: e.target.value
                                        })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        rows="3"
                                        placeholder="Chia sẻ cảm nhận của bạn về sản phẩm..."
                                        minLength={10}
                                        maxLength={1000}
                                      />
                                      <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
                                        <span>Tối thiểu 10 ký tự</span>
                                        <span>{editingReview.comment.length}/1000</span>
                                      </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setEditingReview({ id: null, rating: 5, comment: 'hi' })}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors duration-200 ${
                                          theme === 'tet'
                                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                                            : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        onClick={() => handleUpdateReview(review.reviewID)}
                                        className={`px-6 py-2 rounded-full text-sm font-medium text-white transition-all duration-300 ${
                                          theme === 'tet'
                                            ? 'bg-red-600 hover:bg-red-700'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                      >
                                        Lưu thay đổi
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 mt-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <FaStar
                                      key={star}
                                      className={`w-4 h-4 ${
                                        star <= review.rating
                                          ? theme === 'tet'
                                            ? 'text-red-400'
                                            : 'text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm text-gray-500 ml-2">
                                    {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Hiển thị nội dung comment */}
                            {editingReview.id !== review.reviewID && (
                              <div className="mt-3">
                                <p className="text-gray-700 whitespace-pre-line">
                                  {review.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        {isCurrentUserReview && editingReview.id !== review.reviewID && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingReview({
                                id: review.reviewID,
                                rating: review.rating,
                                comment: review.comment
                              })}
                              className={`p-2 rounded-full transition-colors duration-200 ${
                                theme === 'tet'
                                  ? 'hover:bg-red-50 text-red-600'
                                  : 'hover:bg-blue-50 text-blue600'
                              }`}
                            >
                              <FaEdit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteReview(review.reviewID)}
                              className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-colors duration-200"
                            >
                              <FaTrash className="h-5 w-5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">Chưa có đánh giá nào cho sản phẩm này</div>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                    theme === 'tet'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  Hãy là người đầu tiên đánh giá
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section Sản phẩm tương tự - CoHUI Recommendations với Fallback - IMPROVED */}
      {similarProducts.length > 0 && (
        <RecommendationCarousel
          products={similarProducts.map(item => {
            const prod = item.productDetails || item;
            return {
              productID: prod.productID,
              name: prod.name,
              price: prod.price,
              thumbnail: prod.thumbnail || prod.image || prod.images?.[0],
              categoryID: prod.categoryID,
              targetID: prod.targetID,
              avgCorrelation: item.correlation || item.correlationScore || (item.confidence / 100),
              source: item.isFallback ? 'Cùng danh mục' : 'CoIUM',
              isFallback: item.isFallback
            };
          })}
          title={similarProducts[0]?.isFallback ? 'Sản phẩm liên quan' : 'Sản phẩm tương tự'}
          subtitle={
            similarProducts[0]?.isFallback 
              ? 'Sản phẩm cùng danh mục với giá tương đương'
              : 'Các sản phẩm thường được mua cùng nhau • Được đề xuất bởi thuật toán CoIUM'
          }
          icon={similarProducts[0]?.isFallback ? FaTshirt : FaFire}
          loading={similarLoading}
          showCorrelation={!similarProducts[0]?.isFallback}
          minSlides={5}
        />
      )}

      {/* Modal Combo - Phóng to để chọn màu và size */}
      {showComboModal && (
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
                onClick={() => {
                  setShowComboModal(false);
                  // Reset state combo khi đóng modal
                  setProductFull(null);
                  setComboProductFull(null);
                  setComboSelectedColor(null);
                  setComboSelectedSize('');
                  
                  // Tự động chọn lại màu đầu tiên của sản phẩm chính
                  if (product?.availableColors && product.availableColors.length > 0) {
                    setSelectedColor(product.availableColors[0]);
                  }
                  // Tự động chọn lại size đầu tiên
                  if (product?.availableSizes && product.availableSizes.length > 0) {
                    setSelectedSize(product.availableSizes[0]);
                  }
                }}
                className="p-2 hover:bg-gray-200 rounded-full transition"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* Loading State or Content */}
            {!productFull || !comboProductFull ? (
              <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className={`animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4 ${
                    theme === 'tet' ? 'border-red-600' : 'border-blue-600'
                  }`}></div>
                  <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
                </div>
              </div>
            ) : (
              /* Content */
              <div className="p-6">
                {/* Discount Badge */}
                {calculateComboPrice() && (
                  <div className={`text-center mb-4 p-3 rounded-lg ${
                    theme === 'tet' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <span className={`text-2xl font-bold ${
                      theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      🎉 Giảm {calculateComboPrice().discountPercent}% - Tiết kiệm {calculateComboPrice().savings.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sản phẩm 1 - Sản phẩm hiện tại */}
                  <div className="border rounded-xl p-4">
                    <h3 
                      onClick={() => navigate(`/product/${product.productID}`)}
                      className="text-lg font-bold mb-3 cursor-pointer hover:text-blue-600 transition"
                    >
                      Sản phẩm 1: {product.name}
                    </h3>
                    <img 
                      src={product.thumbnail} 
                      alt={product.name}
                      onClick={() => navigate(`/product/${product.productID}`)}
                      className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition"
                    />
                    <p className={`text-xl font-bold mb-2 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                      {(product.finalPrice || product.price).toLocaleString('vi-VN')}đ
                    </p>
                  
                    {/* Chọn màu */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium mb-2">Chọn màu sắc:</label>
                      <div className="flex flex-wrap gap-2">
                        {productFull?.colors?.filter(color => color && color.colorName).map((color) => (
                          <button
                            key={color.colorID}
                            onClick={() => {
                              setSelectedColor(color);
                              setSelectedSize(''); // Reset size khi đổi màu
                            }}
                            className={`relative group`}
                            title={color.colorName}
                          >
                            <div
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                selectedColor?.colorID === color.colorID
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
                            {selectedColor?.colorID === color.colorID && (
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
                    {selectedColor && (
                      <div>
                        <label className="block text-sm font-medium mb-2">Chọn kích thước:</label>
                        <div className="flex flex-wrap gap-2">
                          {selectedColor.sizes?.map((sizeObj) => (
                            <button
                              key={sizeObj.size}
                              onClick={() => setSelectedSize(sizeObj.size)}
                              disabled={sizeObj.stock === 0}
                              className={`px-4 py-2 rounded-lg font-medium border-2 transition-all ${
                                sizeObj.stock === 0
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : selectedSize === sizeObj.size
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

                {/* Sản phẩm 2 - Sản phẩm combo */}
                <div className="border rounded-xl p-4">
                  <h3 
                    onClick={() => navigate(`/product/${comboProduct.productID}`)}
                    className="text-lg font-bold mb-3 cursor-pointer hover:text-blue-600 transition"
                  >
                    Sản phẩm 2: {comboProduct.name}
                  </h3>
                  <img 
                    src={comboProduct.thumbnail} 
                    alt={comboProduct.name}
                    onClick={() => navigate(`/product/${comboProduct.productID}`)}
                    className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80 transition"
                  />
                  <p className={`text-xl font-bold mb-2 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                    {(comboProduct.finalPrice || comboProduct.price).toLocaleString('vi-VN')}đ
                  </p>

                  {/* Chọn màu */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">Chọn màu sắc:</label>
                    <div className="flex flex-wrap gap-2">
                      {comboProductFull.colors?.filter(color => color && color.colorName).map((color) => (
                        <button
                          key={color.colorID}
                          onClick={() => {
                            setComboSelectedColor(color);
                            setComboSelectedSize(''); // Reset size khi đổi màu
                          }}
                          className={`relative group`}
                          title={color.colorName}
                        >
                          <div
                            className={`w-10 h-10 rounded-full border-2 transition-all ${
                              comboSelectedColor?.colorID === color.colorID
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
                          {comboSelectedColor?.colorID === color.colorID && (
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
                  {comboSelectedColor && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Chọn kích thước:</label>
                      <div className="flex flex-wrap gap-2">
                        {comboSelectedColor.sizes?.map((sizeObj) => (
                          <button
                            key={sizeObj.size}
                            onClick={() => setComboSelectedSize(sizeObj.size)}
                            disabled={sizeObj.stock === 0}
                            className={`px-4 py-2 rounded-lg font-medium border-2 transition-all ${
                              sizeObj.stock === 0
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : comboSelectedSize === sizeObj.size
                                  ? theme === 'tet'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {sizeObj.size}
                            {sizeObj.stock > 0 && sizeObj.stock < 5 && (
                              <span className="block text-xs">Còn {sizeObj.stock}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tổng giá */}
              {calculateComboPrice() && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Tổng giá gốc:</span>
                    <span className="line-through text-gray-400 text-lg">
                      {calculateComboPrice().originalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Giảm giá ({calculateComboPrice().discountPercent}%):</span>
                    <span className={`text-lg font-bold ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                      -{calculateComboPrice().discountAmount.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200">
                    <span className="text-xl font-bold">Giá combo:</span>
                    <span className={`text-2xl font-bold ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'}`}>
                      {calculateComboPrice().finalPrice.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              )}

              {/* Nút thêm vào giỏ */}
              <button
                onClick={handleAddComboToCart}
                disabled={!selectedSize || !selectedColor || !comboSelectedSize || !comboSelectedColor || addingCombo}
                className={`w-full mt-6 py-4 rounded-full font-bold text-white text-lg transition-all ${
                  !selectedSize || !selectedColor || !comboSelectedSize || !comboSelectedColor || addingCombo
                    ? 'bg-gray-300 cursor-not-allowed'
                    : theme === 'tet'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {addingCombo ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <FaShoppingCart className="inline mr-2" />
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

export default ProductDetail;
