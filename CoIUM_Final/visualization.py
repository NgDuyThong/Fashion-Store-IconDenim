"""
Tất cả các hàm tạo biểu đồ cho CoIUM_Demo
- Biểu đồ riêng cho từng dataset
- Biểu đồ độ ổn định
- Biểu đồ tổng hợp cuối cùng
- So sánh hiệu suất, độ ổn định, patterns
"""

import os
import numpy as np
import matplotlib.pyplot as plt


def create_dataset_charts(dataset_results, mincor_values, minutil_values, best_mu, dataset_name):
    """Tạo biểu đồ cho một dataset cụ thể (time, mem, patterns)"""
    colors = {"CoIUM": "tab:blue", "CoUPM": "tab:orange", "CoHUI-Miner": "tab:green"}
    metrics = ["time", "mem", "patterns"]

    for mu in minutil_values:
        fig, axs = plt.subplots(1, len(metrics), figsize=(15, 5))
        fig.suptitle(f'{dataset_name.upper()} - minUtil = {mu} ({mu * 100}% của TU)', fontsize=16)

        for j, metric in enumerate(metrics):
            ax = axs[j]

            for algo_name, color in colors.items():
                if mu in dataset_results and algo_name in dataset_results[mu]:
                    times, mems, patterns = dataset_results[mu][algo_name]
                    y_values = times if metric == "time" else mems if metric == "mem" else patterns

                    ax.plot(mincor_values, y_values, marker='o',
                            label=f"{algo_name}", color=color, alpha=0.7, linewidth=2)

            ax.set_xlabel("minCor")
            ax.set_title(f"{metric.upper()}")
            ax.grid(True, alpha=0.3)
            if j == 0:
                ax.legend()

        plt.tight_layout()
        os.makedirs("Chart", exist_ok=True)
        plt.savefig(f"Chart/{dataset_name}_minutil_{mu}.png", dpi=300, bbox_inches='tight')
        plt.close()
        print(f"  Biểu đồ {dataset_name} cho minUtil={mu} đã lưu tại Chart/{dataset_name}_minutil_{mu}.png")

    create_dataset_stability_chart(dataset_results, mincor_values, minutil_values, best_mu, dataset_name)


