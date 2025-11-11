import json

MAIN_PATH = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NeurIPS_metadata.json"
DEBUG_PATH = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NeurIPS_metadata_debug2.json"

# 讀檔
with open(MAIN_PATH, "r", encoding="utf-8") as f:
    main_data = json.load(f)

with open(DEBUG_PATH, "r", encoding="utf-8") as f:
    debug_data = json.load(f)

# 建立 debug dict 方便查找
debug_dict = {item["id"]: item for item in debug_data}

# 用 debug 覆蓋 main
updated_data = []
updated_count = 0
for paper in main_data:
    if paper["id"] in debug_dict:
        updated_data.append(debug_dict[paper["id"]])
        updated_count += 1
    else:
        updated_data.append(paper)

# 寫回 main
with open(MAIN_PATH, "w", encoding="utf-8") as f:
    json.dump(updated_data, f, ensure_ascii=False, indent=2)

print(f"Updated {updated_count} papers in {MAIN_PATH}")
