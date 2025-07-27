import os
import json
import csv

# === Configuration ===
METADATA_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/ICML/metadata"
OUTPUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICML/allof_CSV"
os.makedirs(OUTPUT_DIR, exist_ok=True)

OUTPUT_CSV_PATH = os.path.join(OUTPUT_DIR, "ICML_Metadata_Merged.csv")

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
    if isinstance(val, list):
        return ", ".join(str(v) for v in val) if val else "N/A"
    return val if isinstance(val, str) and val.strip() else "N/A"

def main():
    merged_data = []

    for filename in os.listdir(METADATA_DIR):
        if filename.endswith(".json"):
            filepath = os.path.join(METADATA_DIR, filename)
            print(f" Loading: {filename}")
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                for paper in data:
                    row = {}
                    for key in FIELDNAMES:
                        val = paper.get(key, "")
                        if key in ["keywords", "authors", "institutes"]:
                            row[key] = flatten_list(val)
                        else:
                            row[key] = val.strip() if isinstance(val, str) and val.strip() else "N/A"
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
