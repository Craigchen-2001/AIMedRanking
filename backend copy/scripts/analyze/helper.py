import os
import time
import json
from openai import AzureOpenAI  # type: ignore
import re

# Azure OpenAI credentials
os.environ["AZURE_OPENAI_API_KEY"] = "27K1tUZVh5hh0DHdB72hBUdpWxX3zYLzCNa8UAYkYiEmKPx6IMRiJQQJ99BFACYeBjFXJ3w3AAABACOGEt0r"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://weichi.openai.azure.com/"

client = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    api_version="2025-01-01-preview",
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

# deployment_name = "o4-mini"  # Make sure this is a valid Assistant-supported deployment
deployment_name = "gpt-4o"

# Unified PDF extraction function

# def extractData(filepath, base_instruction):
#     """
#     Send the PDF to Azure OpenAI Assistant and return the assistant's response text.
#     """
#     try:
#         # 1) Create Assistant
#         assistant = client.beta.assistants.create(
#             name="RAG Assistant",
#             instructions=base_instruction,
#             model=deployment_name,
#             tools=[{"type": "file_search"}]
#         )

#         # 2) Upload PDF
#         message_file = client.files.create(
#             file=open(filepath, "rb"),
#             purpose="assistants"
#         )

#         # 3) Create conversation thread
#         thread = client.beta.threads.create(
#             messages=[{
#                 "role": "user",
#                 "content": "Please help extract structured metadata from this paper based on the instructions.",
#                 "attachments": [
#                     {"file_id": message_file.id, "tools": [{"type": "file_search"}]}
#                 ]
#             }]
#         )

#         # 4) Run Assistant
#         run = client.beta.threads.runs.create(
#             thread_id=thread.id,
#             assistant_id=assistant.id
#         )

#         # 5) Wait for completion
#         status = checkStatus(thread, run)
#         if status != "completed":
#             return {"gpt_output": "N/A"}

#         # 6) Retrieve all messages
#         msgs = client.beta.threads.messages.list(thread_id=thread.id).data

#         # 7) Reverse search to find the first assistant reply
#         for msg in reversed(msgs):
#             if msg.role == "assistant":
#                 d = msg.model_dump()

#                 # content is a list; get the first item
#                 content_list = d.get("content", [])
#                 if isinstance(content_list, list) and content_list:
#                     first = content_list[0]
#                     txt_dict = first.get("text", {})
#                     if isinstance(txt_dict, dict) and "value" in txt_dict:
#                         return {"gpt_output": txt_dict["value"]}

#         # Return N/A if no valid response is found
#         return {"gpt_output": "N/A"}

#     except Exception as e:
#         print(f"Error in extractData: {e}")
#         return {"gpt_output": "N/A"}


def extractData(filepath, base_instruction):
    try:
        assistant = client.beta.assistants.create(
            name="RAG Assistant",
            instructions=base_instruction,
            model=deployment_name,
            tools=[{"type": "file_search"}]
        )

        message_file = client.files.create(
            file=open(filepath, "rb"),
            purpose="assistants"
        )

        thread = client.beta.threads.create(
            messages=[{
                "role": "user",
                "content": "Please help extract structured metadata from this paper based on the instructions.",
                "attachments": [
                    {"file_id": message_file.id, "tools": [{"type": "file_search"}]}
                ]
            }]
        )

        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=assistant.id
        )

        # Wait for completion
        status = checkStatus(thread, run)
        if status != "completed":
            return {
                "gpt_output": "N/A",
                "prompt_tokens": -1,
                "completion_tokens": -1,
                "total_tokens": -1
            }

        # Get usage stats
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        usage = run.usage

        # Retrieve messages
        msgs = client.beta.threads.messages.list(thread_id=thread.id).data
        for msg in reversed(msgs):
            if msg.role == "assistant":
                d = msg.model_dump()
                content_list = d.get("content", [])
                if isinstance(content_list, list) and content_list:
                    txt_dict = content_list[0].get("text", {})
                    if isinstance(txt_dict, dict) and "value" in txt_dict:
                        return {
                            "gpt_output": txt_dict["value"],
                            "prompt_tokens": usage.prompt_tokens,
                            "completion_tokens": usage.completion_tokens,
                            "total_tokens": usage.total_tokens
                        }

        return {
            "gpt_output": "N/A",
            "prompt_tokens": usage.prompt_tokens,
            "completion_tokens": usage.completion_tokens,
            "total_tokens": usage.total_tokens
        }

    except Exception as e:
        print(f"Error in extractData: {e}")
        return {
            "gpt_output": "N/A",
            "prompt_tokens": -1,
            "completion_tokens": -1,
            "total_tokens": -1
        }


