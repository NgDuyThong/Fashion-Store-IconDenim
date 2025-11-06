import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Component hiển thị sản phẩm gợi ý dựa trên CoHUI
 * Sử dụng trong trang chủ hoặc trang danh mục
 */
function RecommendedProducts() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cohui/recommendations', {
          params: {
            minutil: 0.001,
            mincor: 0.3,
            maxlen: 3,
            topN: 8
          }
        });

        if (response.data.success && response.data.recommendations.length > 0) {
          setRecommendations(response.data.recommendations);
          setError(null);
        } else {
          setRecommendations([]);
          setError(response.data.message);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Không thể tải gợi ý sản phẩm');
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="recommended-products">
        <h2 className="section-title">Gợi ý cho bạn</h2>
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Không hiển thị gì nếu không có dữ liệu
  }

  return (
    <section className="recommended-products">
      <div className="section-header">
        <h2 className="section-title">Gợi ý cho bạn</h2>
        <p className="section-subtitle">Dựa trên phân tích mua hàng thông minh</p>
      </div>

      <div className="product-grid">
        {recommendations.map((rec) => (
          <ProductCard
            key={rec.productID}
            product={rec.productDetails}
            badge={`${rec.confidence}% phù hợp`}
            score={rec.score}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Component hiển thị sản phẩm thường mua cùng
 * Sử dụng trong trang chi tiết sản phẩm
 */
function BoughtTogether({ productID }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productID) return;

    const fetchBoughtTogether = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/cohui/bought-together/${productID}`, {
          params: {
            minutil: 0.001,
            mincor: 0.3,
            topN: 5
          }
        });

        if (response.data.success && response.data.recommendations.length > 0) {
          setRecommendations(response.data.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Error fetching bought together:', err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBoughtTogether();
  }, [productID]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="bought-together">
      <div className="section-header">
        <h3 className="section-title">Khách hàng cũng mua</h3>
        <p className="section-subtitle">Sản phẩm thường được mua cùng</p>
      </div>

      <div className="product-grid">
        {recommendations.map((rec) => (
          <ProductCard
            key={rec.productID}
            product={rec.productDetails}
            badge={`${rec.confidence}% mua cùng`}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Component gợi ý sản phẩm bổ sung cho giỏ hàng
 * Sử dụng trong trang giỏ hàng
 */
function CartRecommendations({ cartItems }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      setRecommendations([]);
      return;
    }

    const fetchCartRecommendations = async () => {
      try {
        setLoading(true);
        const productIDs = cartItems.map(item => item.productID);

        const response = await axios.post(
          '/api/cohui/cart-analysis',
          { cartItems: productIDs },
          {
            params: {
              minutil: 0.001,
              mincor: 0.4,
              topN: 5
            }
          }
        );

        if (response.data.success && response.data.recommendations.length > 0) {
          setRecommendations(response.data.recommendations);
        } else {
          setRecommendations([]);
        }
      } catch (err) {
        console.error('Error fetching cart recommendations:', err);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCartRecommendations();
  }, [cartItems]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="cart-recommendations">
      <div className="section-header">
        <h3 className="section-title">Có thể bạn cũng thích</h3>
        <p className="section-subtitle">Hoàn thiện bộ trang phục của bạn</p>
      </div>

      <div className="product-grid">
        {recommendations.map((rec) => (
          <ProductCard
            key={rec.productID}
            product={rec.productDetails}
            showAddToCart={true}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Component ProductCard - Hiển thị thông tin sản phẩm
 */
function ProductCard({ product, badge, score, showAddToCart = false }) {
  if (!product) return null;

  const handleAddToCart = () => {
    // Logic thêm vào giỏ hàng
    console.log('Add to cart:', product.productID);
  };

  return (
    <div className="product-card">
      {badge && <div className="product-badge">{badge}</div>}
      
      <div className="product-image">
        <img src={product.thumbnail} alt={product.name} />
      </div>

      <div className="product-info">
        <h4 className="product-name">{product.name}</h4>
        <p className="product-price">
          {new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(product.price)}
        </p>

        {score && (
          <div className="product-score">
            <span>Điểm gợi ý: {score.toFixed(1)}</span>
          </div>
        )}

        <div className="product-actions">
          <button 
            className="btn-view"
            onClick={() => window.location.href = `/products/${product.productID}`}
          >
            Xem chi tiết
          </button>
          {showAddToCart && (
            <button className="btn-add-cart" onClick={handleAddToCart}>
              Thêm vào giỏ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { RecommendedProducts, BoughtTogether, CartRecommendations, ProductCard };
