import os
import json
import argparse
from collections import defaultdict, Counter
from tqdm import tqdm
from openreview.api import OpenReviewClient

def fetch_icml_metadata(year: int, download_pdf: bool = False):
    print(f"\n  Fetching ICML {year} submissions...")

    base_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project"
    meta_dir = os.path.join(base_dir, "data", "ICML", "metadata")
    os.makedirs(meta_dir, exist_ok=True)
    meta_path = os.path.join(meta_dir, f"icml_metadata_{year}.json")

    metadata = []
    accepted_count = 0 
    skipped_reasons = defaultdict(int)

    client = OpenReviewClient(
        baseurl="https://api2.openreview.net",
        username="chen.12915@osu.edu",
        password="Alex08180818"
    )
    invitation = f"ICML.cc/{year}/Conference/-/Submission"
    submissions = list(client.get_all_notes(invitation=invitation))
    print(f"\n  Total submissions fetched: {len(submissions)}")

    if not submissions:
        print("No submissions found. Check year or API credentials.")
        return

    print("\n Submission content keys:")
    for k in submissions[0].content.keys():
        print(f" - {k}")

    forum_id = getattr(submissions[0], 'forum', submissions[0].id)
    decision_notes = client.get_notes(forum=forum_id)
    found_decision = False
    for note in decision_notes:
        if isinstance(note.content, dict) and "decision" in note.content:
            print("\n Decision note content keys:")
            for k in note.content.keys():
                print(f" - {k}")
            found_decision = True
            break
    if not found_decision:
        print("\n Decision note content keys: [None found]")

    for paper in tqdm(submissions, desc=f"Processing ICML {year} papers"):
        content = paper.content
        paper_id = paper.id
        forum_id = getattr(paper, 'forum', paper.id)

        decision_note = None
        for note in client.get_notes(forum=forum_id):
            if "decision" in note.content:
                decision_note = note
                break

        final_decision = "Unknown"
        if decision_note:
            d = decision_note.content.get("decision", "")
            final_decision = d.get("value", d) if isinstance(d, dict) else str(d)

        if any(x in final_decision.lower() for x in ["reject", "withdraw"]):
            skipped_reasons[final_decision] += 1
            continue

        venue_val = content.get("venue", {})
        venue_str = venue_val.get("value", "") if isinstance(venue_val, dict) else str(venue_val)
        if any(x in venue_str.lower() for x in ["reject", "withdraw"]):
            skipped_reasons[f"Venue: {venue_str}"] += 1
            continue

        accepted_count += 1

        def safe_get(field, default=""):
            v = content.get(field, {})
            return v.get("value", default) if isinstance(v, dict) else str(v)

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
            "pdf_url": f"https://openreview.net/pdf?id={paper_id}",
            "final_decision": final_decision
        })

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\n  Metadata saved: {meta_path}")
    print(f"  Accepted count: {accepted_count}")
    print("  Skipped (reject/withdraw):")
    for r, c in skipped_reasons.items():
        print(f"  - {r}: {c}")

    venue_dist = Counter(p.get("venue", "unknown") for p in metadata)
    print("\n  Venue distribution:")
    for v, cnt in venue_dist.items():
        print(f"  - {v or '[blank]'}: {cnt}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True, help="ICML year (2023–2025)")
    parser.add_argument("--pdf", action="store_true", help="Unused")
    args = parser.parse_args()
    fetch_icml_metadata(args.year, args.pdf)

