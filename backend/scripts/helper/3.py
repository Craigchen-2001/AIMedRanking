import json
import os
import re
from collections import defaultdict, Counter

BASE = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main"
FILES = {
    "ICLR": f"{BASE}/ICLR_metadata.json",
    "ICML": f"{BASE}/ICML_metadata.json",
    "NEURIPS": f"{BASE}/NEURIPS_is_healthcare_metadata.json",
    "KDD": f"{BASE}/KDD_metadata.json",
}
CSR_PATH = f"{BASE}/csranging/author_affiliation.json".replace("csranging", "csranking")
OUT_DIR = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/outputs/NeurIPS/matching_reports"

INCLUDE_KDD = True
COUNT_LOOSE_MATCH = True


def strip_trailing_id(s: str) -> str:
    return re.sub(r"\s+\d{3,5}$", "", s)


def norm_name(s: str) -> str:
    return " ".join(s.strip().split()).strip(",.;").casefold()


def load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_cs_lookups(cs_obj: dict):
    strict = {}
    noid = defaultdict(list)
    for k, v in cs_obj.items():
        if not isinstance(k, str):
            continue
        nk_strict = norm_name(k)
        if nk_strict not in strict:
            strict[nk_strict] = {"csr_name": k, "payload": v}
        nk_noid = norm_name(strip_trailing_id(k))
        noid[nk_noid].append({"csr_name": k, "payload": v})
    return strict, noid


