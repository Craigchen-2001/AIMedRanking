import os
import json
import csv

# === Configuration ===
INPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/CVPR/metadata"
OUTPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/CVPR/allof_CSV"
os.makedirs(OUTPUT_DIR, exist_ok=True)
OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, "CVPR_Metadata_Merged.csv")

# === CSV Fields ===
FIELDNAMES = [
    "id",
    "title",
    "abstract",
    "keywords",
    "authors",
    "institutes",
    "venue",
    "pdf_url",
    "final_decision"
]

# === Merge Logic ===
all_entries = []

for filename in os.listdir(INPUT_DIR):
    if filename.endswith(".json") and filename.startswith("cvpr_metadata_"):
        json_path = os.path.join(INPUT_DIR, filename)
        with open(json_path, "r") as f:
            data = json.load(f)
            for entry in data:
                filtered_entry = {key: entry.get(key, "N/A") for key in FIELDNAMES}
                # Convert list to string (for authors)
                if isinstance(filtered_entry["authors"], list):
                    filtered_entry["authors"] = ", ".join(filtered_entry["authors"])
                all_entries.append(filtered_entry)

# === Write to CSV ===
with open(OUTPUT_CSV_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()
    writer.writerows(all_entries)

# === Terminal Output ===
print(f" Merged {len(all_entries)} entries to: {OUTPUT_CSV_PATH}")
print(f" Total merged papers: {len(all_entries)}")