def create_dataset_stability_chart(dataset_results, mincor_values, minutil_values, best_mu, dataset_name):
    """Tạo biểu đồ độ ổn định cho một dataset"""
    fig, axs = plt.subplots(2, 2, figsize=(12, 8))
    fig.suptitle(f'Phân tích độ ổn định - {dataset_name.upper()}', fontsize=16)

    colors = {"CoIUM": "tab:blue", "CoUPM": "tab:orange", "CoHUI-Miner": "tab:green"}
    algorithms = ["CoIUM", "CoUPM", "CoHUI-Miner"]

    # Biểu đồ 1: So sánh độ ổn định thuật toán
    ax1 = axs[0, 0]
    algo_stability = []
    algo_labels = []

    for algo in algorithms:
        stability_for_algo = []
        for mu in minutil_values:
            if mu in dataset_results and algo in dataset_results[mu]:
                _, _, patterns = dataset_results[mu][algo]
                if len(patterns) > 1:
                    variance = np.var(patterns)
                    mean_patterns = np.mean(patterns)
                    stability = 1.0 / (1.0 + variance / mean_patterns) if mean_patterns > 0 else 0
                    stability_for_algo.append(stability)

        if stability_for_algo:
            algo_stability.append(np.mean(stability_for_algo))
            algo_labels.append(algo)

    bars = ax1.bar(algo_labels, algo_stability, color=[colors[algo] for algo in algo_labels], alpha=0.7)
    ax1.set_ylabel("Điểm số ổn định")
    ax1.set_title("So sánh độ ổn định thuật toán")
    ax1.grid(True, alpha=0.3)

    for bar, value in zip(bars, algo_stability):
        ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                 f'{value:.3f}', ha='center', va='bottom')

    # Biểu đồ 2: Xu hướng ổn định theo minUtil
    ax2 = axs[0, 1]
    for algo in algorithms:
        stability_trend = []
        for mu in minutil_values:
            if mu in dataset_results and algo in dataset_results[mu]:
                _, _, patterns = dataset_results[mu][algo]
                if len(patterns) > 1:
                    variance = np.var(patterns)
                    mean_patterns = np.mean(patterns)
                    stability = 1.0 / (1.0 + variance / mean_patterns) if mean_patterns > 0 else 0
                    stability_trend.append(stability)
                else:
                    stability_trend.append(0)
            else:
                stability_trend.append(0)

        ax2.plot(minutil_values, stability_trend, marker='o',
                 label=algo, linewidth=2, color=colors[algo])

    ax2.set_xlabel("minUtil")
    ax2.set_ylabel("Điểm số ổn định")
    ax2.set_title("Xu hướng ổn định theo minUtil")
    ax2.grid(True, alpha=0.3)
    ax2.legend()

    # Biểu đồ 3: Số patterns theo minUtil
    ax3 = axs[1, 0]
    for algo in algorithms:
        patterns_trend = []
        for mu in minutil_values:
            if mu in dataset_results and algo in dataset_results[mu]:
                _, _, patterns = dataset_results[mu][algo]
                patterns_trend.append(np.mean(patterns))
            else:
                patterns_trend.append(0)

        ax3.plot(minutil_values, patterns_trend, marker='s',
                 label=algo, linewidth=2, color=colors[algo])

    ax3.set_xlabel("minUtil")
    ax3.set_ylabel("Số patterns trung bình")
    ax3.set_title("Số patterns theo minUtil")
    ax3.grid(True, alpha=0.3)
    ax3.legend()

    # Biểu đồ 4: Thời gian theo minUtil
    ax4 = axs[1, 1]
    for algo in algorithms:
        times_trend = []
        for mu in minutil_values:
            if mu in dataset_results and algo in dataset_results[mu]:
                times, _, _ = dataset_results[mu][algo]
                times_trend.append(np.mean(times))
            else:
                times_trend.append(0)

        ax4.plot(minutil_values, times_trend, marker='D',
                 label=algo, linewidth=2, color=colors[algo])

    ax4.set_xlabel("minUtil")
    ax4.set_ylabel("Thời gian trung bình (s)")
    ax4.set_title("Thời gian theo minUtil")
    ax4.grid(True, alpha=0.3)
    ax4.legend()

    plt.tight_layout()
    plt.savefig(f"Chart/{dataset_name}_on_dinh.png", dpi=300, bbox_inches='tight')
    plt.close()
    print(f"  Biểu đồ độ ổn định {dataset_name} đã lưu tại Chart/{dataset_name}_on_dinh.png")


def create_final_summary_charts(all_results, mincor_values, minutil_values, best_minutil):
    """Tạo biểu đồ tổng hợp cuối cùng"""
    create_algorithm_comparison_chart(all_results, mincor_values, minutil_values)
    create_stability_by_dataset_chart(all_results, minutil_values, best_minutil)
    create_overview_chart(all_results, mincor_values, minutil_values, best_minutil)