def extract_institutions(payload):
    if payload is None:
        return []
    insts = []
    if isinstance(payload, dict):
        v = payload.get("affiliation")
        if isinstance(v, str) and v.strip():
            insts.append(v.strip())
        elif isinstance(v, list):
            for item in v:
                if isinstance(item, str) and item.strip():
                    insts.append(item.strip())
    elif isinstance(payload, list):
        for item in payload:
            if isinstance(item, dict):
                v = item.get("affiliation")
                if isinstance(v, str) and v.strip():
                    insts.append(v.strip())
                elif isinstance(v, list):
                    for x in v:
                        if isinstance(x, str) and x.strip():
                            insts.append(x.strip())
            elif isinstance(item, str) and item.strip():
                insts.append(item.strip())
    seen = set()
    uniq = []
    for s in insts:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    cs = load_json(CSR_PATH)
    cs_lookup_strict, cs_lookup_noid = build_cs_lookups(cs)
    cs_authors_norm_strict = set(cs_lookup_strict.keys())
    cs_authors_norm_noid = set(cs_lookup_noid.keys())

    conferences = ["ICLR", "ICML", "NEURIPS"] + (["KDD"] if INCLUDE_KDD else [])

    grand_all = set()
    grand_hit_keys = set()

    overall_matched = defaultdict(lambda: {
        "raw_names": set(),
        "csr_name": None,
        "conferences": set(),
        "count": 0
    })

    report = {}
    matched_with_institution_map = defaultdict(lambda: {
        "csr_name": None,
        "institution": [],
        "pdf_urls": set()
    })

    # === 處理每個會議 ===
    for conf in conferences:
        data = load_json(FILES[conf])
        hits_detail = []

        for rec in data:
            pdf_url = rec.get("pdf_url", "N/A")
            for raw in rec.get("authors") or []:
                if not isinstance(raw, str) or not raw.strip():
                    continue
                n = norm_name(raw)

                if n in cs_authors_norm_strict:
                    csr_info = cs_lookup_strict[n]
                    insts = extract_institutions(csr_info["payload"])
                    hits_detail.append({
                        "paper_author": raw,
                        "normalized": n,
                        "csr_name": csr_info["csr_name"],
                        "csr_payload": csr_info["payload"],
                        "ambiguous": False,
                        "candidate_csr_names": []
                    })
                    matched_with_institution_map[raw]["csr_name"] = csr_info["csr_name"]
                    matched_with_institution_map[raw]["institution"] = insts
                    matched_with_institution_map[raw]["pdf_urls"].add(pdf_url)
                    grand_hit_keys.add(n)
                    overall_matched[n]["raw_names"].add(raw)
                    overall_matched[n]["csr_name"] = csr_info["csr_name"]
                    overall_matched[n]["conferences"].add(conf)
                    overall_matched[n]["count"] += 1

                else:
                    n_noid = norm_name(strip_trailing_id(raw))
                    if n_noid in cs_authors_norm_noid:
                        candidates = cs_lookup_noid[n_noid]
                        chosen = candidates[0]
                        insts = extract_institutions(chosen["payload"])
                        hits_detail.append({
                            "paper_author": raw,
                            "normalized": n_noid,
                            "csr_name": chosen["csr_name"],
                            "csr_payload": chosen["payload"],
                            "ambiguous": len(candidates) > 1,
                            "candidate_csr_names": [c["csr_name"] for c in candidates]
                        })
                        matched_with_institution_map[raw]["csr_name"] = chosen["csr_name"]
                        matched_with_institution_map[raw]["institution"] = insts
                        matched_with_institution_map[raw]["pdf_urls"].add(pdf_url)
                        grand_hit_keys.add(n_noid)
                        if COUNT_LOOSE_MATCH:
                            overall_matched[n_noid]["raw_names"].add(raw)
                            overall_matched[n_noid]["csr_name"] = chosen["csr_name"]
                            overall_matched[n_noid]["conferences"].add(conf)
                            overall_matched[n_noid]["count"] += 1

        report[conf] = {
            "total_authors_in_papers": sum(len(rec.get("authors") or []) for rec in data),
            "matched_in_csranking": len(hits_detail),
            "matched_authors_file": os.path.join(OUT_DIR, f"{conf.lower()}_matched_authors.json")
        }

        with open(report[conf]["matched_authors_file"], "w", encoding="utf-8") as f:
            json.dump(hits_detail, f, indent=2, ensure_ascii=False)

    # === 輸出 matched_authors_with_institution.json ===
    matched_with_institution = []
    for raw, info in matched_with_institution_map.items():
        matched_with_institution.append({
            "paper_author": raw,
            "csr_name": info["csr_name"],
            "institution": info["institution"],
            "pdf_urls": sorted(info["pdf_urls"])
        })
    match_insts_out = os.path.join(OUT_DIR, "matched_authors_with_institution.json")
    with open(match_insts_out, "w", encoding="utf-8") as f:
        json.dump(matched_with_institution, f, indent=2, ensure_ascii=False)

    # === Overall matched list ===
    overall_matched_list = []
    for n, info in overall_matched.items():
        overall_matched_list.append({
            "normalized": n,
            "csr_name": info["csr_name"],
            "raw_names": sorted(info["raw_names"]),
            "conferences": sorted(info["conferences"]),
            "count": info["count"],
        })
    overall_matched_list.sort(key=lambda x: (-x["count"], x["csr_name"] or x["normalized"]))
    overall_matched_out = os.path.join(OUT_DIR, "overall_matched_authors.json")
    with open(overall_matched_out, "w", encoding="utf-8") as f:
        json.dump(overall_matched_list, f, indent=2, ensure_ascii=False)

    # === 機構計數（按篇數） ===
    inst_counter = Counter()
    for rec in matched_with_institution:
        for inst in set(rec["institution"]):
            inst_counter[inst] += len(rec["pdf_urls"])

    inst_ranked = inst_counter.most_common()
    inst_out = os.path.join(OUT_DIR, "institution_rankings.json")
    with open(inst_out, "w", encoding="utf-8") as f:
        json.dump(inst_ranked, f, indent=2, ensure_ascii=False)

    # === 所有配對到的機構清單（去重） ===
    matched_institutions = sorted(inst_counter.keys())
    inst_list_out = os.path.join(OUT_DIR, "matched_institutions_list.json")
    with open(inst_list_out, "w", encoding="utf-8") as f:
        json.dump(matched_institutions, f, indent=2, ensure_ascii=False)

    # === Summary ===
    summary = {
        "by_conference": report,
        "overall": {
            "matched_authors_with_institution_file": match_insts_out,
            "overall_matched_authors_file": overall_matched_out,
            "institution_ranking_file": inst_out,
            "matched_institutions_list_file": inst_list_out
        },
        "notes": "Institution counts are based on total papers, not unique authors."
    }
    out_path = os.path.join(OUT_DIR, "author_match_report.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print(json.dumps(summary, indent=2, ensure_ascii=False))
    print(f"Matched authors with institution saved to: {match_insts_out}")
    print(f"Institution ranking saved to: {inst_out}")
    print(f"Matched institutions list saved to: {inst_list_out}")


if __name__ == "__main__":
    main()
