import json
import pandas as pd

# 讀取 JSON
json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NeurIPS_metadata.json"
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# 轉成 DataFrame
df = pd.DataFrame(data)

# 輸出到 CSV（UTF-8 with BOM）
csv_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NEURIPS_metadata.csv"
df.to_csv(csv_path, index=False, encoding="utf-8-sig")

print(f"已轉換完成：{csv_path}")