def create_overview_chart(all_results, mincor_values, minutil_values, best_minutil):
    """Tạo biểu đồ tổng quan"""
    fig, axs = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('Tổng quan kết quả thí nghiệm', fontsize=16)

    colors = {"CoIUM": "tab:blue", "CoUPM": "tab:orange", "CoHUI-Miner": "tab:green"}
    datasets = list(all_results.keys())

    # Biểu đồ 1: Số patterns theo dataset
    ax1 = axs[0, 0]
    for dataset_name in datasets:
        stable_mu = best_minutil[dataset_name]
        if stable_mu in all_results[dataset_name] and "CoIUM" in all_results[dataset_name][stable_mu]:
            _, _, patterns = all_results[dataset_name][stable_mu]["CoIUM"]
            ax1.plot(mincor_values, patterns, marker='o',
                     label=f"{dataset_name} (minUtil={stable_mu})", linewidth=2)

    ax1.set_xlabel("minCor")
    ax1.set_ylabel("Số patterns")
    ax1.set_title("Số patterns theo dataset")
    ax1.grid(True, alpha=0.3)
    ax1.legend()

    # Biểu đồ 2: Thời gian theo dataset
    ax2 = axs[0, 1]
    for dataset_name in datasets:
        stable_mu = best_minutil[dataset_name]
        if stable_mu in all_results[dataset_name] and "CoIUM" in all_results[dataset_name][stable_mu]:
            times, _, _ = all_results[dataset_name][stable_mu]["CoIUM"]
            ax2.plot(mincor_values, times, marker='s',
                     label=f"{dataset_name} (minUtil={stable_mu})", linewidth=2)

    ax2.set_xlabel("minCor")
    ax2.set_ylabel("Thời gian (s)")
    ax2.set_title("Thời gian theo dataset")
    ax2.grid(True, alpha=0.3)
    ax2.legend()

    # Biểu đồ 3: So sánh thuật toán
    ax3 = axs[1, 0]
    algorithms = ["CoIUM", "CoUPM", "CoHUI-Miner"]

    for algo in algorithms:
        avg_times = []
        for mu in minutil_values:
            times_for_minutil = []
            for dataset_name in datasets:
                if mu in all_results[dataset_name] and algo in all_results[dataset_name][mu]:
                    times, _, _ = all_results[dataset_name][mu][algo]
                    times_for_minutil.extend(times)

            if times_for_minutil:
                avg_times.append(np.mean(times_for_minutil))
            else:
                avg_times.append(0)

        ax3.plot(minutil_values, avg_times, marker='D',
                 label=algo, linewidth=2, color=colors[algo])

    ax3.set_xlabel("minUtil")
    ax3.set_ylabel("Thời gian trung bình (s)")
    ax3.set_title("So sánh hiệu suất thuật toán")
    ax3.grid(True, alpha=0.3)
    ax3.legend()

    # Biểu đồ 4: Phân phối minUtil tốt nhất
    ax4 = axs[1, 1]
    minutil_counts = {}
    for dataset_name, stable_mu in best_minutil.items():
        minutil_counts[stable_mu] = minutil_counts.get(stable_mu, 0) + 1

    ax4.pie(minutil_counts.values(), labels=[f"minUtil={mu}" for mu in minutil_counts.keys()],
            autopct='%1.1f%%', startangle=90)
    ax4.set_title("Phân phối minUtil ổn định nhất")

    plt.tight_layout()
    plt.savefig("Chart/tong_quan_ket_qua.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("Biểu đồ tổng quan đã lưu tại Chart/tong_quan_ket_qua.png")


def create_algorithm_comparison_chart(all_results, mincor_values, minutil_values):
    """Tạo biểu đồ so sánh hiệu suất thuật toán"""
    fig, axs = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('So sánh hiệu suất thuật toán', fontsize=16)

    colors = {"CoIUM": "tab:blue", "CoUPM": "tab:orange", "CoHUI-Miner": "tab:green"}
    datasets = list(all_results.keys())

    # Biểu đồ 1: Thời gian trung bình theo thuật toán
    ax1 = axs[0, 0]
    algorithms = ["CoIUM", "CoUPM", "CoHUI-Miner"]

    for algo in algorithms:
        avg_times = []
        for mu in minutil_values:
            times_for_minutil = []
            for dataset_name in datasets:
                if mu in all_results[dataset_name] and algo in all_results[dataset_name][mu]:
                    times, _, _ = all_results[dataset_name][mu][algo]
                    times_for_minutil.extend(times)

            if times_for_minutil:
                avg_times.append(np.mean(times_for_minutil))
            else:
                avg_times.append(0)

        ax1.plot(minutil_values, avg_times, marker='o',
                 label=algo, linewidth=2, color=colors[algo])

    ax1.set_xlabel("minUtil")
    ax1.set_ylabel("Thời gian trung bình (s)")
    ax1.set_title("Thời gian trung bình theo thuật toán")
    ax1.grid(True, alpha=0.3)
    ax1.legend()

    # Biểu đồ 2: Số patterns trung bình theo thuật toán
    ax2 = axs[0, 1]
    for algo in algorithms:
        avg_patterns = []
        for mu in minutil_values:
            patterns_for_minutil = []
            for dataset_name in datasets:
                if mu in all_results[dataset_name] and algo in all_results[dataset_name][mu]:
                    _, _, patterns = all_results[dataset_name][mu][algo]
                    patterns_for_minutil.extend(patterns)

            if patterns_for_minutil:
                avg_patterns.append(np.mean(patterns_for_minutil))
            else:
                avg_patterns.append(0)

        ax2.plot(minutil_values, avg_patterns, marker='s',
                 label=algo, linewidth=2, color=colors[algo])

    ax2.set_xlabel("minUtil")
    ax2.set_ylabel("Số patterns trung bình")
    ax2.set_title("Số patterns trung bình theo thuật toán")
    ax2.grid(True, alpha=0.3)
    ax2.legend()

    # Biểu đồ 3: So sánh hiệu suất theo dataset
    ax3 = axs[1, 0]
    for dataset_name in datasets:
        dataset_times = []
        for mu in minutil_values:
            if mu in all_results[dataset_name] and "CoIUM" in all_results[dataset_name][mu]:
                times, _, _ = all_results[dataset_name][mu]["CoIUM"]
                dataset_times.append(np.mean(times))

        ax3.plot(minutil_values, dataset_times, marker='D',
                 label=dataset_name, linewidth=2)

    ax3.set_xlabel("minUtil")
    ax3.set_ylabel("Thời gian trung bình (s)")
    ax3.set_title("Hiệu suất theo dataset (CoIUM)")
    ax3.grid(True, alpha=0.3)
    ax3.legend()

    # Biểu đồ 4: Tỷ lệ giảm patterns khi tăng minUtil
    ax4 = axs[1, 1]
    for dataset_name in datasets:
        reduction_rates = []
        for algo in algorithms:
            patterns_for_algo = []
            for mu in minutil_values:
                if mu in all_results[dataset_name] and algo in all_results[dataset_name][mu]:
                    _, _, patterns = all_results[dataset_name][mu][algo]
                    patterns_for_algo.append(np.mean(patterns))

            if len(patterns_for_algo) >= 2 and patterns_for_algo[0] > 0:
                reduction = (patterns_for_algo[0] - patterns_for_algo[-1]) / patterns_for_algo[0] * 100
                reduction_rates.append(reduction)

        if reduction_rates:
            ax4.bar(dataset_name, np.mean(reduction_rates), alpha=0.7)

    ax4.set_ylabel("Tỷ lệ giảm patterns (%)")
    ax4.set_title("Tỷ lệ giảm patterns khi tăng minUtil")
    ax4.grid(True, alpha=0.3)
    ax4.tick_params(axis='x', rotation=45)

    plt.tight_layout()
    plt.savefig("Chart/so_sanh_hieu_suat_thuat_toan.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("Biểu đồ so sánh hiệu suất thuật toán đã lưu tại Chart/so_sanh_hieu_suat_thuat_toan.png")


def create_stability_by_dataset_chart(all_results, minutil_values, best_minutil):
    """Tạo biểu đồ độ ổn định theo dataset"""
    fig, axs = plt.subplots(2, 2, figsize=(15, 10))
    fig.suptitle('Phân tích độ ổn định theo dataset', fontsize=16)

    colors = {"CoIUM": "tab:blue", "CoUPM": "tab:orange", "CoHUI-Miner": "tab:green"}
    datasets = list(all_results.keys())
    algorithms = ["CoIUM", "CoUPM", "CoHUI-Miner"]

    # Biểu đồ 1: Độ ổn định theo dataset
    ax1 = axs[0, 0]
    dataset_stability = []
    dataset_labels = []

    for dataset_name in datasets:
        stable_mu = best_minutil[dataset_name]
        stability_for_dataset = []
        for algo in algorithms:
            if stable_mu in all_results[dataset_name] and algo in all_results[dataset_name][stable_mu]:
                _, _, patterns = all_results[dataset_name][stable_mu][algo]
                if len(patterns) > 1:
                    variance = np.var(patterns)
                    mean_patterns = np.mean(patterns)
                    stability = 1.0 / (1.0 + variance / mean_patterns) if mean_patterns > 0 else 0
                    stability_for_dataset.append(stability)

        if stability_for_dataset:
            dataset_stability.append(np.mean(stability_for_dataset))
            dataset_labels.append(f"{dataset_name}\nminUtil={stable_mu}")

    bars = ax1.bar(dataset_labels, dataset_stability, alpha=0.7)
    ax1.set_ylabel("Điểm số ổn định")
    ax1.set_title("Độ ổn định theo dataset")
    ax1.grid(True, alpha=0.3)
    ax1.tick_params(axis='x', rotation=45)

    for bar, value in zip(bars, dataset_stability):
        ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                 f'{value:.3f}', ha='center', va='bottom')

    # Biểu đồ 2: So sánh thuật toán theo độ ổn định
    ax2 = axs[0, 1]
    algo_stability = []
    algo_labels = []

    for algo in algorithms:
        stability_for_algo = []
        for dataset_name in datasets:
            stable_mu = best_minutil[dataset_name]
            if stable_mu in all_results[dataset_name] and algo in all_results[dataset_name][stable_mu]:
                _, _, patterns = all_results[dataset_name][stable_mu][algo]
                if len(patterns) > 1:
                    variance = np.var(patterns)
                    mean_patterns = np.mean(patterns)
                    stability = 1.0 / (1.0 + variance / mean_patterns) if mean_patterns > 0 else 0
                    stability_for_algo.append(stability)

        if stability_for_algo:
            algo_stability.append(np.mean(stability_for_algo))
            algo_labels.append(algo)

    bars = ax2.bar(algo_labels, algo_stability, color=[colors[algo] for algo in algo_labels], alpha=0.7)
    ax2.set_ylabel("Điểm số ổn định trung bình")
    ax2.set_title("So sánh độ ổn định thuật toán")
    ax2.grid(True, alpha=0.3)

    for bar, value in zip(bars, algo_stability):
        ax2.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                 f'{value:.3f}', ha='center', va='bottom')

    # Biểu đồ 3: Xu hướng ổn định theo minUtil
    ax3 = axs[1, 0]
    for algo in algorithms:
        stability_trend = []
        for mu in minutil_values:
            stability_for_minutil = []
            for dataset_name in datasets:
                if mu in all_results[dataset_name] and algo in all_results[dataset_name][mu]:
                    _, _, patterns = all_results[dataset_name][mu][algo]
                    if len(patterns) > 1:
                        variance = np.var(patterns)
                        mean_patterns = np.mean(patterns)
                        stability = 1.0 / (1.0 + variance / mean_patterns) if mean_patterns > 0 else 0
                        stability_for_minutil.append(stability)

            if stability_for_minutil:
                stability_trend.append(np.mean(stability_for_minutil))
            else:
                stability_trend.append(0)

        ax3.plot(minutil_values, stability_trend, marker='o',
                 label=algo, linewidth=2, color=colors[algo])

    ax3.set_xlabel("minUtil")
    ax3.set_ylabel("Điểm số ổn định trung bình")
    ax3.set_title("Xu hướng ổn định theo minUtil")
    ax3.grid(True, alpha=0.3)
    ax3.legend()

    # Biểu đồ 4: Phân phối minUtil tốt nhất
    ax4 = axs[1, 1]
    minutil_counts = {}
    for dataset_name, stable_mu in best_minutil.items():
        minutil_counts[stable_mu] = minutil_counts.get(stable_mu, 0) + 1

    ax4.pie(minutil_counts.values(), labels=[f"minUtil={mu}" for mu in minutil_counts.keys()],
            autopct='%1.1f%%', startangle=90)
    ax4.set_title("Phân phối các giá trị minUtil ổn định nhất")

    plt.tight_layout()
    plt.savefig("Chart/phan_tich_on_dinh_theo_dataset.png", dpi=300, bbox_inches='tight')
    plt.close()
    print("Biểu đồ phân tích ổn định theo dataset đã lưu tại Chart/phan_tich_on_dinh_theo_dataset.png")