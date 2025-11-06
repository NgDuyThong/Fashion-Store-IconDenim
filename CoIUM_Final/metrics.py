import itertools
from collections import defaultdict

def calculate_transaction_utility(trans, profits):
    return sum(profits.get(i, 0) for i in trans)

def calculate_twu(item, dataset, profits):
    twu = 0
    for trans in dataset:
        if item in trans:
            twu += calculate_transaction_utility(trans, profits)
    return twu

def calculate_support(dataset, itemset):
    if not dataset or not itemset:
        return 0
    itemset = set(itemset)
    return sum(itemset.issubset(trans) for trans in dataset)

def calculate_kulc_pair(item_a, item_b, supports):
    sup_a = supports.get(frozenset([item_a]), 0)
    sup_b = supports.get(frozenset([item_b]), 0)
    sup_ab = supports.get(frozenset([item_a, item_b]), 0)
    if sup_a == 0 or sup_b == 0 or sup_ab == 0:
        return 0.0
    return 0.5 * ((sup_ab / sup_a) + (sup_ab / sup_b))

def calculate_correlation(itemset, supports):
    if len(itemset) < 2:
        return 1.0
    pairs = list(itertools.combinations(itemset, 2))
    kulc_values = [calculate_kulc_pair(a, b, supports) for a, b in pairs]
    return min(kulc_values) if kulc_values else 1.0