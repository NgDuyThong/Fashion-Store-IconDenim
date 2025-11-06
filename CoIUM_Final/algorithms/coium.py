import sys
from structures import construct_utility_list, construct_utility_list_combined
from heuristics import twu_pruning, correlation_pruning, utility_upper_bound_pruning
from metrics import calculate_twu, calculate_correlation, defaultdict
from data_utils import load_profits_from_file, generate_profits, save_profits_to_file
import itertools

def search_larger_itemsets_optimized(current_itemsets, dataset, profits, supports,
                                     minutil_abs, mincor, maxlen, cohuis):
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


def coium(dataset, minutil, mincor, maxlen=5, dataset_name="unknown", profits=None):
    if not dataset:
        return []

    items = sorted(set(i for trans in dataset for i in trans))
    
    # Sử dụng profits được truyền vào, nếu không có thì mới load từ file
    if profits is None:
        profits = load_profits_from_file(dataset_name)
        if profits is None:
            profits = generate_profits(items)
            save_profits_to_file(profits, dataset_name)
    
    # Đảm bảo tất cả items đều có profit
    for item in items:
        if item not in profits:
            print(f"Warning: Item {item} không có profit, sử dụng giá trị mặc định", file=sys.stderr)
            profits[item] = 1  # Default profit

    tu_values = [sum(profits.get(i, 0) for i in trans) for trans in dataset]
    total_tu = sum(tu_values)
    minutil_abs = minutil * total_tu

    candidate_items = [item for item in items if twu_pruning(item, dataset, profits, minutil_abs)]
    candidate_items.sort(key=lambda x: calculate_twu(x, dataset, profits), reverse=True)

    utility_lists = {item: construct_utility_list(item, dataset, profits) for item in candidate_items}

    supports = defaultdict(int)
    for trans in dataset:
        for k in range(1, min(len(trans) + 1, maxlen + 1)):
            for comb in itertools.combinations(trans, k):
                supports[frozenset(comb)] += 1

    valid_pairs = []
    for i in range(len(candidate_items)):
        for j in range(i + 1, len(candidate_items)):
            a, b = candidate_items[i], candidate_items[j]
            if correlation_pruning([a, b], supports, mincor):
                ul_combined = construct_utility_list_combined(utility_lists[a], utility_lists[b], dataset, profits)
                if ul_combined and utility_upper_bound_pruning(ul_combined, minutil_abs):
                    valid_pairs.append(([a, b], ul_combined))

    cohuis = []
    for item in candidate_items:
        ul = utility_lists[item]
        if ul.get_total_utility() >= minutil_abs:
            cohuis.append(([item], ul.get_total_utility(), 1.0))

    for itemset, ul in valid_pairs:
        if ul.get_total_utility() >= minutil_abs:
            correlation = calculate_correlation(itemset, supports)
            if correlation >= mincor:
                cohuis.append((itemset, ul.get_total_utility(), correlation))

    search_larger_itemsets_optimized(valid_pairs, dataset, profits, supports,
                                     minutil_abs, mincor, maxlen, cohuis)

    return cohuis