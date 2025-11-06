"""
Thuật toán CoUPM (2019) – Correlation-aware Utility Pattern Miner
Dựa trên Revised Utility-List (tid, iutil, rutil, support)
Duyệt depth-first, dùng TWU + Correlation pruning
"""

from structures import UtilityList, construct_utility_list_combined
from heuristics import twu_pruning, correlation_pruning, utility_upper_bound_pruning
from metrics import calculate_correlation, calculate_transaction_utility
from data_utils import load_profits_from_file, generate_profits, save_profits_to_file
from collections import defaultdict
import itertools


def search_larger_itemsets_optimized(current_itemsets, dataset, profits, supports,
                                     minutil_abs, mincor, maxlen, cohuis):
    """Tìm kiếm đệ quy tối ưu cho itemset lớn hơn (chung cho cả 3 thuật toán)"""
    if not current_itemsets or len(current_itemsets[0][0]) >= maxlen:
        return

    next_level_itemsets = []
    max_combinations = min(100, len(current_itemsets) * (len(current_itemsets) - 1) // 2)
    combination_count = 0

    for i in range(len(current_itemsets)):
        for j in range(i + 1, len(current_itemsets)):
            if combination_count >= max_combinations:
                break

            itemset_x, ul_x = current_itemsets[i]
            itemset_y, ul_y = current_itemsets[j]

            if len(itemset_x) == len(itemset_y) and itemset_x[:-1] == itemset_y[:-1]:
                new_itemset = itemset_x + [itemset_y[-1]]
                if len(new_itemset) > maxlen:
                    continue

                ul_combined = construct_utility_list_combined(ul_x, ul_y, dataset, profits)
                if not ul_combined or not utility_upper_bound_pruning(ul_combined, minutil_abs):
                    continue

                actual_utility = ul_combined.get_total_utility()
                if actual_utility >= minutil_abs:
                    correlation = calculate_correlation(new_itemset, supports)
                    if correlation >= mincor:
                        cohuis.append((new_itemset, actual_utility, correlation))
                        next_level_itemsets.append((new_itemset, ul_combined))

                combination_count += 1

        if combination_count >= max_combinations:
            break

    if next_level_itemsets:
        search_larger_itemsets_optimized(next_level_itemsets, dataset, profits, supports,
                                         minutil_abs, mincor, maxlen, cohuis)


def coup_miner(dataset, minutil, mincor, maxlen=5, dataset_name="unknown"):
    """
    Chuẩn thuật toán CoUPM (2019):
    - Dựa trên Revised Utility-List (tid, iutil, rutil, support)
    - Duyệt depth-first, sử dụng TWU-Pruning và Correlation-Pruning
    """
    if not dataset:
        return []

    items = sorted(set(i for trans in dataset for i in trans))
    profits = load_profits_from_file(dataset_name)
    if profits is None:
        profits = generate_profits(items)
        save_profits_to_file(profits, dataset_name)

    # Tính TU & TWU
    tu_values = [calculate_transaction_utility(t, profits) for t in dataset]
    total_tu = sum(tu_values)
    minutil_abs = minutil * total_tu

    # Tính support
    supports = defaultdict(int)
    for trans in dataset:
        for k in range(1, min(len(trans) + 1, maxlen + 1)):
            for comb in itertools.combinations(trans, k):
                supports[frozenset(comb)] += 1

    # Tạo Revised Utility-List cho từng item
    utility_lists = {}
    for item in items:
        ul = UtilityList(item)
        for tid, trans in enumerate(dataset):
            if item in trans:
                iutil = profits[item]
                # rutil = tổng utility của các item KHÁC trong trans (khác với CoIUM)
                rutil = sum(profits[i] for i in trans if i != item)
                ul.add_element(tid, iutil, rutil)
        utility_lists[item] = ul

    # Loại bỏ item không đủ TWU
    filtered_items = [i for i in items if twu_pruning(i, dataset, profits, minutil_abs)]

    cohuis = []

    # 1-itemset
    for item in filtered_items:
        ul = utility_lists[item]
        if ul.get_total_utility() >= minutil_abs:
            cohuis.append(([item], ul.get_total_utility(), 1.0))

    # 2-itemset
    for i in range(len(filtered_items)):
        for j in range(i + 1, len(filtered_items)):
            a, b = filtered_items[i], filtered_items[j]
            if not correlation_pruning([a, b], supports, mincor):
                continue

            ul_ab = construct_utility_list_combined(utility_lists[a], utility_lists[b], dataset, profits)
            if not ul_ab:
                continue

            if not utility_upper_bound_pruning(ul_ab, minutil_abs):
                continue

            if ul_ab.get_total_utility() >= minutil_abs:
                cohuis.append(([a, b], ul_ab.get_total_utility(), calculate_correlation([a, b], supports)))

    # Mở rộng depth-first
    search_larger_itemsets_optimized(
        [([i], utility_lists[i]) for i in filtered_items],
        dataset, profits, supports, minutil_abs, mincor, maxlen, cohuis
    )

    return cohuis