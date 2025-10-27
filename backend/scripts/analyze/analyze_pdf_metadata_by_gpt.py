import os
import json
import re
from tqdm import tqdm
from helper import extractData

# Regular expression to extract URLs
URL_RE = re.compile(r"https?://[^\s\[\]【】]+")

def parse_markdown(raw: str) -> dict:
    """
    Parse GPT Markdown-style output into a dict with keys:
    - Topic, Method, Application (single-line)
    - Code Link, Dataset Link (extract URLs)
    """
    data = {}
    parts = re.split(r"- \*\*(.+?)\*\*:", raw)
    for i in range(1, len(parts), 2):
        key = parts[i].strip()
        body = parts[i+1]

        # URL fields
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

        # Single-line fields
        for ln in body.splitlines():
            ln = ln.strip()
            if ln:
                data[key] = ln
                break
        else:
            data[key] = ""
    return data


def parse_gpt_output(raw: str) -> dict:
    """
    Try JSON (code block or raw), otherwise fallback to Markdown parsing.
    """
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
    pdf_folder  = input("Enter downloaded PDF folder path: ").strip()
    json_path   = input("Enter input JSON path: ").strip()
    prompt_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/pdf_extraction_instruction.txt"
    fewshot_path = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/prompts/few_shot_examples.md"
    output_json = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/backend/main/ACL_metadata.json"

    with open(prompt_path, "r", encoding="utf-8") as f:
        base_instruction = f.read()

    with open(fewshot_path, "r", encoding="utf-8") as f:
        few_shot_examples = f.read()

    full_instruction = base_instruction.strip() 
    with open(json_path, "r", encoding="utf-8") as f:
        original_data = json.load(f)
    paper_map = {p["id"]: p for p in original_data if p.get("is_healthcare") == "Yes"}

    pdf_files = [fn for fn in os.listdir(pdf_folder) if fn.endswith(".pdf")]
    print(f"Found {len(pdf_files)} PDFs in: {pdf_folder}")
    choice = input("How many to process? (number/all): ").strip().lower()
    to_process = pdf_files if choice == "all" else pdf_files[:int(choice)]

    processed = []
    for pdf_file in tqdm(to_process, desc="Processing PDFs"):
        pid = os.path.splitext(pdf_file)[0]
        if pid not in paper_map:
            continue
        entry = paper_map[pid]
        pdf_path = os.path.join(pdf_folder, pdf_file)

        res = extractData(pdf_path, full_instruction)
        gpt_raw = res.get("gpt_output", "")

        print("\n============================")
        print(f"Paper: {pdf_file}")
        print(f"Raw GPT Output:\n{gpt_raw}\n")

        entry["prompt_tokens"] = res.get("prompt_tokens", -1)
        entry["completion_tokens"] = res.get("completion_tokens", -1)
        entry["total_tokens"] = res.get("total_tokens", -1)

        parsed = parse_gpt_output(gpt_raw)

        for axis in ["I", "II", "III"]:
            axis_key = f"Topic Axis {axis}"
            if axis_key in parsed:
                axis_data = parsed[axis_key]
                entry[axis_key] = {
                    "MainTopic": axis_data.get("MainTopic", "N/A"),
                    "SubTopic": axis_data.get("SubTopic", "N/A")
                }
            else:
                entry[axis_key] = {
                    "MainTopic": "N/A",
                    "SubTopic": "N/A"
                }

        print(f"Parsed Topics:")
        for axis in ["I", "II", "III"]:
            axis_key = f"Topic Axis {axis}"
            print(f"{axis_key} - Main: {entry[axis_key]['MainTopic']} | Sub: {entry[axis_key]['SubTopic']}")

        entry["method"] = parsed.get("Method", "N/A") or "N/A"
        entry["application"] = parsed.get("Application", "N/A") or "N/A"
        entry["code_link"] = parsed.get("Code Link", "N/A") or "N/A"
        entry["dataset_name"] = parsed.get("Dataset Name", "N/A") or "N/A"

        processed.append(entry)

    os.makedirs(os.path.dirname(output_json), exist_ok=True)
    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(processed)} entries to {output_json}")

    # Token usage summary
    total_prompt_tokens = sum(p.get("prompt_tokens", 0) for p in processed)
    total_completion_tokens = sum(p.get("completion_tokens", 0) for p in processed)
    total_tokens = sum(p.get("total_tokens", 0) for p in processed)

    cost_prompt = total_prompt_tokens / 1000 * 0.005
    cost_completion = total_completion_tokens / 1000 * 0.015
    total_cost = cost_prompt + cost_completion

    print("\n===== Token Usage Summary =====")
    print(f"Total Papers           : {len(processed)}")
    print(f"Total Prompt Tokens    : {total_prompt_tokens}")
    print(f"Total Completion Tokens: {total_completion_tokens}")
    print(f"Total Tokens           : {total_tokens}")
    print("================================")
    print(f"Estimated Cost (GPT-4o): ${total_cost:.4f}")
    print("================================\n")


if __name__ == "__main__":
    main()

