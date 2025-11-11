import os
import json
import csv

# === Configuration ===
INPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/WWW/metadata"
OUTPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/WWW/allof_CSV"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, "WWW_Metadata_Merged.csv")

# === CSV Fields ===
FIELDNAMES = [
    "id",
    "title",
    "authors",
    "authors/institutes",
    "doi",
    "abstract",
    "keywords",
    "institutes",
    "venue",
    "pdf_url"
]

# === Merge Logic ===
all_entries = []

for year in range(2020, 2026):
    json_path = os.path.join(INPUT_DIR, f"www_metadata_{year}.json")
    if not os.path.exists(json_path):
        print(f"File not found for year {year}: {json_path}")
        continue

    with open(json_path, "r", encoding="utf-8") as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print(f"Error reading JSON file for year {year}")
            continue

        # 單筆物件轉list處理
        if isinstance(data, dict):
            data = [data]

        for entry in data:
            all_entries.append(entry)

# Write merged CSV
with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=FIELDNAMES)
    writer.writeheader()

    for entry in all_entries:
        row = {
            "id": entry.get("id", "N/A"),
            "title": entry.get("title", "N/A"),
            "authors": ", ".join(entry.get("authors", [])),
            "authors/institutes": json.dumps(entry.get("authors/institutes", []), ensure_ascii=False),
            "doi": entry.get("doi", "N/A"),
            "abstract": entry.get("abstract", "N/A"),
            "keywords": entry.get("keywords", "N/A"),
            "institutes": entry.get("institutes", "N/A"),
            "venue": entry.get("venue", "N/A"),
            "pdf_url": entry.get("pdf_url", "N/A")
        }
        writer.writerow(row)

print(f"Merged {len(all_entries)} papers into {OUTPUT_CSV_PATH}")
