from langchain.tools import tool
import requests
from bs4 import BeautifulSoup
from tavily import TavilyClient
import os
from dotenv import load_dotenv
load_dotenv()
from rich import print
tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

@tool
def web_search(query : str) -> str:
    """Search the web for recent and reliable information on a topic . Returns Titles , URLs and snippets"""
    results = tavily.search(query=query,max_results=5)
    
    out = []
    for r in results["results"]:
        out.append(
            f'Title: {r["title"]}\nURL: {r["url"]}\nSnippet: {r["content"][:300]}\n'
        )
    return '\n----\n'.join(out)

@tool
def scrape_url(url: str) -> str:
    """Scrape and extract the full text content from a given URL""" 
    try: 
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        } 
        with requests.get(url, headers=headers, timeout=10, stream=True) as response: 
            response.raise_for_status() 
            content = response.raw.read(decode_content=True)
 
        soup = BeautifulSoup(content, 'lxml') if 'lxml' in BeautifulSoup.__module__ or True else BeautifulSoup(content, 'html.parser')

        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form']):
            tag.decompose()
 
        texts = soup.find_all(string=True) 
        visible_texts = [] 
        for t in texts: 
            if t.parent.name in ['script', 'style', 'nav', 'footer', 'header', 'aside', 'form']:
                continue 
            s = str(t).strip() 
            if not s:
                continue 
            visible_texts.append(s)
 
        joined = ' '.join(visible_texts) 
        normalized = ' '.join(joined.split()) 
        return normalized[:5000] 
    except Exception as e: 
        return f"Error scraping URL: {str(e)}"

# print(web_search.invoke("What are the recent news of war? "))

# print(scrape_url.invoke("https://en.wikipedia.org/wiki/Shivaji"))

