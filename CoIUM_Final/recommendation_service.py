"""
CoHUI Recommendation Service for Fashion Store
Dịch vụ gợi ý sản phẩm dựa trên thuật toán CoHUI
"""

import sys
import json
from algorithms.coium import coium
from data_utils import load_profits_from_file, generate_profits, save_profits_to_file
from metrics import calculate_transaction_utility
from collections import defaultdict
import itertools


def prepare_dataset_from_orders(orders_data):
    """
    Chuyển đổi dữ liệu đơn hàng từ MongoDB thành format cho CoHUI
    
    Args:
        orders_data: List of orders, each containing items
        Format: [
            {
                "orderID": 1,
                "items": [
                    {"productID": 101, "quantity": 2, "price": 500000},
                    {"productID": 102, "quantity": 1, "price": 300000}
                ]
            },
            ...
        ]
    
    Returns:
        dataset: List of transactions (mỗi transaction là list productID)
        profits: Dictionary mapping productID to price
    """
    dataset = []
    profits = {}
    
    # Bước 1: Thu thập tất cả products và profits
    for order in orders_data:
        if 'items' in order and order['items']:
            for item in order['items']:
                product_id = item.get('productID')
                if product_id:
                    price = item.get('price', 0)
                    # Đảm bảo mọi productID đều có profit
                    if product_id not in profits:
                        profits[product_id] = price
    
    # Bước 2: Tạo dataset
    for order in orders_data:
        transaction = []
        if 'items' in order and order['items']:
            for item in order['items']:
                product_id = item.get('productID')
                if product_id:
                    transaction.append(product_id)
        
        if transaction:
            dataset.append(sorted(set(transaction)))  # Loại bỏ duplicate trong cùng 1 đơn
    
    return dataset, profits


def get_product_recommendations(orders_data, target_products=None, minutil=0.001, mincor=0.3, maxlen=3, top_n=10):
    """
    Lấy danh sách sản phẩm gợi ý dựa trên CoHUI
    
    Args:
        orders_data: Dữ liệu đơn hàng
        target_products: List productID mà user đang xem/đã mua (optional)
        minutil: Minimum utility threshold (% của tổng utility)
        mincor: Minimum correlation threshold
        maxlen: Độ dài tối đa của itemset
        top_n: Số lượng gợi ý trả về
    
    Returns:
        List of recommended product IDs với điểm số
    """
    try:
        # Chuẩn bị dataset
        dataset, profits = prepare_dataset_from_orders(orders_data)
        
        if not dataset or len(dataset) < 2:
            return {
                "success": False,
                "message": "Không đủ dữ liệu đơn hàng để phân tích",
                "recommendations": []
            }
        
        # Chạy thuật toán CoHUI (truyền profits từ dataset)
        cohuis = coium(dataset, minutil, mincor, maxlen, dataset_name="fashion_store", profits=profits)
        
        if not cohuis:
            return {
                "success": True,
                "message": "Không tìm thấy pattern phù hợp, giảm mincor hoặc minutil",
                "recommendations": []
            }
        
        # Sắp xếp theo utility giảm dần
        cohuis.sort(key=lambda x: x[1], reverse=True)
        
        # Tính điểm cho mỗi sản phẩm
        product_scores = defaultdict(float)
        product_count = defaultdict(int)
        
        for itemset, utility, correlation in cohuis:
            # Trọng số kết hợp utility và correlation
            score = utility * correlation
            
            for product_id in itemset:
                # Nếu user đang xem một sản phẩm, gợi ý các sản phẩm khác trong pattern
                if target_products:
                    if any(target in itemset for target in target_products) and product_id not in target_products:
                        product_scores[product_id] += score * 1.5  # Boost cho related products
                        product_count[product_id] += 1
                else:
                    # Gợi ý tất cả sản phẩm trong pattern
                    product_scores[product_id] += score
                    product_count[product_id] += 1
        
        # Chuẩn hóa điểm số và tạo danh sách gợi ý
        recommendations = []
        for product_id, total_score in product_scores.items():
            avg_score = total_score / product_count[product_id]
            recommendations.append({
                "productID": product_id,
                "score": round(avg_score, 2),
                "frequency": product_count[product_id],
                "confidence": round(min(product_count[product_id] / len(cohuis) * 100, 100), 2)
            })
        
        # Sắp xếp theo điểm số
        recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        # Lấy top N
        top_recommendations = recommendations[:top_n]
        
        return {
            "success": True,
            "message": f"Tìm thấy {len(cohuis)} patterns, {len(recommendations)} sản phẩm gợi ý",
            "totalPatterns": len(cohuis),
            "recommendations": top_recommendations,
            "patterns": [
                {
                    "items": itemset,
                    "utility": round(utility, 2),
                    "correlation": round(correlation, 4)
                }
                for itemset, utility, correlation in cohuis[:5]  # Top 5 patterns
            ]
        }
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"ERROR TRACEBACK: {error_trace}", file=sys.stderr)
        return {
            "success": False,
            "message": f"Lỗi khi phân tích: {str(e)}",
            "error_type": type(e).__name__,
            "traceback": error_trace,
            "recommendations": []
        }


