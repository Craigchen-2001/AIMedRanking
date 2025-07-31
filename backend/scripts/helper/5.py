import json

input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/KDD_is_healthcare_metadata.json"
output_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/KDD_is_healthcare_metadata_cleaned.json"

with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

for paper in data:
    if paper.get("id", "").startswith("conf/kdd/conf/kdd/"):
        paper["id"] = paper["id"].replace("conf/kdd/conf/kdd/", "")

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Cleaned JSON saved to:", output_path)
