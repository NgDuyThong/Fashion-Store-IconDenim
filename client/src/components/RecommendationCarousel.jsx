// RecommendationCarousel.jsx - Component carousel hiển thị sản phẩm gợi ý
import React from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, Grid } from 'swiper/modules';
import { FaShoppingCart, FaHeart, FaStar, FaBolt, FaFire } from 'react-icons/fa';
import { useTheme } from '../contexts/CustomerThemeContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/grid';

const RecommendationCarousel = ({ 
  products = [], 
  title = "Có thể bạn cũng thích",
  subtitle = "",
  icon: Icon = FaBolt,
  loading = false,
  showCorrelation = false,
  minSlides = 4,
  emptyMessage = "Không có sản phẩm gợi ý"
}) => {
  const { theme } = useTheme();

  // Format giá tiền
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Render loading skeleton
  if (loading) {
    return (
      <section className={`py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Icon className="text-3xl text-blue-600" />
            <div>
              <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h2>
              {subtitle && (
                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`rounded-xl overflow-hidden animate-pulse ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
              }`}>
                <div className="aspect-square" />
                <div className="p-4 space-y-2">
                  <div className={`h-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
                  <div className={`h-4 w-2/3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Nếu không có sản phẩm
  if (!products || products.length === 0) {
    return null; // Không hiển thị gì nếu không có sản phẩm
  }

  return (
    <section className={`py-12 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Icon className="text-3xl text-blue-600 animate-pulse" />
          <div>
            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
            {subtitle && (
              <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Carousel */}
        <Swiper
          modules={[Navigation, Autoplay, Grid]}
          spaceBetween={16}
          slidesPerView={2}
          navigation
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
          }}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
            1280: { slidesPerView: 5 }
          }}
          className="recommendation-swiper"
        >
          {products.map((product, index) => (
            <SwiperSlide key={product.productID || index}>
              <Link 
                to={`/product/${product.productID}`}
                className={`block rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  theme === 'dark' 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden group">
                  <img 
                    src={product.thumbnail || '/placeholder.jpg'} 
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  
                  {/* Correlation Badge */}
                  {showCorrelation && product.avgCorrelation && (
                    <div className="absolute top-2 right-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        product.avgCorrelation >= 0.7 
                          ? 'bg-green-500 text-white'
                          : product.avgCorrelation >= 0.5
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        <FaStar className="text-xs" />
                        {(product.avgCorrelation * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}

                  {/* Match Count Badge */}
                  {product.matchCount && product.matchCount > 1 && (
                    <div className="absolute top-2 left-2">
                      <div className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white flex items-center gap-1">
                        <FaFire className="text-xs" />
                        {product.matchCount} match
                      </div>
                    </div>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="text-white text-sm font-semibold bg-blue-600 px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform">
                      Xem chi tiết
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className={`font-semibold text-sm mb-2 line-clamp-2 min-h-[2.5rem] ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {formatPrice(product.price)}đ
                    </span>
                    
                    {product.source && (
                      <span className={`text-xs px-2 py-1 rounded ${
                        theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {product.source === 'CoIUM' || product.source === 'CoIUM Cart Analysis' 
                          ? '🔥 AI'
                          : product.source}
                      </span>
                    )}
                  </div>

                  {/* Additional Info */}
                  {showCorrelation && product.avgCorrelation && (
                    <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Độ phù hợp: {(product.avgCorrelation * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Custom CSS for Swiper navigation */}
      <style>{`
        .recommendation-swiper .swiper-button-next,
        .recommendation-swiper .swiper-button-prev {
          background: ${theme === 'dark' ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .recommendation-swiper .swiper-button-next:after,
        .recommendation-swiper .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
          color: ${theme === 'dark' ? '#fff' : '#111'};
        }

        .recommendation-swiper .swiper-button-next:hover,
        .recommendation-swiper .swiper-button-prev:hover {
          background: #3B82F6;
        }

        .recommendation-swiper .swiper-button-next:hover:after,
        .recommendation-swiper .swiper-button-prev:hover:after {
          color: #fff;
        }
      `}</style>
    </section>
  );
};

export default RecommendationCarousel;
