import json

# 路徑設定
original_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICML_metadata.json"
debug_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICML_metadata_debug.json"
output_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICML_metadata_merged.json"

# 載入原始檔（628篇）
with open(original_path, "r") as f:
    original_data = json.load(f)

# 載入更新檔（168篇）
with open(debug_path, "r") as f:
    debug_data = json.load(f)

# 把 debug 資料轉為 dict 方便查詢
debug_dict = {paper["id"]: paper for paper in debug_data}

# 要覆蓋的欄位（僅這些欄位會被 debug 取代）
fields_to_update = [
    "Topic Axis I",
    "Topic Axis II",
    "Topic Axis III",
    "method",
    "application",
    "code_link",
    "dataset_name"
]

# 合併：更新原始資料中對應 ID 的欄位
for paper in original_data:
    paper_id = paper["id"]
    if paper_id in debug_dict:
        debug_paper = debug_dict[paper_id]
        for field in fields_to_update:
            paper[field] = debug_paper.get(field, paper.get(field))

# 儲存新的合併檔案
with open(output_path, "w") as f:
    json.dump(original_data, f, indent=2)

print(f"✅ 合併完成！儲存到 {output_path}")
