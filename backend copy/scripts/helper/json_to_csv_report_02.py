import json
import csv
import os

# === 路徑設定 ===
input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_2025_gpt_filled_pdf_metadata.json"
output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "ICLR_2025_gpt_filled_pdf_metadata.csv")

# === 欄位設定（新增 gpt_output, topic, method, application, code_link, dataset_link）===
fieldnames = [
    "id",
    "year",
    "conference",
    "title",
    "authors",
    "institutes",
    "authors/institutes",
    "abstract",
    "keywords",
    "pdf_url",
    "is_healthcare",
    "reasoning",
    "topic",           # 新增
    "method",          # 新增
    "application",     # 新增
    "code_link",       # 新增
    "dataset_link"     # 新增
]

# === 讀 JSON ===
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total entries: {len(data)}")

# === 寫 CSV（UTF-8 BOM）===
with open(output_path, "w", newline="", encoding="utf-8-sig") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    for entry in data:
        row = {}
        for key in fieldnames:
            val = entry.get(key, "N/A")

            # 如果是 list，就把元素用分號串起來
            if isinstance(val, list):
                val = "; ".join(val) if val else "N/A"

            # 如果是 dict（像 gpt_output 也可能是原始 JSON 字串），先轉成壓縮過的單行
            if isinstance(val, dict):
                val = json.dumps(val, ensure_ascii=False)

            # 如果是長字串，去掉換行並壓縮多餘空格
            if isinstance(val, str):
                val = " ".join(val.replace("\n", " ").split())
                if not val:
                    val = "N/A"

            row[key] = val

        writer.writerow(row)

print("CSV 產生完畢 →", output_path)