def checkStatus(thread, run):
    start = time.time()
    status = run.status
    while status not in ["completed", "cancelled", "expired", "failed"]:
        if time.time() - start > 600:
            print("Timeout reached (10 minutes). Skipping this file.")
            return "timeout"
        time.sleep(5)
        run = client.beta.threads.runs.retrieve(thread_id=thread.id, run_id=run.id)
        status = run.status
        print(f" Waiting... Status: {status}")
    print(f"Final Status: {status} (elapsed {int(time.time()-start)}s)")
    return status



def extractFromAbstract(title, abstract, keywords, base_instruction):
    if isinstance(keywords, list):
        keywords = ", ".join(keywords)
    prompt = f"Title: {title}\n\nAbstract: {abstract}\n\nKeywords: {keywords}\n\n{base_instruction}"

    messages = [{"role": "user", "content": prompt}]
    response = client.chat.completions.create(
        model=deployment_name,
        messages=messages
    )

    result_text = response.choices[0].message.content.strip()

    return {
        "paper_id": "",
        "title": title,
        "abstract": abstract,
        "gpt_output": result_text
    }
# ===============================
def extractAffiliation(metadata: dict, instruction: str) -> dict:
    """
    Extract affiliations from metadata using GPT.
    Input metadata fields: title, year, conference, authors, pdf_url
    Return JSON with: 'affiliation' (list), 'authors/affiliations' (dict)
    """

    title = metadata.get("title", "")
    year = metadata.get("year", "")
    conference = metadata.get("conference", "")
    authors = metadata.get("authors", [])
    pdf_url = metadata.get("pdf_url", "")

    author_str = ", ".join(authors) if isinstance(authors, list) else str(authors)

    prompt = (
        f"Paper Title: {title}\n"
        f"Authors: {author_str}\n"
        f"Conference: {conference} {year}\n"
        f"PDF URL: {pdf_url}\n\n"
        f"{instruction}"
    )

    try:
        messages = [{"role": "user", "content": prompt}]
        response = client.chat.completions.create(
            model=deployment_name,
            messages=messages
        )
        reply = response.choices[0].message.content.strip()

        # === DEBUG PRINT ===
        print(f"[DEBUG] GPT raw reply:\n{reply}\n")

        # Remove Markdown-style wrappers ```json ... ```
        json_str = re.sub(r"^```json|```$", "", reply.strip(), flags=re.IGNORECASE).strip("` \n")

        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError as decode_err:
            print(f"[ERROR] JSON parsing failed: {decode_err}")
            return {"raw_output": reply}

    except Exception as e:
        print(f"[ERROR] extractAffiliation failed: {e}")
        return {"affiliation": [], "authors/affiliations": {}}
    
def extractAffiliationFromAffiliationOnly(affiliation: str, homepage: str, instruction: str) -> dict:
    prompt = (
        f"You are a research assistant tasked with analyzing the institutional affiliation of a researcher.\n\n"
        f'{{\n  "affiliation": "{affiliation}",\n  "homepage": "{homepage}"\n}}\n\n'
        f"{instruction}"
    )

    try:
        messages = [{"role": "user", "content": prompt}]
        response = client.chat.completions.create(
            model=deployment_name,
            messages=messages
        )

        reply = response.choices[0].message.content.strip()

        json_str = re.sub(r"^```json|```$", "", reply.strip(), flags=re.IGNORECASE).strip()

        result = json.loads(json_str)

        return {
            "affiliation": result.get("affiliation", affiliation),  
            "country": result.get("country", "N/A"),
            "region": result.get("region", "N/A"),
            "subregion": result.get("subregion", "N/A"),
            "latitude": result.get("latitude", None),
            "longitude": result.get("longitude", None)
        }

    except Exception as e:
        print(f"[ERROR] extractAffiliationFromAffiliationOnly failed: {e}")
        return {
            "affiliation": affiliation,
            "country": "N/A",
            "region": "N/A",
            "subregion": "N/A",
            "latitude": None,
            "longitude": None
        }
