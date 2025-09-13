import json, argparse, os

def parse_bool(v):
    if isinstance(v, bool): 
        return v
    if isinstance(v, str):
        s=v.strip().lower()
        if s in ["true","t","1","yes","y"]: return True
        if s in ["false","f","0","no","n"]: return False
        if s in ["n/a","na",""]: return "N/A"
    return v

def load_codelinks(path):
    with open(path, "r", encoding="utf-8") as f:
        items=json.load(f)
    m={}
    for it in items:
        k=str(it.get("id","")).strip()
        if not k: 
            continue
        m[k]={"code_link": it.get("code_link","N/A"), "is_public": parse_bool(it.get("is_public","N/A"))}
    return m

def merge_one(meta_path, cl_map, used_ids):
    with open(meta_path, "r", encoding="utf-8") as f:
        data=json.load(f)
    updated=0
    for obj in data:
        k=str(obj.get("id","")).strip()
        if not k: 
            continue
        if k in cl_map:
            obj["code_link"]=cl_map[k]["code_link"]
            obj["is_public"]=cl_map[k]["is_public"]
            used_ids.add(k)
            updated+=1
    out_path=meta_path.replace(".json","")+".merged_codelinks.json"
    with open(out_path,"w",encoding="utf-8") as f:
        json.dump(data,f,ensure_ascii=False,indent=2)
    return out_path, updated, len(data)

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("-c","--code_links",required=True)
    ap.add_argument("-f","--files",nargs="+",required=True)
    args=ap.parse_args()

    cl_map=load_codelinks(args.code_links)
    used_ids=set()
    total_updated=0

    for fp in args.files:
        out_path, updated, total=merge_one(fp, cl_map, used_ids)
        total_updated+=updated
        print(f"{os.path.basename(fp)} -> {os.path.basename(out_path)} | updated: {updated}/{total}")

    print(f"\nTotal updated ids across all files: {total_updated}")
    not_used=[cid for cid in cl_map.keys() if cid not in used_ids]
    print(f"Code_links.json total ids: {len(cl_map)}")
    print(f"Matched ids: {len(used_ids)}")
    print(f"Unmatched ids: {len(not_used)}")
    if not_used:
        print("Unmatched id list:")
        for cid in not_used:
            print(f"  {cid}")

if __name__=="__main__":
    main()
