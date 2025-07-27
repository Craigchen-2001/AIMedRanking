import json
import os

# Input and output paths
input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_healthcare_analysis_iclr_metadata_2025.json"
output_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_healthcare_yes_only_2025.json"

# Read JSON file
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# Filter for Yes papers
yes_papers = []
for entry in data:
    if entry.get("is_healthcare", "No") == "Yes":
        yes_papers.append({
            "title": entry.get("title", "N/A"),
            "is_healthcare": "Yes",
            "reasoning": entry.get("reasoning", "N/A")
        })

# Output summary
print(f"Total 'Yes' papers found: {len(yes_papers)}")

# Save to new JSON
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(yes_papers, f, indent=2, ensure_ascii=False)

print(f"✅ Output saved to: {output_path}")
