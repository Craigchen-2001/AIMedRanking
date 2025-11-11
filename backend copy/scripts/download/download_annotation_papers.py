import os
import json
import requests
from tqdm import tqdm

# ====== User configuration ======
json_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/analyze_healthcare/ICLR_healthcare_analysis_iclr_metadata_2025.json"
output_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/download_PDF_annotation0718"
# paper_ids = [
#     "nYpPAT4L3D", "v9EjwMM55Y", "PstM8YfhvI", "mOpNrrV2zH", "3b9SKkRAKw",
#     "n34taxF0TC", "s5epFPdIW6", "hwnObmOTrV", "7zwIEbSTDy", "6Hz1Ko087B",
#     "k2uUeLCrQq", "yb4QE6b22f", "i2r7LDjba3", "8fLgt7PQza", "zcTLpIfj9u",
#     "NJxCpMt0sf", "WwmtcGr4lP", "zg3ec1TdAP", "BHFs80Jf5V", "hjROBHstZ3",
#     "ozZG5FXuTV", "XQlccqJpCC"
# ]

paper_ids = [
    "5WEpbilssv", "HAwZGLcye3", "S8gbnkCgxZ", "3Fgylj4uqL", "ja4rpheN2n"
]

# =================================

os.makedirs(output_dir, exist_ok=True)

with open(json_path, "r", encoding="utf-8") as f:
    all_metadata = json.load(f)

id_to_paper = {p["id"]: p for p in all_metadata}

not_found = []
downloaded = []

for pid in tqdm(paper_ids, desc="Downloading PDFs"):
    if pid not in id_to_paper:
        not_found.append(pid)
        continue

    paper = id_to_paper[pid]
    pdf_url = paper.get("pdf_url", "")
    if not pdf_url:
        print(f"[Missing] No PDF URL found for {pid}")
        continue

    out_path = os.path.join(output_dir, f"{pid}.pdf")
    if os.path.exists(out_path):
        continue

    try:
        response = requests.get(pdf_url, stream=True, timeout=30)
        if response.status_code == 200:
            with open(out_path, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            downloaded.append(pid)
        else:
            print(f"[Failed] Could not download {pid} (status code: {response.status_code})")
    except Exception as e:
        print(f"[Error] Exception while downloading {pid}: {e}")

print(f"\nDownload complete. Total downloaded: {len(downloaded)}")
if not_found:
    print(f"{len(not_found)} IDs not found in JSON: {not_found}")
