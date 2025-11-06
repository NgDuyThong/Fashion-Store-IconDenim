class UtilityList:
    """Cấu trúc Utility-List tối ưu"""
    def __init__(self, item):
        self.item = item
        self.elements = []  # (tid, iutil, rutil)
        self._total_utility = None
        self._total_remaining = None

    def add_element(self, tid, iutil, rutil):
        self.elements.append((tid, iutil, rutil))
        self._total_utility = None
        self._total_remaining = None

    def get_total_utility(self):
        if self._total_utility is None:
            self._total_utility = sum(iutil for _, iutil, _ in self.elements)
        return self._total_utility

    def get_total_remaining_utility(self):
        if self._total_remaining is None:
            self._total_remaining = sum(rutil for _, _, rutil in self.elements)
        return self._total_remaining

    def get_transaction_ids(self):
        return [tid for tid, _, _ in self.elements]


def construct_utility_list(item, dataset, profits):
    """Xây dựng Utility-List cho một item"""
    ul = UtilityList(item)
    for tid, trans in enumerate(dataset):
        if item in trans:
            iutil = profits[item]
            item_index = trans.index(item)
            rutil = sum(profits[i] for i in trans[item_index + 1:])
            ul.add_element(tid, iutil, rutil)
    return ul


def construct_utility_list_combined(ul_x, ul_y, dataset, profits):
    """Xây dựng UL cho itemset XY từ UL(X) và UL(Y)"""
    tid_x = set(ul_x.get_transaction_ids())
    tid_y = set(ul_y.get_transaction_ids())
    common_tids = tid_x.intersection(tid_y)
    if not common_tids:
        return None

    itemset_xy = sorted(ul_x.item + ul_y.item if isinstance(ul_x.item, list) else [ul_x.item] + [ul_y.item])
    ul_xy = UtilityList(itemset_xy)

    x_dict = {tid: (iutil, rutil) for tid, iutil, rutil in ul_x.elements}
    y_dict = {tid: (iutil, rutil) for tid, iutil, rutil in ul_y.elements}

    for tid in sorted(common_tids):
        iutil_x, _ = x_dict[tid]
        iutil_y, rutil_y = y_dict[tid]
        iutil_xy = iutil_x + iutil_y
        ul_xy.add_element(tid, iutil_xy, rutil_y)

    return ul_xy