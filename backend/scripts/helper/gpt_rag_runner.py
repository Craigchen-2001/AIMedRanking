import os
from scripts.analyze.helper import  extractData  # 確保 helper.py 有此函式
from pathlib import Path

# 🔍 主 prompt 路徑
PROMPT_PATH = "prompts/base_healthcare_instruction.txt"
PDF_DIR = "data/raw_pdfs"
OUTPUT_DIR = "outputs"

# ✅ 確保輸出資料夾存在
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 讀取主提示內容
with open(PROMPT_PATH, "r", encoding="utf-8") as f:
    base_instruction = f.read()

# 遍歷所有 PDF 檔案
for filename in sorted(os.listdir(PDF_DIR)):
    if filename.endswith(".pdf"):
        filepath = os.path.join(PDF_DIR, filename)
        print(f"📄 Processing: {filename}")

        try:
            output_text_list =  extractData(filepath, base_instruction)
            text_result = output_text_list[0]

            # 儲存結果成 .json（其實是純文字格式）
            output_filename = filename.replace(".pdf", ".json")
            output_path = os.path.join(OUTPUT_DIR, output_filename)

            with open(output_path, "w", encoding="utf-8") as fout:
                fout.write(text_result)

            print(f"Done: {output_path}")
        except Exception as e:
            print(f"Failed on {filename}: {e}")
