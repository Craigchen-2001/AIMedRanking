import os
import shutil

# Source and destination directories
src_folder = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/all_pdf"
dst_folder = "/Users/chenweichi/ICLR_2025_Project/ICLR_2025_Project/outputs/ICLR/pdf_test_topic"

# Make sure destination exists
os.makedirs(dst_folder, exist_ok=True)

# List of paper IDs
paper_ids = [
    "WwmtcGr4lP", "s5epFPdIW6", "i2r7LDjba3", "8fLgt7PQza", "6Hz1Ko087B", "PstM8YfhvI",
    "hjROBHstZ3", "nYpPAT4L3D", "XQlccqJpCC", "7zwIEbSTDy", "3b9SKkRAKw", "ozZG5FXuTV",
    "NJxCpMt0sf", "zcTLpIfj9u", "BHFs80Jf5V", "mOpNrrV2zH", "v9EjwMM55Y", "zg3ec1TdAP",
    "n34taxF0TC", "k2uUeLCrQq", "yb4QE6b22f", "hwnObmOTrV"
]

# Copy matching PDFs
for pid in paper_ids:
    filename = f"{pid}.pdf"
    src_path = os.path.join(src_folder, filename)
    dst_path = os.path.join(dst_folder, filename)

    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"Copied: {filename}")
    else:
        print(f"Not found: {filename}")
