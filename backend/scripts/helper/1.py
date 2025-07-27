import json

# Path to the JSON file
input_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_healthcare_analysis_iclr_metadata_2025.json"

# Read JSON data
with open(input_path, "r", encoding="utf-8") as f:
    data = json.load(f)

total_count = len(data)
missing_count = 0
missing_ids = []

for entry in data:
    reasoning = entry.get("reasoning", "").strip()
    
    # Consider missing if:
    # 1. reasoning is empty string
    # 2. reasoning only contains "**Reasoning**:" with no actual content
    if reasoning == "" or (
        reasoning.startswith("**Reasoning**:") and reasoning[len("**Reasoning**:"):].strip() == ""
    ):
        missing_count += 1
        missing_ids.append(entry.get("id", "N/A"))

print(f"Total entries: {total_count}")
print(f"Missing or meaningless reasoning count: {missing_count}")
print(f"Proportion: {missing_count / total_count:.2%}")

if missing_ids:
    print("\nIDs with missing or meaningless reasoning:")
    for paper_id in missing_ids:
        print(paper_id)
