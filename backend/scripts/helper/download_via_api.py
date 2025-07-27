import openreview
import os
import requests
import json
from tqdm import tqdm

# Step 0: Setup output directory
OUTPUT_DIR = "data/oral_papers"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Step 1: Connect to OpenReview API (API v2)
client = openreview.api.OpenReviewClient(
    baseurl='https://api2.openreview.net',
    username='chen.12915@osu.edu',
    password='Alex08180818'
)

# Step 2: Fetch all ICLR 2025 submissions
print("Fetching all ICLR 2025 submissions...")
submissions = client.get_all_notes(invitation='ICLR.cc/2025/Conference/-/Submission')

# ----- Legacy: Print accepted paper counts (backup only) -----
# accepted_labels = ['ICLR 2025 Oral', 'ICLR 2025 Spotlight', 'ICLR 2025 Poster']
# category_counts = {label: 0 for label in accepted_labels}
# for submission in submissions:
#     venue_label = submission.content.get('venue', '')
#     if isinstance(venue_label, dict):
#         venue_label = venue_label.get('value', '')
#     if venue_label in category_counts:
#         category_counts[venue_label] += 1
# print("ICLR 2025 Accepted Paper Distribution:")
# for category, count in category_counts.items():
#     print(f"- {category}: {count}")

# Step 3: Filter oral papers
oral_papers = []
for submission in submissions:
    venue_label = submission.content.get('venue', '')
    if isinstance(venue_label, dict):
        venue_label = venue_label.get('value', '')
    if venue_label == 'ICLR 2025 Oral':
        oral_papers.append(submission)

print(f"Found {len(oral_papers)} oral papers.")

# Step 4: Download PDFs and save metadata
metadata_list = []
for paper in tqdm(oral_papers, desc="Downloading PDFs"):
    paper_id = paper.id

    # Safely extract title
    title_raw = paper.content.get("title", {})
    if isinstance(title_raw, dict):
        title = title_raw.get("value", "untitled")
    else:
        title = str(title_raw)
    title = title.replace("/", "_")

    # Safely extract abstract
    abstract_raw = paper.content.get("abstract", {})
    if isinstance(abstract_raw, dict):
        abstract = abstract_raw.get("value", "")
    else:
        abstract = str(abstract_raw)

    pdf_url = f"https://openreview.net/pdf?id={paper_id}"
    save_path = os.path.join(OUTPUT_DIR, f"{paper_id}.pdf")

    if os.path.exists(save_path):
        continue

    try:
        response = requests.get(pdf_url)
        with open(save_path, "wb") as f:
            f.write(response.content)
    except Exception as e:
        print(f"Failed to download {paper_id}: {e}")
        continue

    metadata_list.append({
        "id": paper_id,
        "title": title,
        "abstract": abstract,
        "pdf_url": pdf_url,
        "file_path": save_path
    })

# Save metadata
with open(os.path.join(OUTPUT_DIR, "oral_metadata.json"), "w") as f:
    json.dump(metadata_list, f, indent=2)

print("Oral paper PDFs and metadata download complete.")
