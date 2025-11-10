import os
import json
from tqdm import tqdm
from collections import defaultdict, Counter
from openreview.api import OpenReviewClient

def fetch_neurips_2025_metadata():
    print("\nFetching NeurIPS 2025 accepted papers only...")

    base_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project"
    meta_dir = os.path.join(base_dir, "data", "NeurIPS", "metadata")
    os.makedirs(meta_dir, exist_ok=True)
    meta_path = os.path.join(meta_dir, "neurips_metadata_2025.json")

    client = OpenReviewClient(
        baseurl="https://api2.openreview.net",
        username="chen.12915@osu.edu",
        password="Alex08180818"
    )

    invitation = "NeurIPS.cc/2025/Conference/-/Submission"

    submissions = []
    limit = 1000
    offset = 0
    print("\nFetching submissions (paged mode)...")
    while True:
        batch = list(client.get_notes(invitation=invitation, limit=limit, offset=offset))
        if not batch:
            break
        submissions.extend(batch)
        offset += limit
        print(f"  Retrieved {len(submissions)} so far...")

    print(f"\nTotal submissions fetched: {len(submissions)}")

    metadata = []
    skipped = defaultdict(int)
    accepted_count = 0

    for paper in tqdm(submissions, desc="Processing NeurIPS 2025 papers"):
        content = paper.content
        paper_id = paper.id
        forum_id = getattr(paper, "forum", paper.id)

        decision_note = None
        try:
            decision_notes = list(client.get_notes(forum=forum_id))
        except Exception:
            decision_notes = []
        for note in decision_notes:
            if isinstance(note.content, dict) and ("decision" in note.content or "Decision" in note.content):
                decision_note = note
                break

        final_decision = "Unknown"
        if decision_note:
            field = decision_note.content.get("decision", decision_note.content.get("Decision", "Unknown"))
            if isinstance(field, dict):
                final_decision = field.get("value", "Unknown")
            else:
                final_decision = str(field)
        else:
            skipped["No Decision"] += 1
            continue

        decision_lower = final_decision.lower()
        if not any(x in decision_lower for x in ["accept", "oral", "spotlight", "poster"]):
            skipped[final_decision] += 1
            continue

        accepted_count += 1

        def safe_get(field, default=""):
            v = content.get(field, {})
            if isinstance(v, dict):
                return v.get("value", default)
            return str(v)

        def safe_list(field):
            v = content.get(field, {})
            if isinstance(v, dict):
                return v.get("value", [])
            return v if isinstance(v, list) else []

        metadata.append({
            "id": paper_id,
            "title": safe_get("title"),
            "abstract": safe_get("abstract"),
            "keywords": safe_list("keywords"),
            "authors": safe_list("authors"),
            "institutes": safe_list("author_organizations") or "N/A",
            "venue": safe_get("venue"),
            "final_decision": final_decision,
            "pdf_url": f"https://openreview.net/pdf?id={paper_id}",
            "year": 2025,
            "conference": "NeurIPS (Neural Information Processing Systems)"
        })

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\nMetadata saved to: {meta_path}")
    print(f"Accepted papers: {accepted_count}")
    print(f"Skipped: {sum(skipped.values())}")
    print("Breakdown:")
    for k, v in skipped.items():
        print(f" - {k}: {v}")

if __name__ == "__main__":
    fetch_neurips_2025_metadata()
