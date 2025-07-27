# import os
# import json

# def count_biomed_papers(folder_path):
#     count_total = 0
#     count_biomed = 0

#     for filename in os.listdir(folder_path):
#         if not filename.endswith(".json"):
#             continue

#         filepath = os.path.join(folder_path, filename)
#         with open(filepath, "r", encoding="utf-8") as f:
#             data = json.load(f)
#             output_text = data.get("gpt_output", "")

#             for line in output_text.splitlines():
#                 if line.strip().startswith("- Is Healthcare/Biomedicine:"):
#                     if "yes" in line.lower():
#                         count_biomed += 1
#                     break

#         count_total += 1

#     return count_total, count_biomed

# if __name__ == "__main__":
#     abstract_dir = "outputs/from_abstract"
#     pdf_dir = "outputs/from_pdf"

#     total_abstract, biomed_abstract = count_biomed_papers(abstract_dir)
#     total_pdf, biomed_pdf = count_biomed_papers(pdf_dir)

#     print("\n[Biomedicine Paper Count Summary]\n")

#     print("From Abstract:")
#     print(f"  Total papers analyzed: {total_abstract}")
#     print(f"  Papers about Biomedicine: {biomed_abstract}")
#     print(f"  Ratio: {biomed_abstract / total_abstract:.2%}" if total_abstract else "  Ratio: N/A")

#     print("\nFrom PDF:")
#     print(f"  Total papers analyzed: {total_pdf}")
#     print(f"  Papers about Biomedicine: {biomed_pdf}")
#     print(f"  Ratio: {biomed_pdf / total_pdf:.2%}" if total_pdf else "  Ratio: N/A")

# import os
# import pandas as pd

# # Folder paths for each conference
# folders = {
#     "ACL": "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ACL/allof_CSV/ACL_Metadata_Merged.csv",
#     "CVPR": "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/CVPR/allof_CSV/CVPR_Metadata_Merged.csv",
#     "ICLR": "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV/ICLR_Metadata_Merged_2025-06-19.csv",
#     "ICML": "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICML/allof_CSV/ICML_Metadata_Merged.csv",
#     "KDD": "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/KDD/allof_CSV/KDD_Metadata_Merged.csv"
# }

# # Count papers for each CSV
# for conf, path in folders.items():
#     try:
#         df = pd.read_csv(path)
#         print(f"{conf}: {len(df)} papers")
#     except Exception as e:
#         print(f"{conf}: Failed to read ({e})")
import json

# === 請修改為你的 JSON 路徑 ===
json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/data/WWW/metadata/www_metadata_2025.json"

# === 計算 N/A 數量並列出是哪一筆 ===
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

na_entries = [entry for entry in data if entry.get("institutes", "").strip().upper() == "N/A"]
total_count = len(data)

print(f"總共 {total_count} 筆，機構為 'N/A' 的有 {len(na_entries)} 筆\n")

for idx, entry in enumerate(na_entries, start=1):
    print(f"[{idx}] id: {entry.get('id', 'N/A')} | title: {entry.get('title', 'N/A')} | doi: {entry.get('doi', 'N/A')} | track: {entry.get('venue', 'N/A')}")

