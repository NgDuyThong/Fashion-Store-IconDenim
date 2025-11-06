"""
SCRIPT CHẠY THUẬT TOÁN CoIUM CHO DỮ LIỆU FASHION STORE
Đồ án tốt nghiệp
"""

import numpy as np
from data_utils import load_dataset, load_profits_from_file
from algorithms.coium import coium
from algorithms.coup_miner import coup_miner
from algorithms.cohui_miner import cohui_miner
from evaluation import measure_performance
from visualization import create_dataset_charts
import time


def run_fashion_store_analysis():
    """Chạy phân tích CoIUM cho Fashion Store"""
    
    print("\n" + "="*80)
    print("PHAN TICH CORRELATION PATTERNS - FASHION STORE")
    print("="*80 + "\n")
    
    # Load dataset
    print("Dang load du lieu...")
    dataset_path = "datasets/fashion_store.dat"
    
    try:
        data = load_dataset(dataset_path)
        print(f"Da load {len(data)} transactions")
        
        # Load profits manually (vì format khác: item:profit)
        profit_path = "profits/fashion_store_profits.txt"
        profits = {}
        with open(profit_path, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 2:
                    item, profit = parts
                    profits[int(item)] = int(profit)
        print(f"Da load profits cho {len(profits)} items\n")
    except Exception as e:
        print(f"Loi khi load du lieu: {e}")
        return
    
    # Thống kê cơ bản
    all_items = set()
    for trans in data:
        all_items.update(trans)
    
    trans_lengths = [len(t) for t in data]
    
    print("THONG KE DU LIEU:\n")
    print(f"  So transactions     : {len(data)}")
    print(f"  So items unique     : {len(all_items)}")
    print(f"  Items/transaction   : {np.mean(trans_lengths):.2f} (avg)")
    print(f"                        {min(trans_lengths)} (min) - {max(trans_lengths)} (max)")
    print(f"  Tong so items       : {sum(trans_lengths)}")
    
    # Top items
    item_count = {}
    for trans in data:
        for item in trans:
            item_count[item] = item_count.get(item, 0) + 1
    
    print(f"\nTOP 10 SAN PHAM PHO BIEN:\n")
    for i, (item, count) in enumerate(sorted(item_count.items(), key=lambda x: x[1], reverse=True)[:10], 1):
        support = count / len(data) * 100
        profit = profits.get(item, 0)
        print(f"  {i:2d}. Item {item:3d}: {count:3d} lan ({support:5.2f}%) - Profit: {profit:,}d")
    
    # Cấu hình thông số
    print("\n" + "="*80)
    print("CAU HINH THONG SO")
    print("="*80 + "\n")
    
    configs = [
        # Test với mincor thấp để tìm nhiều patterns
        {"mincor": 0.1, "minutil": 0.001, "maxlen": 3},
        {"mincor": 0.2, "minutil": 0.001, "maxlen": 3},
        {"mincor": 0.3, "minutil": 0.001, "maxlen": 4},
        {"mincor": 0.1, "minutil": 0.002, "maxlen": 3},
    ]
    
    all_results = []
    
    for idx, config in enumerate(configs, 1):
        mincor = config["mincor"]
        minutil = config["minutil"]
        maxlen = config["maxlen"]
        
        print(f"\n{'-'*80}")
        print(f"EXPERIMENT #{idx}: mincor={mincor}, minutil={minutil}, maxlen={maxlen}")
        print(f"{'-'*80}\n")
        
        # Chạy 3 thuật toán
        algorithms = {
            "CoIUM": coium,
            "CoUPM": coup_miner,
            "CoHUI-Miner": cohui_miner
        }
        
        results = {}
        
        for algo_name, algo_func in algorithms.items():
            print(f"Dang chay {algo_name}...")
            
            start_time = time.time()
            # CoIUM nhận profits parameter, các thuật toán khác không
            if algo_name == "CoIUM":
                itemsets = algo_func(data, minutil, mincor, maxlen, "fashion_store", profits)
            else:
                itemsets = algo_func(data, minutil, mincor, maxlen, "fashion_store")
            runtime = time.time() - start_time
            
            # CoIUM trả về list of tuples: (itemset, utility, correlation)
            # Tách ra thành 3 lists riêng
            itemset_list = []
            utilities = []
            correlations = []
            
            for result in itemsets:
                if isinstance(result, tuple) and len(result) == 3:
                    itemset_list.append(result[0])
                    utilities.append(result[1])
                    correlations.append(result[2])
                else:
                    # Fallback nếu format khác
                    itemset_list.append(result)
                    utilities.append(0)
                    correlations.append(0)
            
            results[algo_name] = {
                'itemsets': itemset_list,
                'runtime': runtime,
                'count': len(itemset_list),
                'utilities': utilities,
                'correlations': correlations
            }
            
            print(f"   Hoan thanh: {len(itemset_list)} itemsets, {runtime:.3f}s")
        
        # So sánh kết quả
        print(f"\nKET QUA SO SANH:\n")
        print(f"{'Thuat toan':<15} {'Itemsets':<12} {'Runtime':<12} {'Avg Utility':<15} {'Avg Corr':<12}")
        print(f"{'-'*75}")
        
        for algo_name, res in results.items():
            avg_util = np.mean(res['utilities']) if res['utilities'] else 0
            avg_corr = np.mean(res['correlations']) if res['correlations'] else 0
            print(f"{algo_name:<15} {res['count']:<12} {res['runtime']:<12.3f} {avg_util:<15,.0f} {avg_corr:<12.3f}")
        
        # Lưu top patterns
        print(f"\nTOP 10 CORRELATION PATTERNS (CoHUI-Miner):\n")
        cohui_results = results['CoHUI-Miner']
        if cohui_results['itemsets']:
            # Sort theo correlation
            sorted_indices = sorted(range(len(cohui_results['correlations'])), 
                                  key=lambda i: cohui_results['correlations'][i], 
                                  reverse=True)[:10]
            
            for rank, idx in enumerate(sorted_indices, 1):
                itemset = cohui_results['itemsets'][idx]
                corr = cohui_results['correlations'][idx]
                util = cohui_results['utilities'][idx]
                support = sum(1 for t in data if set(itemset).issubset(set(t)))
                
                print(f"  {rank:2d}. {{{', '.join(map(str, itemset))}}}")
                print(f"      - Correlation: {corr:.4f}")
                print(f"      - Utility: {util:,}d")
                print(f"      - Support: {support}/{len(data)} ({support/len(data)*100:.1f}%)")
                print()
        
        all_results.append({
            'config': config,
            'results': results
        })
    
    print("\n" + "="*80)
    print("PHAN TICH HOAN TAT!")
    print("="*80 + "\n")
    
    # Tạo biểu đồ
    print("Dang tao bieu do...")
    try:
        # Tạo visualization cho config tốt nhất
        best_config = configs[0]
        create_dataset_charts(
            "fashion_store",
            data,
            profits,
            all_results[0]['results'],
            best_config['mincor'],
            best_config['minutil']
        )
        print("Da tao bieu do thanh cong!\n")
    except Exception as e:
        print(f"Khong the tao bieu do: {e}\n")
    
    return all_results


if __name__ == "__main__":
    run_fashion_store_analysis()
