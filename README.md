# Google Cloud BigQuery Release Notes Explorer

A beautifully designed, premium web application built with **Python Flask** and **Vanilla HTML/CSS/JavaScript** that aggregates, parses, and visualizes the Google Cloud BigQuery release notes feed in real-time.

## Features

- **Real-Time RSS Feed Aggregation:** Fetches and parses the live BigQuery Atom release notes XML feed dynamically.
- **Smart Parsing & Classification:** Extracts and tags release notes automatically into categories: **Features**, **Bug Fixes**, **Deprecations**, and **Announcements**.
- **Interactive Stats Dashboard:** Provides a quick bird's-eye view count of updates by category.
- **Instant Search & Filters:** Filter notes instantly by keyword or category, with quick-badge controls and clickable dashboard cards.
- **X (Twitter) Integration:** Instantly share individual updates. It automatically strips HTML tags, formats the title, and truncates descriptions to fit within character limits.
- **Sort Capability:** View notes in chronological or reverse-chronological order.
- **Responsive Premium Theme:** Styled with modern HSL CSS variables, custom scrollbars, micro-animations, glassmorphic layout, and full support for both **Dark Mode** and **Light Mode**.
- **Cache Optimization:** Features a 5-minute caching mechanism to optimize feed retrieval and prevent rate-limiting, with a force-refresh capability built into the client-side refresh button.

## Getting Started

### Prerequisites

- Python 3.8+
- `pip` package manager

### Installation

1. Clone or open the project folder:
   ```bash
   cd C:\Users\Lenovo\agy-cli-projects
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the App

Start the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

## Project Structure

```
agy-cli-projects/
├── app.py                   # Flask server containing feed fetcher & XML parsing logic
├── requirements.txt         # Python package dependencies
├── .gitignore               # Excluded development and configuration files
├── templates/
│   └── index.html           # Main HTML structure & layout
└── static/
    ├── css/
    │   └── style.css        # Theme stylesheet (Dark/Light tokens, animations, widgets)
    └── js/
        └── main.js          # Core frontend logic (Theme toggle, real-time filters, stats, X sharing)
```

## Customization

You can adjust the feed URL or the cache expiry duration at the top of `app.py`:
```python
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
CACHE_EXPIRY_SECONDS = 300  # 5 minutes
```
