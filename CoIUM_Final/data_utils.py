import os
import sys
import numpy as np

def load_dataset(file_path):
    """Tải dataset từ file và chuyển đổi thành định dạng phù hợp"""
    dataset = []
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Không tìm thấy file: {file_path}")

    try:
        if file_path.endswith('.csv'):
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    first_column = line.strip().split(',')[0]
                    items = [int(x) for x in first_column.strip().split() if x.isdigit()]
                    if items:
                        dataset.append(items)
        else:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    items = [int(x) for x in line.strip().split() if x.isdigit()]
                    if items:
                        dataset.append(items)
    except IOError as e:
        raise IOError(f"Lỗi khi đọc file {file_path}: {str(e)}")

    if not dataset:
        raise ValueError(f"Dataset {file_path} trống hoặc không hợp lệ.")

    for trans in dataset:
        if not all(isinstance(x, int) for x in trans):
            raise ValueError(f"Dataset {file_path} chứa giá trị không phải số nguyên.")

    return dataset


def save_profits_to_file(profits, dataset_name):
    """Lưu profits vào file để đảm bảo kết quả nhất quán"""
    os.makedirs("profits", exist_ok=True)
    path = f"profits/{dataset_name}_profits.txt"
    with open(path, 'w', encoding='utf-8') as f:
        for item, p in sorted(profits.items()):
            f.write(f"{item} {p}\n")
    print(f"Đã lưu profits vào: {path}", file=sys.stderr)
    return path


def load_profits_from_file(dataset_name):
    """Đọc profits từ file để đảm bảo kết quả nhất quán"""
    path = f"profits/{dataset_name}_profits.txt"
    if not os.path.exists(path):
        return None

    profits = {}
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) == 2:
                    item, p = parts
                    profits[int(item)] = int(p)
        print(f"Đã tải profits từ: {path}", file=sys.stderr)
        return profits
    except Exception as e:
        print(f"Lỗi khi tải profits: {e}", file=sys.stderr)
        return None


def generate_profits(items, min_profit=1, max_profit=5):
    """Sinh profits ngẫu nhiên cho các items"""
    if not items:
        raise ValueError("Danh sách items không được rỗng")
    if max_profit < min_profit:
        raise ValueError("max_profit phải >= min_profit")

    random_values = np.random.randint(min_profit, max_profit + 1, len(items))
    return dict(zip(items, random_values))