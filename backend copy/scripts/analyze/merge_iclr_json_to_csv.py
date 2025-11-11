import os
import json
import csv
from datetime import datetime

# === Configuration ===
METADATA_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/ICLR/metadata"
OUTPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Automatically add today's date to the output filename
today = datetime.now().strftime("%Y-%m-%d")
OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, f"ICLR_Metadata_Merged_{today}.csv")

# Fields to be included in the output CSV
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

def flatten_list(val):
    # Convert list to comma-separated string
    if isinstance(val, list):
        return ", ".join(str(v) for v in val)
    return val if isinstance(val, str) else ""

def main():
    merged_data = []

    for filename in os.listdir(METADATA_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(METADATA_DIR, filename)
            print(f" Loading: {filename}")
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                for paper in data:
                    # Ensure all fields exist; use empty string as default
                    row = {key: paper.get(key, "") for key in FIELDNAMES}
                    row["keywords"] = flatten_list(row.get("keywords", []))
                    row["authors"] = flatten_list(row.get("authors", []))
                    row["institutes"] = flatten_list(row.get("institutes", []))
                    merged_data.append(row)

    with open(OUTPUT_CSV_PATH, "w", newline='', encoding="utf-8") as fout:
        writer = csv.DictWriter(fout, fieldnames=FIELDNAMES)
        writer.writeheader()
        for row in merged_data:
            writer.writerow(row)

    print(f"\n Merged CSV saved to:\n{OUTPUT_CSV_PATH}")
    print(f" Total entries written: {len(merged_data)}")

if __name__ == "__main__":
    main()
