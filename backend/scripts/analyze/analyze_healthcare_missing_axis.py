import os
import json
import re
from tqdm import tqdm
from helper import extractData

URL_RE = re.compile(r"https?://[^\s\[\]【】]+")
TARGET_IDS = [
    "rbr2mMSBua","nsv3ogqRIU","FAiIRMvIwy","UAc6RL9Tt4","L8pbQy0SsG","JMq90N6lLe","NMvMYtRjkg",
    "1BAiQmAFsx","H2m4chAfig","kND7h1kD53","swf3Hbc3Qe","D4hcJPkJ3y","JML6Zi5J0s","dw9H08UxJb",
    "P4KjfMrVNU","Iicv9iTPcU","49EjZytlus","STsjfx2cee","CrxR6CYeQn","TLlFnoPUdB","hw0hl4JmvA",
    "0wV5HR7M4P","IPxOoU8aqt","Ekw6gjs5Y5","qcdoHkkHcb","3Sk8CaQWdv","MoS4P8zieM","waHF2ekuf2",
    "ls5L4IMEwt","tI04KmK27S","zb16xZ1NGB","FVtu7yC7fY","4P6Mployhf","IwjkwtkPGb","aXAkNlbnGa",
    "098tsRhmQ7","I822ZIRtms","fYSPRGmS6l","kgjY80e1LF","2PhVe7p9xD","aXpbgG5z6I","7wdi1LaocD",
    "ZC2rbIYWfy","2uKVyGq5zK","P37GIj4wB7","JPoQca8CSg","agcXjEHmyW","lovTDtbsdZ","ugOn7Pohxv",
    "XQIa0vGIum","idtZwmjakN","gUbQZ7AtaZ","867TaCMfCj","aTqfufujj7","7L4NvUtZY3","OiqQGjNvyJ",
    "3p4272zl7q","AHjspi4R22","VkSd42HWil","pzPyxXjHrT","7yOl9qiLWd","3aNvX9TQTo","hWtvsL51hO",
    "wTBhWbCRpN","cdgVrsu7T5","TtHvmhjNui","PhHrlDKcx1","feLdTALuq3","yh1t1yFtXG","IWEc6kpy8O",
    "L3aEdxJMHl","NY3LzmUXl7","pOJBw1YQgL"
]

def parse_markdown(raw: str) -> dict:
    data = {}
    parts = re.split(r"- \*\*(.+?)\*\*:", raw)
    for i in range(1, len(parts), 2):
        key = parts[i].strip()
        body = parts[i+1]
        if key in ("Code Link", "Dataset Link"):
            urls = URL_RE.findall(body)
            if urls:
                data[key] = urls if key == "Dataset Link" else urls[0]
            else:
                for ln in body.splitlines():
                    ln = ln.strip()
                    if ln:
                        data[key] = ln
                        break
                else:
                    data[key] = ""
            continue
        for ln in body.splitlines():
            ln = ln.strip()
            if ln:
                data[key] = ln
                break
        else:
            data[key] = ""
    return data

def parse_gpt_output(raw: str) -> dict:
    raw = raw.strip()
    m = re.match(r"```json\s*(\{.*?\})\s*```", raw, flags=re.DOTALL)
    if m:
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError:
            pass
    if raw.startswith("{") and raw.endswith("}"):
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            pass
    return parse_markdown(raw)

def main():
    pdf_folder = input("Enter downloaded PDF folder path: ").strip()
    json_path = input("Enter input JSON path: ").strip()
    prompt_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/pdf_extraction_instruction.txt"
    fewshot_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/few_shot_examples.md"
    output_json = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/NeurIPS_metadata2025_axis_filled.json"

    with open(prompt_path, "r", encoding="utf-8") as f:
        base_instruction = f.read()
    with open(fewshot_path, "r", encoding="utf-8") as f:
        few_shot_examples = f.read()
    full_instruction = base_instruction.strip()

    with open(json_path, "r", encoding="utf-8") as f:
        original_data = json.load(f)
    paper_map = {p["id"]: p for p in original_data if p.get("id") in TARGET_IDS}

    pdf_files = [fn for fn in os.listdir(pdf_folder) if fn.endswith(".pdf")]
    pdf_ids = [os.path.splitext(fn)[0] for fn in pdf_files if os.path.splitext(fn)[0] in TARGET_IDS]
    print(f"Found {len(pdf_ids)} target PDFs in: {pdf_folder}")
    choice = input("How many to process? (number/all): ").strip().lower()
    if choice == "all":
        to_process = pdf_ids
    else:
        to_process = pdf_ids[:int(choice)]

    processed = []
    for pid in tqdm(to_process, desc="Processing PDFs"):
        if pid not in paper_map:
            continue
        entry = paper_map[pid]
        pdf_path = os.path.join(pdf_folder, f"{pid}.pdf")
        res = extractData(pdf_path, full_instruction)
        gpt_raw = res.get("gpt_output", "")

        entry["prompt_tokens"] = res.get("prompt_tokens", -1)
        entry["completion_tokens"] = res.get("completion_tokens", -1)
        entry["total_tokens"] = res.get("total_tokens", -1)

        parsed = parse_gpt_output(gpt_raw)

        for axis in ["I", "II", "III"]:
            axis_key = f"Topic Axis {axis}"
            if axis_key in parsed and isinstance(parsed[axis_key], dict):
                axis_data = parsed[axis_key]
                entry[axis_key] = {
                    "MainTopic": axis_data.get("MainTopic", "N/A") or "N/A",
                    "SubTopic": axis_data.get("SubTopic", "N/A") or "N/A"
                }
            else:
                entry[axis_key] = {"MainTopic": "N/A", "SubTopic": "N/A"}

        entry["method"] = parsed.get("Method", "N/A") or "N/A"
        entry["application"] = parsed.get("Application", "N/A") or "N/A"
        entry["code_link"] = parsed.get("Code Link", "N/A") or "N/A"
        entry["dataset_name"] = parsed.get("Dataset Name", "N/A") or "N/A"

        processed.append(entry)

    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    total_prompt_tokens = sum(p.get("prompt_tokens", 0) for p in processed)
    total_completion_tokens = sum(p.get("completion_tokens", 0) for p in processed)
    total_tokens = sum(p.get("total_tokens", 0) for p in processed)
    cost_prompt = total_prompt_tokens / 1000 * 0.005
    cost_completion = total_completion_tokens / 1000 * 0.015
    total_cost = cost_prompt + cost_completion

    na_ids = []
    for p in processed:
        axes = [p.get("Topic Axis I", {}), p.get("Topic Axis II", {}), p.get("Topic Axis III", {})]
        if any((a.get("MainTopic","").strip().lower() in ["", "n/a", "na", "none", "null"]) for a in axes):
            na_ids.append(p.get("id","N/A"))

    print(f"Saved {len(processed)} entries to {output_json}")
    print("\n===== Token Usage Summary =====")
    print(f"Total Papers           : {len(processed)}")
    print(f"Total Prompt Tokens    : {total_prompt_tokens}")
    print(f"Total Completion Tokens: {total_completion_tokens}")
    print(f"Total Tokens           : {total_tokens}")
    print("================================")
    print(f"Estimated Cost (GPT-4o): ${total_cost:.4f}")
    print("================================")
    print(f"\nStill N/A in any Axis MainTopic: {len(na_ids)}")
    if na_ids:
        print("IDs:")
        for i in na_ids:
            print(i)

if __name__ == "__main__":
    main()
