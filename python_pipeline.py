# from wa_entrez import EntrezClient, wa_efetch
import xml.etree.ElementTree as ET
from wa_entrez import WAEntrezClient
import json
import io
from Bio import SeqIO

def fetch_pubmed():
    
    # Read config.json
    with open("config.json", "r") as f:
        config = json.load(f)
    
    pmid = config["pmid"]

    # Construct the URL
    url = (
        f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id={pmid}&retmode=xml"
    )
    

    # Request the data from the URL
    response = open_url(url)
    xml_data = response.read()

    # Parse the XML data
    root = ET.fromstring(xml_data)
    article = root.find(".//PubmedArticle")
    
    if article is None:
        raise ValueError("No article found for the given PMID")

    title = article.find(".//ArticleTitle")
    journal = article.find(".//Journal/Title")
    pubYear = article.find(".//Journal/JournalIssue/PubDate/Year")
    pubMonth = article.find(".//Journal/JournalIssue/PubDate/Month")

    authors = article.findall(".//AuthorList/Author")
    author_names = []
    
    for author in authors:
        last_name = author.find("LastName")
        fore_name = author.find("ForeName")
        if last_name is not None and fore_name is not None:
            author_names.append(f"{fore_name.text} {last_name.text}")
            
    result_data = {
        "title": title.text if title is not None else "N/A",
        "journal": journal.text if journal is not None else "N/A",
        "authors": ', '.join(author_names) if author_names else "N/A"
    }
    
    # Write result.txt
    output = (f"Title: {title.text if title is not None else 'N/A'}\n"
             f"Journal: {journal.text if journal is not None else 'N/A'}\n"
             f"Publication Year: {pubYear.text if pubYear is not None else 'N/A'}\n"
             f"Publication Month: {pubMonth.text if pubMonth is not None else 'N/A'}\n"
             f"Authors: {', '.join(author_names) if author_names else 'N/A'}")

    with open("pubmed_result.txt", "w") as f:
        f.write(output)
    
    return {
        **result_data,
        "file": "pubmed_result.txt"
    }



def fetch_genomics():
    with open("config.json", "r") as f:
        config = json.load(f)
    genome_id = config["genome"]
    
    client = WAEntrezClient(email="test@example.com")
    result = client.wa_efetch(db="nucleotide", id=genome_id, rettype="gbwithparts", retmode="text")
    
    record = list(SeqIO.parse(io.StringIO(result), "genbank"))[0]
    
    if not record:
        raise ValueError("No record found for the given genome ID")
    
    
    result_data = {
        "id": record.id,
        "name": record.name,
        "description": record.description,
        "sequence_length": len(record.seq),
        "organism": record.annotations.get("organism", "N/A"),
        "features": len(record.features)
    }
    
    output = (f"ID: {record.id}\n"
              f"Name: {record.name}\n"
              f"Description: {record.description}\n"
              f"Sequence Length: {len(record.seq)}\n"
              f"Organism: {record.annotations.get('organism', 'N/A')}\n"
              f"Features: {len(record.features)}")
    
    with open("genomics_result.txt", "w") as f:
        f.write(output)
        
    return {
        **result_data,
        "file": "genomics_result.txt"
    }
