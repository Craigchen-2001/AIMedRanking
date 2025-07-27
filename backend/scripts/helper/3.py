import json
import csv

# File paths
input_json = '/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_2025_TestTopic_pdf_metadata.json'  # Replace with your JSON file
output_csv = '/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/allof_CSV/ICLR_test_topic.csv'

# Load JSON
data = []
with open(input_json, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Define CSV header (exclude token fields, flatten Axis topics)
header = [
    "id", "year", "conference", "title", "authors", "institutes", "abstract", "keywords",
    "pdf_url", "is_healthcare", "reasoning",
    "Topic Axis I MainTopic", "Topic Axis I SubTopic",
    "Topic Axis II MainTopic", "Topic Axis II SubTopic",
    "Topic Axis III MainTopic", "Topic Axis III SubTopic",
    "method", "application", "code_link", "dataset_name"
]

# Write CSV
with open(output_csv, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=header)
    writer.writeheader()
    for paper in data:
        row = {
            "id": paper.get("id", ""),
            "year": paper.get("year", ""),
            "conference": paper.get("conference", ""),
            "title": paper.get("title", ""),
            "authors": "; ".join(paper.get("authors", [])),
            "institutes": paper.get("institutes", ""),
            "abstract": paper.get("abstract", ""),
            "keywords": paper.get("keywords", ""),
            "pdf_url": paper.get("pdf_url", ""),
            "is_healthcare": paper.get("is_healthcare", ""),
            "reasoning": paper.get("reasoning", ""),
            "Topic Axis I MainTopic": paper.get("Topic Axis I", {}).get("MainTopic", ""),
            "Topic Axis I SubTopic": paper.get("Topic Axis I", {}).get("SubTopic", ""),
            "Topic Axis II MainTopic": paper.get("Topic Axis II", {}).get("MainTopic", ""),
            "Topic Axis II SubTopic": paper.get("Topic Axis II", {}).get("SubTopic", ""),
            "Topic Axis III MainTopic": paper.get("Topic Axis III", {}).get("MainTopic", ""),
            "Topic Axis III SubTopic": paper.get("Topic Axis III", {}).get("SubTopic", ""),
            "method": paper.get("method", ""),
            "application": paper.get("application", ""),
            "code_link": paper.get("code_link", ""),
            "dataset_name": "; ".join(paper.get("dataset_name", [])),
        }
        writer.writerow(row)

print(f"✅ CSV exported successfully to {output_csv}")
