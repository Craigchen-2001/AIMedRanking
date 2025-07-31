import json

json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICML_metadata_merged.json"

# 讀取 JSON
with open(json_path, "r") as f:
    data = json.load(f)

# 篩選並列印
count = 0
for item in data:
    if item.get("method", "N/A") == "N/A":
        count += 1
        paper_id = item.get("id", "N/A")
        title = item.get("title", "N/A")
        pdf_url = item.get("pdf_url", "N/A")
        print(f"ID: {paper_id}")
        print(f"Title: {title}")
        print(f"PDF URL: {pdf_url}")
        print("-" * 60)

print(f"\nTotal papers with method == 'N/A': {count}")
