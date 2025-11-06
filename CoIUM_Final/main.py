import numpy as np
from data_utils import load_dataset, load_profits_from_file, generate_profits, save_profits_to_file
from algorithms.coium import coium
from algorithms.coup_miner import coup_miner
from algorithms.cohui_miner import cohui_miner
from evaluation import measure_performance, analyze_results, calculate_stability_score
from metrics import calculate_transaction_utility
from visualization import (
    create_dataset_charts,
    create_final_summary_charts
)


def run_comprehensive_experiments():
    """Chạy thí nghiệm trên tất cả 5 dataset"""
    datasets = {
        "chess": "datasets/chess.dat",
        "mushroom": "datasets/mushroom.dat",
        "retail": "datasets/retail.csv",
        "T10I4D100K": "datasets/T10I4D100K.dat",
        "T40I10D100K": "datasets/T40I10D100K.dat"
    }

    algos = {
        "CoIUM": coium,
        "CoUPM": coup_miner,
        "CoHUI-Miner": cohui_miner
    }

    mincor_values = [0.1, 0.3, 0.5, 0.7, 0.9]
    minutil_values = [0.001, 0.002]
    maxlen = 3

    all_results = {}
    stability_scores = {}
    best_minutil = {}

    for name, file_path in datasets.items():
        print(f"\n{'=' * 60}")
        print(f"Đang xử lý dataset: {name.upper()}")
        print(f"{'=' * 60}")

        try:
            data = load_dataset(file_path)
        except Exception as e:
            print(f"Lỗi khi tải {name}: {e}")
            continue

        items = sorted(set(i for trans in data for i in trans))

        # TẢI HOẶC SINH PROFITS MỘT LẦN DUY NHẤT
        profits = load_profits_from_file(name)
        if profits is None:
            profits = generate_profits(items)
            save_profits_to_file(profits, name)

        # TÍNH TỔNG TU DỰA TRÊN PROFITS VÀ HÀM CHUẨN
        tu_total = sum(calculate_transaction_utility(trans, profits) for trans in data)

        print(f"[{name}] Tổng TU = {tu_total:.2f}")
        print(f"[{name}] Số items = {len(items)}")
        print(f"[{name}] Số transactions = {len(data)}")

        all_results[name] = {}
        stability_scores[name] = {}

        for mu in minutil_values:
            all_results[name][mu] = {}
            print(f"\n--- minUtil = {mu} ({mu * 100}% của TU) ---")

            for algo_name, algo_func in algos.items():
                print(f"\n[{algo_name}]")
                times, mems, patterns_list = [], [], []

                for mc in mincor_values:
                    time_taken, mem_used, cohuis = measure_performance(
                        algo_func, data, mu, mc, maxlen, name
                    )
                    analysis = analyze_results(cohuis)
                    times.append(time_taken)
                    mems.append(mem_used)
                    patterns_list.append(analysis['patterns'])

                    print(f"  minCor={mc}: {analysis['patterns']} patterns | "
                          f"avg_len={analysis['avg_len']} | "
                          f"top_util={analysis['top_util']} | "
                          f"time={time_taken:.2f}s | mem={mem_used:.2f}MB")

                all_results[name][mu][algo_name] = (times, mems, patterns_list)

            stability_scores[name][mu] = {}
            for algo_name in algos.keys():
                _, _, patterns = all_results[name][mu][algo_name]
                stability_scores[name][mu][algo_name] = calculate_stability_score(patterns)

        # Tìm minutil ổn định nhất
        best_score = 0
        best_mu = minutil_values[0]
        for mu in minutil_values:
            avg_stability = np.mean([stability_scores[name][mu][algo] for algo in algos.keys()])
            if avg_stability > best_score:
                best_score = avg_stability
                best_mu = mu
        best_minutil[name] = best_mu
        print(f"\n[{name}] minUtil ổn định nhất: {best_mu} (điểm số: {best_score:.3f})")

        print(f"\nĐang tạo biểu đồ cho dataset {name}...")
        create_dataset_charts(all_results[name], mincor_values, minutil_values, best_mu, name)
        print(f"Hoàn thành biểu đồ cho dataset {name}!")

    print(f"\n{'=' * 60}")
    print("Tạo biểu đồ tổng hợp cuối cùng...")
    print(f"{'=' * 60}")
    create_final_summary_charts(all_results, mincor_values, minutil_values, best_minutil)

    return all_results, best_minutil, stability_scores


if __name__ == "__main__":
    print("=== Chạy phân tích CoIUM toàn diện ===")
    print("Tính năng:")
    print("- Tất cả 5 dataset: chess, mushroom, retail, T10I4D100K, T40I10D100K")
    print("- Profits nhất quán qua các lần chạy")
    print("- Phân tích ổn định và chọn minUtil tối ưu")
    print("- Biểu đồ riêng cho các giá trị minUtil ổn định nhất")
    print("- So sánh toàn diện qua tất cả dataset")
    print()

    all_results, best_minutil, stability_scores = run_comprehensive_experiments()

    print(f"\n{'=' * 60}")
    print("TÓM TẮT CÁC GIÁ TRỊ minUtil ỔN ĐỊNH NHẤT:")
    print(f"{'=' * 60}")
    for dataset_name, stable_mu in best_minutil.items():
        print(f"{dataset_name:15}: minUtil = {stable_mu} (ổn định nhất)")

    print(f"\n{'=' * 60}")
    print("THÍ NGHIỆM HOÀN THÀNH THÀNH CÔNG!")
    print(f"{'=' * 60}")