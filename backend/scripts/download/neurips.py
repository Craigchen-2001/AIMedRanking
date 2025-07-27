import openreview
import json
from tqdm import tqdm
import os
import time

# --- NeurIPS 2020, 2021, 2022 (OpenReview API v1) ---
client_v1 = openreview.Client(baseurl='https://api.openreview.net')

def fetch_neurips_v1(year):
    invitation = f'NeurIPS.cc/{year}/Conference/-/Blind_Submission'
    print(f"Fetching NeurIPS {year} using v1 invitation: {invitation}")
    notes = openreview.tools.iterget_notes(client_v1, invitation=invitation)
    papers = []
    for note in tqdm(notes, desc=str(year)):
        content = note.content
        decision = "N/A"
        try:
            decisions = openreview.tools.iterget_notes(client_v1, forum=note.forum)
            for d in decisions:
                if 'Decision' in d.invitation:
                    decision = d.content.get('decision', 'N/A')
                    break
        except:
            pass
        if decision.lower().startswith("accept"):
            papers.append({
                "id": note.id,
                "title": content.get("title", "N/A"),
                "authors": content.get("authors", ["N/A"]),
                "affiliations": content.get("affiliations", ["N/A"]),
                "abstract": content.get("abstract", "N/A"),
                "keywords": content.get("keywords", ["N/A"]),
                "venue": f"NeurIPS_{year}",
                "pdf_url": f"https://openreview.net/pdf?id={note.id}",
                "doi": content.get("doi", "N/A"),
                "final_decision": decision
            })
    return papers

# --- NeurIPS 2023, 2024 (OpenReview API v2) ---
client_v2 = openreview.api.OpenReviewClient(baseurl='https://api2.openreview.net')


def fetch_neurips_v2(year):
    blind_invitation = f'NeurIPS.cc/{year}/Conference/-/Blind_Submission'
    decision_invitation = f'NeurIPS.cc/{year}/Conference/Paper.*/-/Decision'
    print(f"Fetching NeurIPS {year} using v2 invitation: {blind_invitation}")

    try:
        notes = client_v2.get_all_notes(invitation=blind_invitation)
    except openreview.OpenReviewException as e:
        print(f"Rate limit hit or error occurred: {e}")
        print("Sleeping for 60 seconds and retrying...")
        time.sleep(60)
        notes = client_v2.get_all_notes(invitation=blind_invitation)

    papers = []
    for note in tqdm(notes, desc=str(year)):
        try:
            decisions = client_v2.get_notes(forum=note.id)
            decision = next((d.content.get("decision", "N/A") for d in decisions if "decision" in d.content), "N/A")
        except:
            decision = "N/A"

        if decision.lower().startswith("accept"):
            content = note.content
            papers.append({
                "id": note.id,
                "title": content.get("title", "N/A"),
                "authors": content.get("authors", ["N/A"]),
                "affiliations": content.get("affiliations", ["N/A"]),
                "abstract": content.get("abstract", "N/A"),
                "keywords": content.get("keywords", ["N/A"]),
                "venue": f"NeurIPS_{year}",
                "pdf_url": f"https://openreview.net/pdf?id={note.id}",
                "doi": content.get("doi", "N/A"),
                "final_decision": decision
            })

    return papers

# Main calling function to scrape NeurIPS papers from 2020 to 2024
def scrape_neurips_2020_2024():
    os.makedirs("data/neurips/neurips_metadata", exist_ok=True)

    for yr in [2020, 2021, 2022]:
        try:
            papers = fetch_neurips_v1(yr)
            with open(f"data/neurips/neurips_metadata/neurips_metadata_{yr}.json", "w") as f:
                json.dump(papers, f, indent=2)
            print(f"Saved {len(papers)} accepted papers for {yr} to data/neurips/neurips_metadata/neurips_metadata_{yr}.json")
        except Exception as e:
            print(f"Failed to fetch {yr} (v1): {e}")

    for yr in [2023, 2024]:
        try:
            papers = fetch_neurips_v2(yr)
            with open(f"data/neurips/neurips_metadata/neurips_metadata_{yr}.json", "w") as f:
                json.dump(papers, f, indent=2)
            print(f"Saved {len(papers)} accepted papers for {yr} to data/neurips/neurips_metadata/neurips_metadata_{yr}.json")
        except Exception as e:
            print(f"Failed to fetch {yr} (v2): {e}")


if __name__ == "__main__":
    scrape_neurips_2020_2024()
