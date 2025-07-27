import json
import csv

# 檔案路徑
input_path = '/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_ALL_gpt_filled_pdf_metadata.json'
output_path = '/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/iclr_all_output.csv'

# 要排除的欄位
exclude_keys = {"prompt_tokens", "completion_tokens", "total_tokens"}

# 讀取 JSON
with open(input_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 轉換成平坦的結構，方便輸出 CSV
flat_data = []
for item in data:
    flat_item = {}
    for key, value in item.items():
        if key in exclude_keys:
            continue
        if isinstance(value, list):
            flat_item[key] = "; ".join(map(str, value))  # 將 list 轉成分號分隔字串
        else:
            flat_item[key] = value
    flat_data.append(flat_item)

# 寫入 CSV
with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=flat_data[0].keys())
    writer.writeheader()
    writer.writerows(flat_data)

print(f"✅ Done! CSV saved to {output_path}")
