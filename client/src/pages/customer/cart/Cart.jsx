// Cart.jsx - Trang giỏ hàng
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaTrash, FaMinus, FaPlus, FaArrowRight, FaGift, FaTimes, FaChevronRight, FaHome } from 'react-icons/fa';
import { useTheme } from '../../../contexts/CustomerThemeContext';
import PageBanner from '../../../components/PageBanner';
import RecommendationCarousel from '../../../components/RecommendationCarousel';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/axios';

const Cart = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // State management
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [itemQuantities, setItemQuantities] = useState({});
  const [itemSubtotals, setItemSubtotals] = useState({});
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // State cho popup xác nhận xóa
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);

  // State cho popup xác nhận xóa nhiều
  const [showDeleteConfirmMultiple, setShowDeleteConfirmMultiple] = useState(false);

  // State cho Cart Recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Format giá tiền
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Tính tổng tiền các sản phẩm được chọn
  const calculateTotal = () => {
    return Array.from(selectedItems).reduce((total, cartID) => {
      const item = cartItems.find(item => item.cartID === cartID);
      if (!item) return total;
      const price = parseInt(item.price.toString().replace(/\./g, '')) || 0;
      const quantity = itemQuantities[cartID] || item.quantity || 0;
      return total + (price * quantity);
    }, 0);
  };

  // Tính số tiền được giảm giá
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = calculateTotal();

    // Nếu có category được áp dụng, chỉ tính tổng tiền của các sản phẩm thuộc category đó
    // Nếu đạt chuẩn thì tính tổng tiền của các sản phẩm thuộc category đó
    let eligibleTotal = subtotal;
    if (appliedCoupon.appliedCategories && appliedCoupon.appliedCategories.length > 0) {
      eligibleTotal = Array.from(selectedItems).reduce((total, cartID) => {
        const item = cartItems.find(item => item.cartID === cartID);
        if (!item || !appliedCoupon.appliedCategories.includes(item.product.categoryID)) {
          return total;
        }
        const price = parseInt(item.price.toString().replace(/\./g, '')) || 0;
        const quantity = itemQuantities[cartID] || item.quantity || 0;
        return total + (price * quantity);
      }, 0);
    }

    let discount = 0;
    if (appliedCoupon.discountType === 'percentage') {
      discount = Math.floor(eligibleTotal * (appliedCoupon.discountValue / 100));
      // Giới hạn số tiền giảm tối đa
      if (appliedCoupon.maxDiscountAmount) {
        discount = Math.min(discount, appliedCoupon.maxDiscountAmount);
      }
    } else {
      discount = appliedCoupon.discountValue;
    }

    return Math.min(discount, eligibleTotal); // Không giảm quá tổng tiền hợp lệ
  };

  // Tính tổng tiền sau khi áp dụng mã giảm giá
  const calculateFinalTotal = () => {
    const subtotal = calculateTotal();
    if (!appliedCoupon) return subtotal;

    const discount = calculateDiscount();
    return Math.max(subtotal - discount, 0);
  };

  // Tính số lượng sản phẩm được chọn
  const calculateSelectedCount = () => {
    return selectedItems.size;
  };

  // Khởi tạo state khi cartItems thay đổi
  useEffect(() => {
    // Tạo object lưu số lượng và tổng tiền cho mỗi sản phẩm
    const quantities = {};
    const subtotals = {};
    cartItems.forEach(item => {
      quantities[item.cartID] = item.quantity;
      subtotals[item.cartID] = item.quantity * parseInt(item.price.replace(/\./g, ''));
    });
    setItemQuantities(quantities);
    setItemSubtotals(subtotals);
  }, [cartItems]);

  // Fetch dữ liệu giỏ hàng từ server
  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('customerToken');

      // Kiểm tra đăng nhập
      if (!token) {
        navigate('/login');
        return;
      }

      // Gọi API lấy giỏ hàng
      const response = await axiosInstance.get('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Kiểm tra và xử lý dữ liệu trả về
      if (response.data.items && Array.isArray(response.data.items)) {
        setCartItems(response.data.items);
      } else {
        console.error('Format dữ liệu giỏ hàng không hợp lệ(Cart.jsx):', response.data);
        setCartItems([]);
        toast.error('Định dạng dữ liệu không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi tải giỏ hàng(Cart.jsx):', error);
      if (error.response && error.response.status === 401) {
        toast.error('Phiên đăng nhập đã hết hạn');
        localStorage.removeItem('customerToken');
        navigate('/login');
      } else {
        toast.error('Không thể tải giỏ hàng');
        setCartItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch giỏ hàng khi component mount
  useEffect(() => {
    fetchCart();
  }, []);

  // Fetch Cart Recommendations từ CoIUM
  const fetchCartRecommendations = async (items) => {
    // Chỉ fetch nếu có items trong giỏ hàng
    if (!items || items.length === 0) {
      setRecommendations([]);
      return;
    }

    try {
      setRecommendationsLoading(true);
      
      // Lấy danh sách productID từ cart items
      const productIDs = items.map(item => item.product.productID);
      
      console.log('🛒 Fetching cart recommendations for:', productIDs);

      // Gọi API
      const response = await axiosInstance.post('/api/cohui/cart-recommendations', {
        cartItems: productIDs
      }, {
        params: {
          topN: 8,
          minCorrelation: 0.5
        }
      });

      if (response.data.success && response.data.recommendations) {
        console.log(`✅ Got ${response.data.recommendations.length} recommendations`);
        setRecommendations(response.data.recommendations);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error fetching cart recommendations:', error);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Fetch recommendations khi cartItems thay đổi
  useEffect(() => {
    if (cartItems && cartItems.length > 0 && !loading) {
      // Debounce để tránh gọi API quá nhiều lần
      const timer = setTimeout(() => {
        fetchCartRecommendations(cartItems);
      }, 500);

      return () => clearTimeout(timer);
    } else {
      setRecommendations([]);
    }
  }, [cartItems, loading]);

  // Xử lý thay đổi số lượng sản phẩm
  const handleQuantityChange = async (cartID, newQuantity, stock) => {
    try {
      // Kiểm tra số lượng hợp lệ
      if (newQuantity < 1) {
        toast.error('Số lượng không được nhỏ hơn 1');
        return;
      }

      // Kiểm tra số lượng tồn kho
      if (newQuantity > stock) {
        toast.error(`Chỉ còn ${stock} sản phẩm trong kho`);
        return;
      }

      // Cập nhật state local trước
      setItemQuantities(prev => ({
        ...prev,
        [cartID]: newQuantity
      }));

      // Tìm sản phẩm trong cartItems
      const item = cartItems.find(item => item.cartID === cartID);
      if (!item) return;

      // Cập nhật tổng tiền của sản phẩm
      const itemPrice = parseInt(item.price.replace(/\./g, ''));
      const newSubtotal = newQuantity * itemPrice;
      setItemSubtotals(prev => ({
        ...prev,
        [cartID]: newSubtotal
      }));

      // Gọi API cập nhật số lượng
      const token = localStorage.getItem('customerToken');
      await axiosInstance.put(`/api/cart/${cartID}`, { quantity: newQuantity }, { headers: { 'Authorization': `Bearer ${token}` } });
      window.dispatchEvent(new Event('cartChange')); // Emit event sau khi cập nhật thành công
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng(Cart.jsx):', error);
      // Rollback state nếu lỗi
      setItemQuantities(prev => ({
        ...prev,
        [cartID]: cartItems.find(item => item.cartID === cartID)?.quantity || 1
      }));
    }
  };

  // Xử lý chọn sản phẩm
  const handleSelectItem = (cartID) => {
    // Tìm sản phẩm trong giỏ hàng
    const item = cartItems.find(item => item.cartID === cartID);
    if (!item) return;

    // Kiểm tra số lượng tồn kho
    if (item.stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }

    // Cập nhật danh sách sản phẩm được chọn
    const newSelectedItems = new Set(selectedItems);
    if (newSelectedItems.has(cartID)) {
      newSelectedItems.delete(cartID);
    } else {
      newSelectedItems.add(cartID);
    }
    setSelectedItems(newSelectedItems);
  };

  // Xử lý chọn tất cả sản phẩm
  const handleToggleSelectAll = () => {
    if (selectedItems.size === cartItems.filter(item => item.stock > 0).length) {
      // Nếu đã chọn tất cả sản phẩm còn hàng, bỏ chọn hết
      setSelectedItems(new Set());
    } else {
      // Chọn tất cả sản phẩm còn hàng
      const newSelected = new Set(
        cartItems
          .filter(item => item.stock > 0)
          .map(item => item.cartID)
      );
      setSelectedItems(newSelected);
    }
  };

  // Xử lý xóa sản phẩm đã chọn
  const handleRemoveSelected = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      await Promise.all(
        Array.from(selectedItems).map(cartID =>
          axiosInstance.delete(`/api/cart/${cartID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      fetchCart();
      setShowDeleteConfirmMultiple(false);
      window.dispatchEvent(new Event('cartChange'));
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm(Cart.jsx):', error);
      toast.error('Không thể xóa sản phẩm');
    }
  };

  // Xử lý hiển thị popup xóa một sản phẩm
  const handleShowDeleteConfirm = (cartID) => {
    setDeletingItem(cartID);
    setShowDeleteConfirm(true);
  };

  // Xử lý xóa một sản phẩm
  const handleRemove = async () => {
    if (!deletingItem) return;

    try {
      const token = localStorage.getItem('customerToken');
      await axiosInstance.delete(`/api/cart/${deletingItem}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCart();
      setShowDeleteConfirm(false);
      setDeletingItem(null);
      window.dispatchEvent(new Event('cartChange'));
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm(Cart.jsx):', error);
      toast.error('Không thể xóa sản phẩm');
    }
  };

  // Hàm xử lý áp dụng mã giảm giá
  const handleApplyCoupon = async () => {
    // Kiểm tra mã giảm giá có được nhập hay không
    if (!couponCode.trim()) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setLoadingCoupon(true);

      // Lấy danh sách category ID của các sản phẩm đã chọn trong giỏ hàng
      // Sử dụng Set để loại bỏ các category trùng lặp
      const selectedProductCategories = new Set(
        Array.from(selectedItems)
          .map(cartID => {
            const item = cartItems.find(item => item.cartID === cartID);
            return item?.product?.categoryID;
          })
          .filter(Boolean) // Loại bỏ các giá trị null/undefined
      );

      // Lấy token xác thực từ localStorage
      const token = localStorage.getItem('customerToken');

      // Gọi API để áp dụng mã giảm giá
      const response = await axiosInstance.post('/api/user-coupon/apply',
        {
          code: couponCode.trim(),
          orderValue: calculateTotal(), // Tổng giá trị đơn hàng
          categories: Array.from(selectedProductCategories) // Chuyển Set thành Array để gửi lên server
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Xử lý kết quả từ server
      if (response.data && response.data.coupon) {
        const couponData = response.data.coupon;

        // Kiểm tra xem mã giảm giá có áp dụng cho category cụ thể không
        if (couponData.appliedCategories && couponData.appliedCategories.length > 0) {
          // Kiểm tra xem có sản phẩm nào trong giỏ hàng thuộc category được áp dụng không
          const hasValidCategory = Array.from(selectedProductCategories).some(categoryID =>
            couponData.appliedCategories.includes(categoryID)
          );

          // Nếu không có sản phẩm nào thuộc category được áp dụng
          if (!hasValidCategory) {
            toast.error('Mã giảm giá không áp dụng cho các sản phẩm đã chọn');
            return;
          }
        }

        // Lưu thông tin mã giảm giá vào state
        setAppliedCoupon({
          code: couponData.code,
          discountType: couponData.discountType, // Loại giảm giá: percentage hoặc fixed
          // Chuyển đổi giá trị giảm giá sang dạng số
          discountValue: couponData.discountType === 'percentage'
            ? parseFloat(couponData.discountValue) // Nếu là phần trăm thì giữ số thập phân
            : parseInt(couponData.discountValue.toString().replace(/\D/g, '')), // Nếu là số tiền cố định thì chuyển về số nguyên
          maxDiscountAmount: parseInt(couponData.maxDiscountAmount.toString().replace(/\D/g, '')), // Số tiền giảm tối đa
          minOrderValue: parseInt(couponData.minOrderValue.toString().replace(/\D/g, '')), // Giá trị đơn hàng tối thiểu
          userCouponsID: response.data.userCouponsID,
          appliedCategories: couponData.appliedCategories || [] // Danh sách category được áp dụng
        });

        toast.success('Áp dụng mã giảm giá thành công');
      } else {
        throw new Error('Dữ liệu mã giảm giá không hợp lệ');
      }
    } catch (error) {
      console.error('Lỗi khi áp dụng mã giảm giá(Cart.jsx):', error);
      toast.error(error.response?.data?.message || 'Không thể áp dụng mã giảm giá');
      setAppliedCoupon(null);
    } finally {
      setLoadingCoupon(false);
    }
    window.dispatchEvent(new Event('cartChange'));
  };

  // Xóa mã giảm giá
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Đã xóa mã giảm giá');
    window.dispatchEvent(new Event('cartChange'));
  };

  // Thêm hàm để lấy danh sách coupon phù hợp
  const fetchAvailableCoupons = async () => {
    try {
      const token = localStorage.getItem('customerToken');

      // Lấy danh sách coupon khả dụng
      const [availableResponse, myCouponsResponse] = await Promise.all([
        axiosInstance.get('/api/user-coupon/available', {
          params: {
            orderValue: calculateTotal()
          },
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        axiosInstance.get('/api/user-coupon/my-coupons', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (availableResponse.data && Array.isArray(availableResponse.data) &&
        myCouponsResponse.data?.userCoupons && Array.isArray(myCouponsResponse.data.userCoupons)) {

        // Tạo map để kiểm tra thông tin sử dụng của mỗi coupon
        const usageMap = new Map(
          myCouponsResponse.data.userCoupons.map(userCoupon => [
            userCoupon.couponID,
            {
              usageLeft: userCoupon.usageLeft,
              isExpired: userCoupon.isExpired,
              status: userCoupon.status,
              expiryDate: new Date(userCoupon.expiryDate),
              couponInfo: userCoupon.couponInfo
            }
          ])
        );

        // Lấy danh sách categoryID của các sản phẩm đã chọn
        const selectedCategoryIDs = new Set(
          Array.from(selectedItems)
            .map(cartID => {
              const item = cartItems.find(item => item.cartID === cartID);
              return item?.product?.categoryID;
            })
            .filter(Boolean)
        );

        // Lọc và kết hợp thông tin coupon
        const filteredCoupons = availableResponse.data
          .filter(coupon => {
            const now = new Date();
            const endDate = new Date(coupon.endDate);
            const userCouponInfo = usageMap.get(coupon.couponID);

            // Kiểm tra điều kiện cơ bản
            const basicConditions = endDate > now &&
              calculateTotal() >= coupon.minOrderValue;

            // Kiểm tra số lượng sản phẩm tối thiểu
            const selectedItemsCount = Array.from(selectedItems).length;
            const meetsMinQuantity = selectedItemsCount >= (coupon.minimumQuantity || 1);

            // Kiểm tra điều kiện danh mục
            let categoryCondition = true;
            if (coupon.appliedCategories && coupon.appliedCategories.length > 0) {
              // Kiểm tra xem có ít nhất một sản phẩm thuộc danh mục được áp dụng
              categoryCondition = Array.from(selectedCategoryIDs).some(categoryID =>
                coupon.appliedCategories.includes(categoryID)
              );
            }

            // Kiểm tra điều kiện từ my-coupons nếu có
            if (userCouponInfo) {
              return !userCouponInfo.isExpired &&
                userCouponInfo.status === 'active' &&
                userCouponInfo.expiryDate > now &&
                userCouponInfo.usageLeft > 0 &&
                basicConditions &&
                meetsMinQuantity &&
                categoryCondition;
            }

            // Nếu không có trong my-coupons, kiểm tra điều kiện thông thường
            return basicConditions &&
              meetsMinQuantity &&
              categoryCondition &&
              (!coupon.usageLimit || coupon.usageLimit > (coupon.usedCount || 0));
          })
          .map(coupon => {
            const userCouponInfo = usageMap.get(coupon.couponID);
            const appliedCats = userCouponInfo?.couponInfo?.appliedCategories ||
              coupon.appliedCategories;

            // Lọc ra các danh mục được áp dụng cho sản phẩm đã chọn
            const applicableCategories = Array.isArray(appliedCats)
              ? appliedCats.filter(cat =>
                typeof cat === 'object'
                  ? selectedCategoryIDs.has(cat.categoryID)
                  : selectedCategoryIDs.has(cat)
              )
              : [];

            return {
              ...coupon,
              usageLeft: userCouponInfo?.usageLeft || coupon.usageLimit - (coupon.usedCount || 0),
              applicableCategories,
              appliedCategories: appliedCats
            };
          });

        setAvailableCoupons(filteredCoupons);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách mã giảm giá(Cart.jsx):', error);
    }
  };

  // Gọi API lấy coupon khi tổng tiền thay đổi
  useEffect(() => {
    if (calculateTotal() > 0) {
      fetchAvailableCoupons();
    }
  }, [selectedItems, itemQuantities]);

  // Xử lý khi click nút thanh toán
  const handleCheckout = () => {
    const selectedProducts = cartItems
      .filter(item => selectedItems.has(item.cartID))
      .map(item => ({
        cartID: item.cartID,
        SKU: item.SKU,
        product: {
          productID: item.product.productID,
          name: item.product.name,
          price: item.price,
          originalPrice: item.originalPrice,
          imageURL: item.product.imageURL,
          size: item.size.name,
          color: item.color.colorName,
          promotion: item.product.promotion
        },
        quantity: itemQuantities[item.cartID] || item.quantity,
        subtotal: parseInt(item.price.replace(/\./g, '')) * (itemQuantities[item.cartID] || item.quantity)
      }));

    if (selectedProducts.length === 0) {
      toast.error('Vui lòng chọn sản phẩm để thanh toán');
      return;
    }

    // Tính toán tổng tiền và chuyển đổi thành số
    const subtotal = calculateTotal();
    const discount = calculateDiscount();
    const finalTotal = calculateFinalTotal();

    // Sửa lại phần lưu thông tin coupon
    const checkoutData = {
      items: selectedProducts,
      subtotal: subtotal,
      discount: discount,
      finalTotal: finalTotal,
      coupon: appliedCoupon ? {
        code: appliedCoupon.code,
        discountType: appliedCoupon.discountType,
        discountValue: appliedCoupon.discountValue,
        maxDiscountAmount: appliedCoupon.maxDiscountAmount,
        minOrderValue: appliedCoupon.minOrderValue,
        userCouponsID: appliedCoupon.userCouponsID,
        appliedCategories: appliedCoupon.appliedCategories || []
      } : null,
      totalQuantity: selectedProducts.reduce((sum, item) => sum + item.quantity, 0)
    };

    // Log để debug
    console.log('Checkout Data:', checkoutData);
    console.log('Applied Coupon:', appliedCoupon);

    localStorage.setItem('checkoutItems', JSON.stringify(checkoutData));
    navigate('/checkout');
  };

  // Sắp xếp sản phẩm còn hàng lên trên
  const sortedCartItems = cartItems.sort((a, b) => {
    if (a.product.isActivated && !b.product.isActivated) return -1; // a lên trên
    if (!a.product.isActivated && b.product.isActivated) return 1; // b lên trên
    return 0; // Giữ nguyên thứ tự nếu cả hai đều còn hàng hoặc cả hai đều hết hàng
  });

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'tet'
        ? 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
        }`}>
        <PageBanner
          theme={theme}
          icon={FaShoppingCart}
          title="GIỎ HÀNG CỦA BẠN"
          breadcrumbText="Giỏ hàng"
          extraContent={
            <div className="flex items-center justify-center gap-3 text-xl text-white/90">
              <FaShoppingCart className="w-6 h-6" />
              <p>Đang tải...</p>
            </div>
          }
        />

        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Danh sách sản phẩm skeleton */}
            <div className="lg:w-2/3">
              <div className="bg-white shadow-lg rounded-3xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded bg-gray-200 animate-pulse"></div>
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="w-24 h-8 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>

                {/* Skeleton items */}
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className={`p-4 bg-white border border-gray-100 rounded-2xl`}>
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Checkbox và ảnh skeleton */}
                        <div className="flex items-start gap-4">
                          <div className="mt-1 w-5 h-5 rounded bg-gray-200 animate-pulse"></div>
                          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-200 animate-pulse"></div>
                        </div>

                        {/* Thông tin sản phẩm skeleton */}
                        <div className="flex-grow">
                          <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2">
                                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                              </div>
                              <div className="w-8 h-8 rounded-xl bg-gray-200 animate-pulse"></div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                              {/* Số lượng skeleton */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
                              </div>

                              {/* Giá skeleton */}
                              <div className="flex flex-col items-end">
                                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mt-1"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tổng tiền skeleton */}
            <div className="lg:w-1/3">
              <div className="bg-white shadow-lg rounded-3xl p-6 sticky top-4">
                <div className="space-y-4">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'tet'
      ? 'bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50'
      : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
      <PageBanner
        theme={theme}
        icon={FaShoppingCart}
        title="GIỎ HÀNG CỦA BẠN"
        breadcrumbText="Giỏ hàng"
        extraContent={
          <div className="flex items-center justify-center gap-3 text-xl text-white/90">
            <FaShoppingCart className="w-6 h-6" />
            <p>{cartItems.length} sản phẩm trong giỏ hàng</p>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className={`text-center py-8 ${theme === 'tet'
            ? 'bg-white shadow-red-100/50'
            : 'bg-white shadow-blue-100/50'
            } shadow-xl backdrop-blur-sm bg-opacity-60 rounded-3xl`}>
            <div className={`w-24 h-24 mx-auto mb-8 animate-bounce ${theme === 'tet' ? 'text-red-300' : 'text-blue-300'
              }`}>
              <FaShoppingCart className="w-full h-full" />
            </div>
            <p className="text-gray-500 text-xl mb-8">Giỏ hàng của bạn đang trống</p>
            <Link
              to="/products"
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-medium text-white transition-all transform hover:scale-105 hover:-translate-y-1 ${theme === 'tet'
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-200'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-200'
                } shadow-lg`}
            >
              <FaArrowRight className="w-5 h-5" />
              <span>Tiếp tục mua sắm</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Danh sách sản phẩm */}
            <div className="lg:w-2/3">
              <div className="bg-white shadow-lg rounded-3xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === cartItems.filter(item => item.stock > 0).length}
                      onChange={handleToggleSelectAll}
                      className={`w-5 h-5 rounded border-gray-300 ${theme === 'tet'
                        ? 'text-red-500 focus:ring-red-500'
                        : 'text-blue-500 focus:ring-blue-500'
                        }`}
                    />
                    <span className="font-medium">
                      Chọn tất cả ({cartItems.filter(item => item.stock > 0).length} sản phẩm)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirmMultiple(true)}
                    disabled={selectedItems.size === 0}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${theme === 'tet'
                      ? 'text-red-500 hover:bg-red-50'
                      : 'text-blue-500 hover:bg-blue-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <span className="hidden sm:inline">Xóa đã chọn</span>
                    <FaTrash className="w-4 h-4 sm:hidden" />
                  </button>
                </div>

                {/* Danh sách sản phẩm */}
                <div className="space-y-4">
                  {sortedCartItems.map((item) => (
                    <div
                      key={item.cartID}
                      className={`p-4 ${
                        !item.product.isActivated 
                          ? 'bg-gray-50 border border-gray-200 opacity-80'
                          : theme === 'tet'
                            ? 'bg-white border border-red-100'
                            : 'bg-white border border-blue-100'
                      } rounded-2xl transition-all hover:shadow-md`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Checkbox và ảnh */}
                        <div className="flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.cartID)}
                            onChange={() => handleSelectItem(item.cartID)}
                            disabled={!item.product.isActivated}
                            className={`mt-1 w-5 h-5 rounded border-gray-300 ${
                              !item.product.isActivated
                                ? 'text-gray-400 focus:ring-gray-400'
                                : theme === 'tet'
                                  ? 'text-red-500 focus:ring-red-500'
                                  : 'text-blue-500 focus:ring-blue-500'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          />
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden">
                            <img
                              src={item.product.imageURL}
                              alt={item.product.name}
                              className={`w-full h-full object-cover rounded-xl ${!item.product.isActivated ? 'grayscale' : ''}`}
                            />
                          </div>
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div className="flex-grow">
                          <div className="flex flex-col h-full">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3 className={`text-lg font-medium transition-colors ${
                                  !item.product.isActivated 
                                    ? 'text-gray-500'
                                    : 'hover:text-blue-600'
                                }`}>
                                  {item.product.isActivated ? (
                                    <Link to={`/product/${item.product.productID}`}>
                                      {item.product.name}
                                    </Link>
                                  ) : (
                                    <span className="text-gray-500 cursor-not-allowed">
                                      {item.product.name}
                                    </span>
                                  )}
                                </h3>
                                {item.product.isActivated ? (
                                  item.stock <= 0 ? (
                                    <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-red-500 bg-red-50 rounded-lg">
                                      Hết hàng
                                    </span>
                                  ) : item.stock <= 5 ? (
                                    <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-yellow-500 bg-yellow-50 rounded-lg">
                                      Còn {item.stock} sản phẩm
                                    </span>
                                  ) : null
                                ) : (
                                  <span className="inline-block px-2 py-1 mt-1 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg">
                                    Sản phẩm không khả dụng, vui lòng liên hệ cửa hàng
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleShowDeleteConfirm(item.cartID)}
                                className={`p-2 rounded-xl ${theme === 'tet'
                                  ? 'hover:bg-red-50 text-red-500'
                                  : 'hover:bg-blue-50 text-blue-500'
                                  }`}
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Thông tin sản phẩm */}
                            <div className="mt-2 space-y-1 text-sm text-gray-500">
                              <p>Màu sắc: {item.color.colorName}</p>
                              <p>Kích thước: {item.size.name}</p>
                            </div>

                            <div className="mt-auto pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              {/* Số lượng */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuantityChange(item.cartID, itemQuantities[item.cartID] - 1, item.stock)}
                                  className={`p-2 rounded-xl ${
                                    !item.product.isActivated
                                      ? 'hover:bg-gray-100 text-gray-400'
                                      : theme === 'tet'
                                        ? 'hover:bg-red-50 text-red-500'
                                        : 'hover:bg-blue-50 text-blue-500'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  disabled={itemQuantities[item.cartID] <= 1 || !item.product.isActivated}
                                >
                                  <FaMinus className="w-4 h-4" />
                                </button>
                                <span className={`w-12 text-center font-medium ${!item.product.isActivated ? 'text-gray-400' : ''}`}>
                                  {itemQuantities[item.cartID] || item.quantity}
                                </span>
                                <button
                                  onClick={() => handleQuantityChange(item.cartID, itemQuantities[item.cartID] + 1, item.stock)}
                                  className={`p-2 rounded-xl ${
                                    !item.product.isActivated
                                      ? 'hover:bg-gray-100 text-gray-400'
                                      : theme === 'tet'
                                        ? 'hover:bg-red-50 text-red-500'
                                        : 'hover:bg-blue-50 text-blue-500'
                                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                                  disabled={itemQuantities[item.cartID] >= item.stock || !item.product.isActivated}
                                >
                                  <FaPlus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Giá và tổng tiền */}
                              <div className="flex flex-col items-end ml-auto">
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col items-end">
                                    <span className={`text-lg font-bold ${
                                      !item.product.isActivated
                                        ? 'text-gray-400'
                                        : theme === 'tet' 
                                          ? 'text-red-600' 
                                          : 'text-blue-600'
                                    }`}>
                                      {formatPrice(item.price)}đ
                                    </span>
                                    {item.originalPrice && parseInt(item.originalPrice.replace(/\./g, '')) > parseInt(item.price.replace(/\./g, '')) && (
                                      <span className="text-sm text-gray-400 line-through">
                                        {item.originalPrice}đ
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                  Thành tiền: <span className={`font-medium ${
                                    !item.product.isActivated
                                      ? 'text-gray-400'
                                      : theme === 'tet' 
                                        ? 'text-red-600' 
                                        : 'text-blue-600'
                                  }`}>
                                    {formatPrice(itemSubtotals[item.cartID] ||
                                      (parseInt(item.price.replace(/\./g, '')) * item.quantity))}đ
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tổng cộng */}
            <div className="lg:w-1/3">
              <div className={`p-6 sticky top-20 ${theme === 'tet'
                ? 'bg-white shadow-red-100/50'
                : 'bg-white shadow-blue-100/50'
                } shadow-lg rounded-3xl space-y-6`}>
                <h3 className="text-xl font-bold">Tổng cộng</h3>

                {/* Thông tin đơn hàng */}
                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Số lượng sản phẩm đã chọn:</span>
                    <span className="font-medium">{calculateSelectedCount()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span className="font-medium">{formatPrice(calculateTotal())}đ</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(calculateDiscount())}đ</span>
                    </div>
                  )}
                  <div className={`flex justify-between text-lg font-bold ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                    <span>Tổng cộng:</span>
                    <span>{formatPrice(calculateFinalTotal())}đ</span>
                  </div>
                </div>

                {/* Mã giảm giá */}
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Nhập mã giảm giá"
                      disabled={loadingCoupon || appliedCoupon}
                      className={`flex-1 min-w-0 px-4 py-2.5 rounded-xl border ${
                        theme === 'tet'
                          ? 'border-red-200 focus:ring-red-500'
                          : 'border-blue-200 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2 disabled:bg-gray-50`}
                    />

                    {/* Xóa mã giảm giá */}
                    {appliedCoupon ? (
                      <button
                        onClick={handleRemoveCoupon}
                        className={`p-2.5 rounded-xl text-white min-w-[44px] ${
                          theme === 'tet'
                            ? 'bg-red-500 hover:bg-red-600'
                            : 'bg-blue-500 hover:bg-blue-600'
                        } transition-colors`}
                        title="Xóa mã giảm giá"
                      >
                        <FaTimes className="w-5 h-5" />
                      </button>
                    ) : (
                      <>
                        {/* Áp dụng mã giảm giá */}
                        <button
                          onClick={handleApplyCoupon}
                          disabled={loadingCoupon || !couponCode.trim()}
                          className={`px-6 py-2.5 rounded-xl font-medium text-white whitespace-nowrap ${
                            theme === 'tet'
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-blue-500 hover:bg-blue-600'
                          } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                        >
                          {loadingCoupon ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Áp dụng'
                          )}
                        </button>
                        {/* Hiển thị danh sách coupon khả dụng */}
                        <button
                          onClick={() => setShowCoupons(true)}
                          className={`p-2.5 rounded-xl font-medium border min-w-[44px] ${
                            theme === 'tet'
                              ? 'border-red-200 text-red-600 hover:bg-red-50'
                              : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                          }`}
                        >
                          <FaGift className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Hiển thị mã giảm giá đã áp dụng */}
                  {appliedCoupon && (
                    <div className="mt-2 p-3 bg-green-50 text-green-600 text-sm rounded-xl flex items-start gap-2">
                      <FaGift className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Mã giảm giá: {appliedCoupon.code}</p>
                        <p className="text-green-500 mt-1">
                          {appliedCoupon.discountType === 'percentage'
                            ? `Giảm ${appliedCoupon.discountValue}% tối đa ${formatPrice(appliedCoupon.maxDiscountAmount)}đ`
                            : `Giảm ${formatPrice(appliedCoupon.discountValue)}đ`
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Nút thanh toán */}
                <button
                  onClick={handleCheckout}
                  disabled={selectedItems.size === 0}
                  className={`w-full py-4 px-6 rounded-xl text-white font-medium flex items-center justify-center gap-2 ${theme === 'tet'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  <span>Tiến hành thanh toán</span>
                  <FaArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Popup xác nhận xóa một sản phẩm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => {
                setShowDeleteConfirm(false);
                setDeletingItem(null);
              }}></div>
            </div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${theme === 'tet' ? 'bg-red-100' : 'bg-blue-100'
                    } sm:mx-0 sm:h-10 sm:w-10`}>
                    <FaTrash className={`h-6 w-6 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xác nhận xóa
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {cartItems.find(item => item.cartID === deletingItem)?.product?.name
                          ? `Bạn có chắc chắn muốn xóa sản phẩm "${cartItems.find(item => item.cartID === deletingItem).product.name}" khỏi giỏ hàng không?`
                          : 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng không?'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 ${theme === 'tet'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                    } text-base font-medium text-white focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors`}
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletingItem(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận xóa nhiều sản phẩm */}
      {showDeleteConfirmMultiple && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDeleteConfirmMultiple(false)}></div>
            </div>

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${theme === 'tet' ? 'bg-red-100' : 'bg-blue-100'
                    } sm:mx-0 sm:h-10 sm:w-10`}>
                    <FaTrash className={`h-6 w-6 ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                      }`} />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Xác nhận xóa nhiều sản phẩm
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa {selectedItems.size} sản phẩm đã chọn khỏi giỏ hàng không?
                      </p>
                      <div className="mt-3 max-h-32 overflow-y-auto">
                        <ul className="space-y-1 text-sm text-gray-500">
                          {Array.from(selectedItems).map(cartID => {
                            const item = cartItems.find(item => item.cartID === cartID);
                            return item && (
                              <li key={cartID} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                <span className="truncate">{item.product.name}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
                <button
                  type="button"
                  onClick={handleRemoveSelected}
                  className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 ${theme === 'tet'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                    } text-base font-medium text-white focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors`}
                >
                  Xóa tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmMultiple(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thêm Modal hiển thị danh sách coupon khả dụng */}
      {showCoupons && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className={`w-full max-w-lg p-6 bg-white rounded-3xl shadow-lg max-h-[80vh] overflow-y-auto`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Mã giảm giá có thể áp dụng</h3>
              <button
                onClick={() => setShowCoupons(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {availableCoupons.length === 0 ? (
              <div className="text-center py-8">
                <FaGift className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Không có mã giảm giá nào phù hợp</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`p-4 bg-white border rounded-xl transition-all ${theme === 'tet'
                      ? 'hover:border-red-300 hover:bg-red-50/50'
                      : 'hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-lg">{coupon.code}</h4>
                          {coupon.couponType === 'special_event' && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${theme === 'tet'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-blue-100 text-blue-600'
                              }`}>
                              Special
                            </span>
                          )}
                        </div>
                        <p className="text-sm mt-1">
                          {coupon.description}
                        </p>
                        <div className="mt-2">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg ${theme === 'tet'
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-blue-50 border border-blue-200'
                            }`}>
                            <span className={`text-base font-bold ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                              }`}>
                              {coupon.discountType === 'percentage'
                                ? `Giảm ${coupon.discountValue}%`
                                : `Giảm ${formatPrice(coupon.discountValue)}đ`
                              }
                            </span>
                            {coupon.discountType === 'percentage' && coupon.maxDiscountAmount && (
                              <span className="ml-1 text-sm text-gray-500">
                                (Tối đa {formatPrice(coupon.maxDiscountAmount)}đ)
                              </span>
                            )}
                          </div>
                        </div>
                        {coupon.minimumOrderValue > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="text-sm text-gray-500">Đơn tối thiểu:</span>
                            <span className={`font-medium ${calculateTotal() >= coupon.minimumOrderValue
                              ? theme === 'tet' ? 'text-red-600' : 'text-blue-600'
                              : 'text-gray-500'
                              }`}>
                              {formatPrice(coupon.minimumOrderValue)}đ
                            </span>
                            {calculateTotal() < coupon.minimumOrderValue && (
                              <span className="text-xs text-gray-500">
                                (Còn thiếu {formatPrice(coupon.minimumOrderValue - calculateTotal())}đ)
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${theme === 'tet'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                            }`}>
                            HSD: {new Date(coupon.endDate).toLocaleDateString('vi-VN')}
                          </span>
                          {coupon.usageLeft > 0 && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${coupon.usageLeft <= 3
                              ? 'bg-yellow-50 text-yellow-600'
                              : theme === 'tet'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-blue-50 text-blue-600'
                              }`}>
                              {coupon.usageLeft <= 3 ? '⚡' : ''} Còn lại: {coupon.usageLeft} lượt
                            </span>
                          )}
                          {coupon.minimumQuantity > 1 && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${Array.from(selectedItems).length >= coupon.minimumQuantity
                              ? theme === 'tet' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                              : 'bg-gray-100 text-gray-600'
                              }`}>
                              Tối thiểu {coupon.minimumQuantity} sản phẩm
                            </span>
                          )}
                          {coupon.appliedCategories?.length > 0 && (
                            <div className="flex flex-col gap-1 w-full mt-1">
                              <span className={`text-xs ${theme === 'tet' ? 'text-red-500' : 'text-blue-500'}`}>
                                Áp dụng cho danh mục:
                              </span>
                              <button
                                onClick={() => setShowCategories(!showCategories)}
                                className={`text-xs font-medium ${theme === 'tet' ? 'text-red-600' : 'text-blue-600'} underline text-left`}
                              >
                                {showCategories ? 'Thu gọn' : 'Xem danh mục'}
                              </button>
                              {showCategories && (
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(coupon.appliedCategories) && coupon.appliedCategories.map((cat, idx) => (
                                    <span
                                      key={idx}
                                      className={`inline-flex items-center px-2 py-1 rounded-lg text-xs ${coupon.applicableCategories?.some(appliedCat =>
                                        (typeof cat === 'object' ? cat.categoryID === appliedCat.categoryID : cat === appliedCat)
                                      )
                                        ? theme === 'tet'
                                          ? 'bg-red-100 text-red-700 border border-red-200'
                                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                                        }`}
                                    >
                                      {typeof cat === 'object' ? cat.name : `Danh mục ${cat}`}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCouponCode(coupon.code);
                          setShowCoupons(false);
                        }}
                        className={`ml-4 px-4 py-2 rounded-xl text-sm font-medium transition-all ${theme === 'tet'
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          } whitespace-nowrap`}
                      >
                        Sử dụng
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cart Recommendations Section - NEW */}
      {!loading && cartItems.length > 0 && (
        <RecommendationCarousel
          products={recommendations}
          title="Bạn có thể cũng thích"
          subtitle={`Dựa trên ${cartItems.length} sản phẩm trong giỏ hàng của bạn`}
          loading={recommendationsLoading}
          showCorrelation={true}
          minSlides={4}
        />
      )}
    </div>
  );
};

export default Cart;
