import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache configuration
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_EXPIRY_SECONDS = 300  # 5 minutes
cache = {
    "data": None,
    "last_fetched": 0
}

def clean_tag(tag):
    """Remove namespace prefix from XML tag."""
    if '}' in tag:
        return tag.split('}', 1)[1]
    return tag

def parse_categories(content_html):
    """Extract update categories (e.g., Feature, Bug Fix) from release note content."""
    # Find all headings like <h3>Feature</h3> or <h3>Bug Fix</h3>
    headings = re.findall(r'<h3>(.*?)</h3>', content_html, re.IGNORECASE)
    categories = []
    for h in headings:
        # Strip HTML tags if any and clean up whitespace
        clean_h = re.sub('<[^<]+?>', '', h).strip()
        if clean_h and clean_h not in categories:
            categories.append(clean_h)
    
    # Fallback if no <h3> headings found
    if not categories:
        if 'deprecation' in content_html.lower():
            categories.append('Deprecation')
        elif 'bug' in content_html.lower() or 'fix' in content_html.lower():
            categories.append('Bug Fix')
        elif 'feature' in content_html.lower():
            categories.append('Feature')
        else:
            categories.append('Announcement')
            
    return categories

def fetch_and_parse_feed(force=False):
    current_time = time.time()
    
    # Check cache validity
    if not force and cache["data"] and (current_time - cache["last_fetched"] < CACHE_EXPIRY_SECONDS):
        return cache["data"]
        
    try:
        req = urllib.request.Request(FEED_URL, headers={'User-Agent': 'Mozilla/5.0 (Antigravity-Release-Notes-Reader)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry_elem in root.findall('atom:entry', ns):
            title_elem = entry_elem.find('atom:title', ns)
            id_elem = entry_elem.find('atom:id', ns)
            updated_elem = entry_elem.find('atom:updated', ns)
            content_elem = entry_elem.find('atom:content', ns)
            
            title = title_elem.text if title_elem is not None else "Unknown Date"
            entry_id = id_elem.text if id_elem is not None else ""
            updated = updated_elem.text if updated_elem is not None else ""
            content = content_elem.text if content_elem is not None else ""
            
            categories = parse_categories(content)
            
            entries.append({
                "id": entry_id,
                "title": title,
                "updated": updated,
                "content": content,
                "categories": categories
            })
            
        cache["data"] = entries
        cache["last_fetched"] = current_time
        return entries
        
    except Exception as e:
        print(f"Error fetching/parsing feed: {e}")
        # If fetch fails but we have cached data, return cached data
        if cache["data"]:
            return cache["data"]
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        force = request.args.get('force') == 'true'
        releases = fetch_and_parse_feed(force=force)
        return jsonify({
            "status": "success",
            "count": len(releases),
            "releases": releases
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
