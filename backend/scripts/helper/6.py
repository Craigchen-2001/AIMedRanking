import os
import json
from pathlib import Path

input_years = ["2020", "2021", "2022", "2023", "2024"]
base_path = Path("/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/outputs/NeurIPS/analyze_healthcare")
output_path = Path("/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NEURIPS_is_healthcare_metadata.json")

merged_results = []

for year in input_years:
    filename = f"NeurIPS_healthcare_analysis_neurips_metadata_{year}.json"
    filepath = base_path / filename

    with open(filepath, "r", encoding="utf-8") as f:
        papers = json.load(f)

    for p in papers:
        if p.get("is_healthcare", "").strip().lower() == "yes":
            # 補足缺失欄位
            p["year"] = p.get("year") or int(year)
            p["conference"] = p.get("conference") or "NeurIPS (Neural Information Processing Systems)"
            merged_results.append(p)

print(f"Total papers with is_healthcare == 'Yes': {len(merged_results)}")

output_path.parent.mkdir(parents=True, exist_ok=True)
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(merged_results, f, indent=2, ensure_ascii=False)

print(f"Merged file saved to: {output_path}")
