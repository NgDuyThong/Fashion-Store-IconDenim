"""
PHÂN TÍCH KẾT QUẢ CORRELATION ĐỂ TẠO BẢNG GỢI Ý SẢN PHẨM
Đồ án tốt nghiệp - Fashion Store
"""

import json
from collections import defaultdict

def analyze_correlations():
    """Phân tích dữ liệu để tìm các sản phẩm tương quan"""
    
    print("\n" + "="*80)
    print("PHAN TICH CAC SAN PHAM TUONG QUAN")
    print("="*80 + "\n")
    
    # Load transactions
    print("Dang load du lieu transactions...")
    transactions = []
    with open("datasets/fashion_store.dat", 'r', encoding='utf-8') as f:
        for line in f:
            items = [int(x) for x in line.strip().split() if x.isdigit()]
            if items:
                transactions.append(items)
    
    print(f"Da load {len(transactions)} transactions\n")
    
    # Tính toán co-occurrence matrix
    print("Dang tinh toan co-occurrence matrix...")
    co_occurrence = defaultdict(lambda: defaultdict(int))
    item_count = defaultdict(int)
    
    for trans in transactions:
        # Đếm số lần xuất hiện của mỗi item
        for item in trans:
            item_count[item] += 1
        
        # Đếm số lần 2 items xuất hiện cùng nhau
        for i in range(len(trans)):
            for j in range(i + 1, len(trans)):
                item1, item2 = trans[i], trans[j]
                co_occurrence[item1][item2] += 1
                co_occurrence[item2][item1] += 1
    
    print(f"Da phan tich {len(item_count)} san pham unique\n")
    
    # Tính correlation score cho mỗi cặp
    print("Dang tinh correlation scores...")
    correlations = {}
    
    for item1 in co_occurrence:
        correlations[item1] = []
        for item2, co_count in co_occurrence[item1].items():
            # Tính correlation score (Lift)
            # Lift = P(A,B) / (P(A) * P(B))
            prob_both = co_count / len(transactions)
            prob_item1 = item_count[item1] / len(transactions)
            prob_item2 = item_count[item2] / len(transactions)
            
            lift = prob_both / (prob_item1 * prob_item2) if prob_item1 > 0 and prob_item2 > 0 else 0
            
            # Lưu thông tin
            correlations[item1].append({
                'item': item2,
                'co_occurrence': co_count,
                'lift': lift,
                'support': co_count / len(transactions) * 100
            })
        
        # Sort theo lift giảm dần
        correlations[item1].sort(key=lambda x: x['lift'], reverse=True)
    
    print("Hoan thanh!\n")
    
    # Hiển thị top correlations cho một số sản phẩm phổ biến
    print("="*80)
    print("TOP 5 SAN PHAM TUONG QUAN CHO MOT SO SAN PHAM PHO BIEN")
    print("="*80 + "\n")
    
    # Lấy top 15 sản phẩm phổ biến nhất
    top_items = sorted(item_count.items(), key=lambda x: x[1], reverse=True)[:15]
    
    for item_id, count in top_items:
        print(f"\nSan pham #{item_id} (xuat hien {count} lan - {count/len(transactions)*100:.2f}%):")
        print(f"{'Rank':<6} {'Item':<8} {'Co-occur':<12} {'Lift':<10} {'Support %':<12}")
        print("-" * 60)
        
        top_corr = correlations[item_id][:5]
        for rank, corr in enumerate(top_corr, 1):
            print(f"{rank:<6} #{corr['item']:<7} {corr['co_occurrence']:<12} "
                  f"{corr['lift']:<10.3f} {corr['support']:<12.2f}")
    
    # Tạo file JSON để sử dụng trong API
    print("\n\n" + "="*80)
    print("TAO FILE JSON CHO API")
    print("="*80 + "\n")
    
    # Tạo recommendation map
    recommendation_map = {}
    for item_id in correlations:
        # Lấy top 10 sản phẩm tương quan nhất
        top_10 = [c['item'] for c in correlations[item_id][:10]]
        recommendation_map[str(item_id)] = top_10
    
    # Lưu vào file
    output_file = "correlation_recommendations.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(recommendation_map, f, indent=2, ensure_ascii=False)
    
    print(f"Da luu file: {output_file}")
    print(f"So luong san pham co recommendations: {len(recommendation_map)}\n")
    
    # Thống kê
    print("THONG KE:")
    avg_recommendations = sum(len(v) for v in recommendation_map.values()) / len(recommendation_map)
    print(f"  - Trung binh {avg_recommendations:.1f} recommendations/san pham")
    
    # Kiểm tra các sản phẩm có ít recommendations
    low_rec = {k: len(v) for k, v in recommendation_map.items() if len(v) < 5}
    if low_rec:
        print(f"  - {len(low_rec)} san pham co it hon 5 recommendations:")
        for item, count in sorted(low_rec.items(), key=lambda x: x[1])[:5]:
            print(f"    + San pham #{item}: chi co {count} recommendations")
    
    print("\n" + "="*80)
    print("HOAN TAT!")
    print("="*80 + "\n")
    
    return recommendation_map


if __name__ == "__main__":
    analyze_correlations()
