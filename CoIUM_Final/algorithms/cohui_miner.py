"""
Thuật toán CoHUI-Miner (2020):
- Dựa trên Prefix-Projection + Look-Ahead (LA) pruning
- Mỗi prefix được mở rộng đệ quy theo lexicographic order
"""

from heuristics import twu_pruning
from metrics import calculate_correlation, calculate_transaction_utility
from data_utils import load_profits_from_file, generate_profits, save_profits_to_file
from collections import defaultdict
import itertools


def cohui_miner(dataset, minutil, mincor, maxlen=5, dataset_name="unknown"):
    """
    Chuẩn thuật toán CoHUI-Miner (2020):
    - Dựa trên Prefix-Projection + Look-Ahead (LA) pruning
    - Mỗi prefix được mở rộng đệ quy theo lexicographic order
    """
    if not dataset:
        return []

    items = sorted(set(i for trans in dataset for i in trans))
    profits = load_profits_from_file(dataset_name)
    if profits is None:
        profits = generate_profits(items)
        save_profits_to_file(profits, dataset_name)

    tu_values = [calculate_transaction_utility(t, profits) for t in dataset]
    total_tu = sum(tu_values)
    minutil_abs = minutil * total_tu

    # Tính support cho correlation
    supports = defaultdict(int)
    for trans in dataset:
        for k in range(1, min(len(trans) + 1, maxlen + 1)):
            for comb in itertools.combinations(trans, k):
                supports[frozenset(comb)] += 1

    cohuis = []

    def project(prefix, projected_db):
        """Đệ quy mở rộng theo prefix"""
        if len(prefix) >= maxlen:
            return

        # Tính utility hiện tại
        prefix_util = sum(sum(profits[i] for i in t if i in prefix) for t in projected_db)
        if prefix_util < minutil_abs:
            return

        # Tính correlation của prefix
        if len(prefix) > 1:
            corr = calculate_correlation(prefix, supports)
            if corr < mincor:
                return
        else:
            corr = 1.0

        # Nếu đủ điều kiện → thêm vào CoHUIs
        cohuis.append((prefix.copy(), prefix_util, corr))

        # Mở rộng prefix
        items_in_proj = sorted(set(i for t in projected_db for i in t if i not in prefix))
        for item in items_in_proj:
            new_prefix = prefix + [item]
            new_projected = [t for t in projected_db if set(new_prefix).issubset(t)]
            if not new_projected:
                continue

            # Look-Ahead pruning: nếu utility upper bound < minUtil thì bỏ
            upper_bound = sum(calculate_transaction_utility(t, profits) for t in new_projected)
            if upper_bound < minutil_abs:
                continue

            project(new_prefix, new_projected)

    # Bắt đầu với từng item đơn
    for item in items:
        if not twu_pruning(item, dataset, profits, minutil_abs):
            continue
        trans_proj = [t for t in dataset if item in t]
        project([item], trans_proj)

    return cohuis