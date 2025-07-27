import openreview
import os
import json
import requests
from tqdm import tqdm
from datetime import datetime


# -----------------------------
# 控制：是否下載 PDF
# -----------------------------
DOWNLOAD_PDF = False

# -----------------------------
# 輸出資料夾與檔案名稱（含日期）
# -----------------------------
PDF_DIR = "data/oral_papers/pdfs"
META_DIR = "data/oral_papers/metadata"
os.makedirs(PDF_DIR, exist_ok=True)
os.makedirs(META_DIR, exist_ok=True)

date_str = datetime.now().strftime("%Y-%m-%d")
META_FILENAME = f"oral_metadata_{date_str}.json"
META_PATH = os.path.join(META_DIR, META_FILENAME)

# -----------------------------
# OpenReview 登入設定
# -----------------------------
client = openreview.api.OpenReviewClient(
    baseurl="https://api2.openreview.net",
    username="chen.12915@osu.edu",
    password="Alex08180818"
)

# -----------------------------
# 抓取 ICLR 2025 所有投稿
# -----------------------------
print("Fetching ICLR 2025 submissions...")
submissions = client.get_all_notes(invitation="ICLR.cc/2025/Conference/-/Submission")

# -----------------------------
# 過濾出 Oral Papers
# -----------------------------
oral_papers = []
for note in submissions:
    venue = note.content.get("venue", {})
    if isinstance(venue, dict):
        venue = venue.get("value", "")
    if venue == "ICLR 2025 Oral":
        oral_papers.append(note)

print(f"Found {len(oral_papers)} oral papers.")

# -----------------------------
# 處理每一篇 paper
# -----------------------------
metadata = []
for paper in tqdm(oral_papers, desc="Processing Papers"):
    paper_id = paper.id
    content = paper.content

    # title
    title_raw = content.get("title", {})
    title = title_raw.get("value", "") if isinstance(title_raw, dict) else str(title_raw)
    title = title.replace("/", "_")

    # abstract
    abstract_raw = content.get("abstract", {})
    abstract = abstract_raw.get("value", "") if isinstance(abstract_raw, dict) else str(abstract_raw)

    # keywords
    keywords_raw = content.get("keywords", {})
    keywords = keywords_raw.get("value", []) if isinstance(keywords_raw, dict) else []

    # ✅ 正確處理 TLDR 欄位（不是 TL;DR）
    tldr_raw = content.get("TLDR", {})
    if isinstance(tldr_raw, dict):
        tldr = tldr_raw.get("value", "N/A")
    elif isinstance(tldr_raw, str):
        tldr = tldr_raw
    else:
        tldr = "N/A"

    # PDF URL and file path
    pdf_url = f"https://openreview.net/pdf?id={paper_id}"
    pdf_path = os.path.join(PDF_DIR, f"{paper_id}.pdf")

    if DOWNLOAD_PDF and not os.path.exists(pdf_path):
        try:
            response = requests.get(pdf_url)
            response.raise_for_status()
            with open(pdf_path, "wb") as f:
                f.write(response.content)
        except Exception as e:
            print(f"Failed to download {paper_id}: {e}")
            continue

    metadata.append({
        "id": paper_id,
        "title": title,
        "abstract": abstract,
        "keywords": keywords,
        "tldr": tldr,
        "pdf_url": pdf_url,
        "file_path": pdf_path
    })

# -----------------------------
# 輸出 JSON 檔案
# -----------------------------
with open(META_PATH, "w", encoding="utf-8") as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print(f"Metadata saved to: {META_PATH}")