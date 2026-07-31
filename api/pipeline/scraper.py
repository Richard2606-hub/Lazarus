import requests
from typing import List, Dict, Optional

def fetch_retracted_papers(limit: int = 10) -> List[Dict]:
    """
    Fetches retracted papers from the Crossref API.
    We filter for items that are marked as retracted and have an abstract available.
    """
    print(f"Scraping Crossref for {limit} retracted papers...")
    # The Crossref API is free and public.
    # We query for works that have an update-type of 'retraction' or are marked as retracted.
    # 'is-update:true' and 'update-type:retraction' is often the most reliable way.
    url = "https://api.crossref.org/works"
    params = {
        "filter": "has-abstract:true,is-update:true", 
        "query": "retracted",
        "select": "title,abstract,author,URL,update-to",
        "rows": limit * 2, # Fetch more because we will filter locally
        "mailto": "prototype@lazarus.local" # Polite pool requirement
    }
    
    try:
        response = requests.get(url, params=params, timeout=15)
        response.raise_for_status()
        data = response.json()
        
        items = data.get("message", {}).get("items", [])
        
        scraped_papers = []
        for item in items:
            title = item.get("title", [""])[0]
            abstract = item.get("abstract", "")
            
            import re
            abstract = re.sub(r'<[^>]+>', '', abstract).strip()
                
            authors_list = item.get("author", [])
            authors_str = ", ".join([f"{a.get('given', '')} {a.get('family', '')}".strip() for a in authors_list])
            if not authors_str:
                authors_str = "Unknown Authors"
                
            url = item.get("URL", "")
            
            # Basic validation
            if len(title) > 10 and len(abstract) > 50:
                scraped_papers.append({
                    "title": title,
                    "authors": authors_str,
                    "abstract": abstract,
                    "source_url": url,
                    "source_type": "retraction",
                    "stated_reason": "Retracted as per Crossref metadata."
                })
                
            if len(scraped_papers) >= limit:
                break
                
        print(f"Successfully scraped {len(scraped_papers)} valid papers.")
        return scraped_papers
        
    except Exception as e:
        print(f"Error scraping Crossref: {e}")
        return []

if __name__ == "__main__":
    papers = fetch_retracted_papers(3)
    for p in papers:
        print(f"Title: {p['title']}")
        print(f"Authors: {p['authors']}")
        print(f"Abstract: {p['abstract'][:100]}...")
        print("-" * 40)
