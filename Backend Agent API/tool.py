"""Web search and scraping tools for the research pipeline."""

import os
import logging

import requests
from bs4 import BeautifulSoup
from langchain.tools import tool
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

MAX_SCRAPE_BYTES = 2 * 1024 * 1024  # 2 MB safety limit


@tool
def web_search(query: str) -> str:
    """Search the web for recent and reliable information on a topic. Returns Titles, URLs and snippets."""
    results = tavily.search(query=query, max_results=5)

    out = []
    for r in results["results"]:
        out.append(
            f'Title: {r["title"]}\nURL: {r["url"]}\nSnippet: {r["content"][:300]}\n'
        )
    return '\n----\n'.join(out)


@tool
def scrape_url(url: str) -> str:
    """Scrape and extract the full text content from a given URL."""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        # Guard against excessively large responses
        if len(response.content) > MAX_SCRAPE_BYTES:
            return f"Error: Response too large ({len(response.content)} bytes, limit {MAX_SCRAPE_BYTES})"

        # Use lxml if available, fall back to html.parser
        try:
            soup = BeautifulSoup(response.content, 'lxml')
        except Exception:
            soup = BeautifulSoup(response.content, 'html.parser')

        # Remove non-content tags
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'aside', 'form']):
            tag.decompose()

        # Extract visible text (tags already removed, no need to re-check parents)
        texts = soup.find_all(string=True)
        visible_texts = [s for t in texts if (s := str(t).strip())]

        joined = ' '.join(visible_texts)
        normalized = ' '.join(joined.split())
        return normalized[:5000]
    except requests.RequestException as e:
        logger.error(f"Scraping failed for {url}: {e}")
        return f"Error scraping URL: {str(e)}"
    except Exception as e:
        logger.error(f"Unexpected error scraping {url}: {e}")
        return f"Error scraping URL: {str(e)}"
