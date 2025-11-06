from metrics import calculate_twu, calculate_correlation

def twu_pruning(item, dataset, profits, minutil):
    twu = calculate_twu(item, dataset, profits)
    return twu >= minutil

def correlation_pruning(itemset, supports, mincor):
    if len(itemset) < 2:
        return True
    correlation = calculate_correlation(itemset, supports)
    return correlation >= mincor

def utility_upper_bound_pruning(ul, minutil):
    total_utility = ul.get_total_utility()
    total_remaining = ul.get_total_remaining_utility()
    u_max = total_utility + total_remaining
    return u_max >= minutil