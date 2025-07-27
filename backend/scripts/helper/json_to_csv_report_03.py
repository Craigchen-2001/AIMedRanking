import json
import csv
import os

# === 路徑設定 ===
input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_2025_gpt_filled_pdf_metadata_Token.json"
output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "ICLR_2025_gpt_filled_pdf_metadata_version3.csv")

# === 欄位設定（動態建立，排除 token 欄位 + 加入 gpt_output 拆解後欄位）===
excluded_keys = {"prompt_tokens", "completion_tokens", "total_tokens"}
# === 讀 JSON ===
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

print(f"Total entries: {len(data)}")

# 動態建立欄位名稱（排除指定欄位）
fieldnames = [key for key in data[0].keys() if key not in excluded_keys]

# === 寫 CSV（UTF-8 BOM）===
with open(output_path, "w", newline="", encoding="utf-8-sig") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()

    for entry in data:
        row = {}
        for key in fieldnames:
            val = entry.get(key, "N/A")

            # List → 字串
            if isinstance(val, list):
                val = "; ".join(str(x) for x in val) if val else "N/A"
            # 字串清理
            elif isinstance(val, str):
                val = " ".join(val.replace("\n", " ").split())
                if not val:
                    val = "N/A"
            row[key] = val

        writer.writerow(row)

print("✅ CSV 產生完畢 →", output_path)