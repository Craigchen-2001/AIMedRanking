import json
import csv
import os

# === Path Settings ===
input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_healthcare_analysis_iclr_metadata_2020.json"
output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV"
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, "ICLR_Metadata_Analysis_Healthcare_2020.csv")

# === Column Settings ===
fieldnames = [
    "id",
    "year",
    "conference",
    "title",
    "authors",
    "institutes",
    "authors/institutes",
    "abstract",
    "keywords",
    "pdf_url",
    "is_healthcare",
    "reasoning"
]

# === Read JSON Data ===
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

total_count = len(data)
yes_count = sum(1 for entry in data if entry.get("is_healthcare", "No") == "Yes")
yes_ratio = yes_count / total_count if total_count > 0 else 0

print(f"Loaded {total_count} entries from {input_path}")
print(f"Healthcare-related papers (Yes): {yes_count}")
print(f"Proportion: {yes_ratio:.2%}")

# === Write CSV File (UTF-8 with BOM for better Excel compatibility) ===
with open(output_path, "w", newline="", encoding="utf-8-sig") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for entry in data:
        cleaned_entry = {}
        for key in fieldnames:
            value = entry.get(key, "N/A")
            if isinstance(value, str):
                # Remove line breaks and compress multiple spaces into one
                value = " ".join(value.replace("\n", " ").replace("\r", " ").split())
            # If value is empty after cleaning, mark as N/A
            if not value:
                value = "N/A"
            cleaned_entry[key] = value
        writer.writerow(cleaned_entry)

print(f"CSV output complete: {output_path}")


# import json
# import csv
# import os

# # === Path Settings ===
# input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_healthcare_analysis_iclr_metadata_2025.json"
# output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV"
# os.makedirs(output_dir, exist_ok=True)
# output_path = os.path.join(output_dir, "ICLR_Metadata_Analysis_Healthcare_2025.csv")

# # === Column Settings ===
# fieldnames = [
#     "id",
#     "title",
#     "authors",
#     "institutes",
#     "authors/institutes",
#     "abstract",
#     "keywords",
#     "pdf_url",
#     "is_healthcare",
#     "reasoning"
# ]

# # === Read JSON Data ===
# with open(input_path, "r", encoding="utf-8") as f:
#     data = json.load(f)

# total_count = len(data)
# yes_count = sum(1 for entry in data if entry.get("is_healthcare", "No") == "Yes")
# yes_ratio = yes_count / total_count if total_count > 0 else 0

# print(f"Loaded {total_count} entries from {input_path}")
# print(f"Healthcare-related papers (Yes): {yes_count}")
# print(f"Proportion: {yes_ratio:.2%}")

# # === Write CSV File (UTF-8 with BOM for better Excel compatibility) ===
# with open(output_path, "w", newline="", encoding="utf-8-sig") as csvfile:
#     writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
#     writer.writeheader()
#     for entry in data:
#         cleaned_entry = {}
#         for key in fieldnames:
#             value = entry.get(key, "N/A")
#             if isinstance(value, str):
#                 value = value.replace("\n", " ").replace("\r", " ")
#             cleaned_entry[key] = value
#         writer.writerow(cleaned_entry)

# print(f"CSV output complete: {output_path}")
