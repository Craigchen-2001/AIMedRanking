def extract_title(pdf_url):
    return pdf_url.split('/')[-1].replace(".pdf", "").replace(" ", "_")