def get_frequent_bought_together(orders_data, product_id, minutil=0.001, mincor=0.3, top_n=5):
    """
    Tìm các sản phẩm thường được mua cùng với product_id
    
    Args:
        orders_data: Dữ liệu đơn hàng
        product_id: ID sản phẩm cần tìm
        minutil: Minimum utility threshold
        mincor: Minimum correlation threshold
        top_n: Số lượng gợi ý
    
    Returns:
        List sản phẩm thường mua cùng
    """
    result = get_product_recommendations(
        orders_data,
        target_products=[product_id],
        minutil=minutil,
        mincor=mincor,
        maxlen=3,
        top_n=top_n
    )
    
    return result


def analyze_shopping_cart(orders_data, cart_items, minutil=0.001, mincor=0.3, top_n=5):
    """
    Phân tích giỏ hàng và gợi ý sản phẩm bổ sung
    
    Args:
        orders_data: Dữ liệu đơn hàng
        cart_items: List productID trong giỏ hàng hiện tại
        minutil: Minimum utility threshold
        mincor: Minimum correlation threshold
        top_n: Số lượng gợi ý
    
    Returns:
        List sản phẩm nên thêm vào giỏ
    """
    result = get_product_recommendations(
        orders_data,
        target_products=cart_items,
        minutil=minutil,
        mincor=mincor,
        maxlen=len(cart_items) + 2,
        top_n=top_n
    )
    
    return result


if __name__ == "__main__":
    # Đọc input từ stdin (được gọi từ Node.js)
    try:
        # Set encoding UTF-8 cho stdout
        if sys.platform == 'win32':
            import io
            sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
        
        # Đọc từ stdin thay vì sys.argv (tránh ENAMETOOLONG với data lớn)
        input_json = sys.stdin.read()
        
        if input_json and input_json.strip():
            input_data = json.loads(input_json)
            
            action = input_data.get('action', 'recommend')
            orders_data = input_data.get('orders', [])
            
            if action == 'recommend':
                # Gợi ý sản phẩm chung
                target_products = input_data.get('targetProducts', None)
                minutil = input_data.get('minutil', 0.001)
                mincor = input_data.get('mincor', 0.3)
                maxlen = input_data.get('maxlen', 3)
                top_n = input_data.get('topN', 10)
                
                result = get_product_recommendations(
                    orders_data, 
                    target_products,
                    minutil, 
                    mincor, 
                    maxlen, 
                    top_n
                )
                
            elif action == 'bought_together':
                # Sản phẩm mua cùng
                product_id = input_data.get('productID')
                minutil = input_data.get('minutil', 0.001)
                mincor = input_data.get('mincor', 0.3)
                top_n = input_data.get('topN', 5)
                
                result = get_frequent_bought_together(
                    orders_data,
                    product_id,
                    minutil,
                    mincor,
                    top_n
                )
                
            elif action == 'cart_analysis':
                # Phân tích giỏ hàng
                cart_items = input_data.get('cartItems', [])
                minutil = input_data.get('minutil', 0.001)
                mincor = input_data.get('mincor', 0.3)
                top_n = input_data.get('topN', 5)
                
                result = analyze_shopping_cart(
                    orders_data,
                    cart_items,
                    minutil,
                    mincor,
                    top_n
                )
            else:
                result = {
                    "success": False,
                    "message": f"Action không hợp lệ: {action}"
                }
            
            # Trả về kết quả dạng JSON
            print(json.dumps(result, ensure_ascii=False))
        else:
            print(json.dumps({
                "success": False,
                "message": "Không có input data"
            }, ensure_ascii=False))
            
    except Exception as e:
        error_result = {
            "success": False,
            "message": f"Lỗi: {str(e)}",
            "recommendations": []
        }
        print(json.dumps(error_result, ensure_ascii=False))
