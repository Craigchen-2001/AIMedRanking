import os
import csv
import json

# ====== 資料夾路徑（你的 26 個 csv 檔放這裡）======
input_folder = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/csranking"
output_path = os.path.join(input_folder, "author_affiliation.json")

# ====== 建立 author → affiliation/homepage 字典 ======
author_dict = {}

for letter in "abcdefghijklmnopqrstuvwxyz":
    filename = f"csrankings-{letter}.csv"
    filepath = os.path.join(input_folder, filename)
    
    if not os.path.exists(filepath):
        print(f"❌ Missing file: {filename}")
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row["name"].strip()
            affiliation = row["affiliation"].strip()
            homepage = row.get("homepage", "").strip()

            author_dict[name] = {
                "affiliation": affiliation,
                "homepage": homepage
            }

# ====== 輸出成 JSON（保留 Unicode，避免亂碼）======
with open(output_path, "w", encoding="utf-8") as out_f:
    json.dump(author_dict, out_f, indent=2, ensure_ascii=False)

print(f"✅ 合併完成！輸出檔案：{output_path}")
