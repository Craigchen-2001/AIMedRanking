import json
import os

files = [
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICLR_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ICML_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/KDD_metadata.json",
    "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NeurIPS_metadata.json",
]

for file in files:
    with open(file, "r") as f:
        data = json.load(f)

    missing_topics = []

    for paper in data:
        pid = paper.get("id", "UNKNOWN_ID")
        for axis in ["Topic Axis I", "Topic Axis II", "Topic Axis III"]:
            topic = paper.get(axis, {})
            main = topic.get("MainTopic", "")
            sub = topic.get("SubTopic", "")
            if main in ["", "N/A"] or sub in ["", "N/A"]:
                missing_topics.append(pid)
                break

    total = len(data)
    miss_t = len(missing_topics)

    print(f"\n📂 {os.path.basename(file)}")
    print(f"  Total papers: {total}")
    print(f"  Missing topics: {miss_t} ({miss_t/total:.2%})")
    if miss_t:
        print(f"   -> IDs (topic missing): {missing_topics}")
