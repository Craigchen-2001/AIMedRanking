import os
import json
import argparse
from collections import defaultdict, Counter
from tqdm import tqdm

def fetch_iclr_metadata(year: int, download_pdf: bool = False):
    print(f"\n  Fetching ICLR {year} submissions...")

    # Paths
    base_dir = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project"
    meta_dir = os.path.join(base_dir, "data", "ICLR", "metadata")
    os.makedirs(meta_dir, exist_ok=True)
    meta_path = os.path.join(meta_dir, f"iclr_metadata_{year}.json")

    metadata = []
    accepted_count = 0
    skipped_reasons = defaultdict(int)
    printed_decision_keys = False

    if year <= 2023:
        import openreview  # type: ignore
        client = openreview.Client(
            baseurl="https://api.openreview.net",
            username="chen.12915@osu.edu",
            password="Alex08180818"
        )
        invitation = f"ICLR.cc/{year}/Conference/-/Blind_Submission"
        submissions = client.get_all_notes(invitation=invitation)
    else:
        from openreview.api import OpenReviewClient  # type: ignore
        client = OpenReviewClient(
            baseurl="https://api2.openreview.net",
            username="chen.12915@osu.edu",
            password="Alex08180818"
        )
        invitation = f"ICLR.cc/{year}/Conference/-/Submission"
        submissions = list(client.get_all_notes(invitation=invitation))

    print(f"\n Total submissions fetched: {len(submissions)}")

    if not submissions:
        print("No submissions found. Check the invitation or year.")
        return

    print("\n Sample content keys in first submission:")
    for k in submissions[0].content.keys():
        print(f" - {k}")

    for paper in tqdm(submissions, desc=f"Processing ICLR {year} papers"):
        content = paper.content
        paper_id = paper.id
        forum_id = getattr(paper, 'forum', paper.id)

        # Fetch Decision
        decision_note = None
        final_decision = "Unknown"

        if year <= 2023:
            notes = client.get_notes(forum=forum_id)
            for note in notes:
                if hasattr(note, "invitation") and "Decision" in note.invitation:
                    decision_note = note
                    break
        else:
            decision_notes = list(client.get_notes(forum=forum_id))
            for note in decision_notes:
                if "decision" in note.content:
                    decision_note = note
                    break

        if decision_note:
            # Print decision keys immediately when any decision note is seen
            if not printed_decision_keys:
                print("\n Sample keys in Decision Note content:")
                for k in decision_note.content.keys():
                    print(f" - {k}")
                printed_decision_keys = True

            decision_field = decision_note.content.get("decision", "Unknown")
            if isinstance(decision_field, dict):
                final_decision = decision_field.get("value", "Unknown")
            else:
                final_decision = str(decision_field)

        # Skip reject / withdraw / withdrawn / rejected from decision
        final_decision_lower = final_decision.lower()
        if any(x in final_decision_lower for x in ["reject", "withdraw", "withdrawn", "rejected"]):
            skipped_reasons[final_decision.strip()] += 1
            continue

        # Also skip if venue string implies withdrawn/rejected
        venue_text = content.get("venue", {})
        if isinstance(venue_text, dict):
            venue_value = venue_text.get("value", "").lower()
        else:
            venue_value = str(venue_text).lower()

        if any(x in venue_value for x in ["reject", "withdraw", "withdrawn", "rejected"]):
            skipped_reasons[f"Venue: {venue_value}"] += 1
            continue

        accepted_count += 1

        # Helper functions
        def safe_get(field, default=""):
            val = content.get(field, {})
            if isinstance(val, dict):
                return val.get("value", default)
            return str(val)

        def safe_list(field):
            val = content.get(field, {})
            if isinstance(val, dict):
                return val.get("value", [])
            elif isinstance(val, list):
                return val
            return []

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

    # Write to file
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    print(f"\n  Metadata saved to: {meta_path}")
    print(f"\n  Accepted: {accepted_count}")
    print(f"  Rejected/Withdrawn Breakdown:")
    for reason, count in skipped_reasons.items():
        print(f" - {reason}: {count}")

    venue_counts = Counter(p.get("venue", "unknown") for p in metadata)
    print("\n  Venue distribution:")
    for v, c in venue_counts.items():
        print(f" - {v or '[blank]'}: {c}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True, help="ICLR year (e.g. 2023 or 2025)")
    parser.add_argument("--pdf", action="store_true", help="Unused for now")
    args = parser.parse_args()
    fetch_iclr_metadata(args.year, args.pdf)


