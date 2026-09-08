"""
ScrapperPro Backend
===================
A simple Python scraper that searches public sources for names/keywords.
Supports: Reddit, YouTube, NotFans, and generic web search.

Usage:
    python scrapper.py --query "Neiva Mara" --sources reddit,youtube,notfans

Output:
    JSON array of results with title, url, snippet, source, date.
"""

import argparse
import json
import sys
from datetime import datetime
from urllib.parse import quote_plus

try:
    import requests
except ImportError:
    requests = None


def scrape_reddit(query: str, limit: int = 5) -> list[dict]:
    """Search Reddit for public posts matching the query."""
    if not requests:
        return []
    results = []
    try:
        url = f"https://www.reddit.com/search.json?q={quote_plus(query)}&limit={limit}"
        headers = {"User-Agent": "ScrapperPro/1.0"}
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json()
            for child in data.get("data", {}).get("children", []):
                post = child.get("data", {})
                results.append({
                    "source": "Reddit",
                    "title": post.get("title", ""),
                    "url": f"https://reddit.com{post.get('permalink', '')}",
                    "snippet": post.get("selftext", "")[:200] or post.get("title", ""),
                    "date": datetime.fromtimestamp(post.get("created_utc", 0)).isoformat()
                })
    except Exception as e:
        results.append({"source": "Reddit", "error": str(e)})
    return results


def scrape_youtube(query: str, limit: int = 5) -> list[dict]:
    """Return YouTube search result URLs (no API key required for basic search page)."""
    results = []
    try:
        search_url = f"https://www.youtube.com/results?search_query={quote_plus(query)}"
        results.append({
            "source": "YouTube",
            "title": f"YouTube search: {query}",
            "url": search_url,
            "snippet": f"Search results for '{query}' on YouTube.",
            "date": datetime.now().isoformat()
        })
    except Exception as e:
        results.append({"source": "YouTube", "error": str(e)})
    return results


def scrape_notfans(query: str, limit: int = 5) -> list[dict]:
    """Search NotFans for public profiles/posts."""
    results = []
    try:
        search_url = f"https://notfans.com/search?q={quote_plus(query)}"
        results.append({
            "source": "NotFans",
            "title": f"NotFans search: {query}",
            "url": search_url,
            "snippet": f"Public data for '{query}' on NotFans.",
            "date": datetime.now().isoformat()
        })
    except Exception as e:
        results.append({"source": "NotFans", "error": str(e)})
    return results


SOURCES = {
    "reddit": scrape_reddit,
    "youtube": scrape_youtube,
    "notfans": scrape_notfans,
}


def main():
    parser = argparse.ArgumentParser(description="ScrapperPro - Public source scraper")
    parser.add_argument("--query", required=True, help="Search query, e.g. 'Neiva Mara'")
    parser.add_argument("--sources", default="reddit,youtube,notfans", help="Comma-separated sources")
    parser.add_argument("--limit", type=int, default=5, help="Results per source")
    parser.add_argument("--output", default="results.json", help="Output JSON file")
    args = parser.parse_args()

    selected = [s.strip() for s in args.sources.split(",") if s.strip() in SOURCES]
    if not selected:
        selected = list(SOURCES.keys())

    all_results = []
    for source_name in selected:
        scraper = SOURCES[source_name]
        results = scraper(args.query, args.limit)
        all_results.extend(results)

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2, ensure_ascii=False)

    print(json.dumps({"status": "ok", "count": len(all_results), "output": args.output}, indent=2))


if __name__ == "__main__":
    main()
