import time
import psutil
import numpy as np

def measure_performance(func, *args, **kwargs):
    process = psutil.Process()
    start_mem = process.memory_info().rss / 1024 / 1024
    start = time.time()
    try:
        result = func(*args, **kwargs)
    except Exception as e:
        print(f"Lỗi khi chạy {func.__name__}: {str(e)}")
        result = []
    end = time.time()
    end_mem = process.memory_info().rss / 1024 / 1024
    peak_mem = (process.memory_info().peak_wset / 1024 / 1024) - start_mem
    return round(end - start, 2), round(max(end_mem - start_mem, peak_mem), 2), result


def analyze_results(cohuis):
    if not cohuis:
        return {'patterns': 0, 'avg_len': 0.0, 'top_util': 0.0, 'avg_correlation': 0.0}
    patterns = len(cohuis)
    total_len = sum(len(itemset) for itemset, _, _ in cohuis)
    avg_len = total_len / patterns if patterns > 0 else 0.0
    top_util = max(utility for _, utility, _ in cohuis) if cohuis else 0.0
    avg_correlation = sum(correlation for _, _, correlation in cohuis) / patterns if patterns > 0 else 0.0
    return {
        'patterns': patterns,
        'avg_len': round(avg_len, 2),
        'top_util': round(top_util, 2),
        'avg_correlation': round(avg_correlation, 2)
    }


def calculate_stability_score(patterns_list):
    if len(patterns_list) < 2:
        return 0.0
    variance = np.var(patterns_list)
    mean_patterns = np.mean(patterns_list)
    if mean_patterns == 0:
        return 0.0
    return round(1.0 / (1.0 + variance / mean_patterns), 3)