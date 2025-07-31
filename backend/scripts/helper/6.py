import json

# 路徑設定
source_json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/KDD_is_healthcare_metadata.json"
output_json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/KDD_is_healthcare_metadata_debug.json"

# 填入 method == 'N/A' 的 ID 清單（你給的那一長串）
na_ids = set([
    "TranNNH25", "SnowSLZLE21", "Dang0XBSCGSCM23"
])

# 載入原始 JSON 檔案
with open(source_json_path, "r") as f:
    data = json.load(f)

# 篩選出符合的 entries
filtered_data = [entry for entry in data if entry.get("id") in na_ids]

# 儲存新的 JSON 檔案
with open(output_json_path, "w") as f:
    json.dump(filtered_data, f, indent=2)

print(f"Saved {len(filtered_data)} entries to {output_json_path}")
