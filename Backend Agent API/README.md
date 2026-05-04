# 🤖 Research Agent API — Backend

A **multi-agent AI research backend** built with Flask and LangChain. Given a topic, it autonomously searches the web, scrapes relevant pages, writes a structured research report, and critiques it — all streamed in real time to the frontend via **Server-Sent Events (SSE)**.

---

## 📁 Project Structure

```
Backend Agent API/
├── app.py                  # Flask API server (REST + SSE endpoints)
├── pipeline.py             # Pipeline orchestrator (runs all 4 agent steps)
├── agents.py               # Agent & chain builders (Search, Reader, Writer, Critic)
├── tool.py                 # LangChain tools (web_search, scrape_url)
├── run_pipeline_json.py    # CLI runner — outputs JSON to stdout
├── requirement.txt         # Python dependencies
├── .env                    # Environment variables (API keys, port)
├── .gitignore              # Git ignore rules
└── log.txt                 # Auto-generated structured pipeline logs
```

---

## 🧠 How It Works — The 4-Agent Pipeline

Each research request flows through **4 sequential agent steps**:

```
Topic Input
    │
    ▼
┌──────────────┐
│  Search Agent │  Uses Tavily to find 5 top results (title, URL, snippet)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Reader Agent │  Picks the best URL and scrapes its full text content
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Writer Chain │  Synthesizes search + scraped data into a structured report
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Critic Chain │  Reviews the report and gives a score + structured feedback
└──────────────┘
       │
       ▼
  Final Result (search_results, scraped_content, report, feedback)
```

### Agent Details

| Agent | Type | Tools | Purpose |
|-------|------|-------|---------|
| **Search Agent** | LangChain Agent | `web_search` | Searches Tavily for recent, reliable information |
| **Reader Agent** | LangChain Agent | `scrape_url` | Scrapes the most relevant URL for deep content |
| **Writer Chain** | LCEL Chain | — | Drafts a structured Markdown report |
| **Critic Chain** | LCEL Chain | — | Evaluates the report with a score and feedback |

---

## 🔧 Configuration

### Environment Variables (`.env`)

```env
TAVILY_API_KEY=your_tavily_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

| Variable | Description |
|----------|-------------|
| `TAVILY_API_KEY` | API key from [tavily.com](https://tavily.com) for web search |
| `OPENAI_API_KEY` | OpenAI API key for GPT model access |
| `PORT` | Port the Flask server listens on (default: `5000`) |
| `CORS_ORIGIN` | Allowed frontend origin for CORS (default: `http://localhost:3000`) |

> ⚠️ Never commit `.env` to git. It is listed in `.gitignore`.

---

## 🚀 Setup & Running

### 1. Install Dependencies

```bash
pip install -r requirement.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the `Backend Agent API/` directory:

```env
TAVILY_API_KEY=tvly-...
OPENAI_API_KEY=sk-proj-...
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

### 3. Run the Server

**Development:**
```bash
python app.py
```

**Production (Windows-compatible):**
```bash
waitress-serve --port=5000 app:app
```

> ❌ Do **not** use `gunicorn` on Windows — it uses `fcntl`, a Unix-only module, and will crash immediately.

The server starts on `http://localhost:5000`.

---

## 🌐 API Endpoints

### `GET /health`

Health check — confirms the server is running.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-05-05T01:00:00.000000",
  "engine": "Flask"
}
```

---

### `POST /api/research`

Runs the full pipeline synchronously and returns the complete result as JSON.

**Request:**
```json
{
  "topic": "Advancements in Quantum Computing 2025"
}
```

**Response:**
```json
{
  "success": true,
  "topic": "Advancements in Quantum Computing 2025",
  "search_results": "Title: ...\nURL: ...\nSnippet: ...",
  "scraped_content": "Full extracted text from the scraped page...",
  "report": "# Research Report\n\n## Introduction\n...",
  "feedback": "Score: 8/10\n\nStrengths:\n- ...",
  "timestamp": "2026-05-05T01:00:00.000000"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Topic must be under 500 characters"
}
```

---

### `GET /api/research/stream?topic=<topic>`

Runs the pipeline and streams real-time progress updates via **Server-Sent Events (SSE)**.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `topic` | string | ✅ | The research topic (2–500 characters) |

**SSE Event Stream:**

The response is a stream of events in SSE format:

```
event: status
data: {"step": "initializing", "message": "Starting research agents..."}

event: status
data: {"step": "searching", "message": "Search agent is looking for information..."}

event: status
data: {"step": "reading", "message": "Reader agent is analyzing search results..."}

event: status
data: {"step": "writing", "message": "Writer agent is drafting the report..."}

event: status
data: {"step": "critic", "message": "Critic agent is reviewing the report..."}

event: result
data: {"success": true, "topic": "...", "search_results": "...", "scraped_content": "...", "report": "...", "feedback": "...", "timestamp": "..."}
```

**Event Types:**

| Event | When | Data |
|-------|------|------|
| `status` | Each pipeline step starts | `{ step, message }` |
| `result` | Pipeline completes successfully | Full research result object |
| `error` | Pipeline fails or times out | `{ error: "message" }` |

**Pipeline Step IDs:**

| Step ID | Label | Description |
|---------|-------|-------------|
| `initializing` | Starting | Agent system booting up |
| `searching` | Web Search | Search agent querying Tavily |
| `reading` | Deep Reading | Reader agent scraping a URL |
| `writing` | Report Drafting | Writer chain generating the report |
| `critic` | Quality Review | Critic chain evaluating the report |

---

## 📋 Topic Validation Rules

All endpoints apply the same validation:

| Rule | Details |
|------|---------|
| Must be a string | Non-string types are rejected |
| Cannot be empty | Whitespace-only topics are rejected |
| Minimum length | At least **2 characters** after trimming |
| Maximum length | At most **500 characters** after trimming |

---

## 🛠️ Tools

### `web_search(query: str) → str`

Searches the web using the **Tavily API**. Returns up to 5 results, each with:
- `Title`
- `URL`
- `Snippet` (first 300 characters of content)

Results are separated by `----`.

### `scrape_url(url: str) → str`

Scrapes and extracts clean text from a given URL.

- **Timeout:** 15 seconds
- **Size limit:** 2 MB (rejects oversized responses)
- **Parser:** `lxml` with `html.parser` fallback
- **Removes:** `<script>`, `<style>`, `<nav>`, `<footer>`, `<header>`, `<aside>`, `<form>` tags
- **Returns:** First 5,000 characters of normalized visible text

---

## 🤖 LLM Configuration

**Model:** `gpt-4.1-mini-2025-04-14`  
**Temperature:** `0.2` (low — for factual, consistent output)  
**Max Retries:** `2`

The model is initialized at startup with a fallback in case of initialization failure. All agent invocations additionally use **tenacity retry** with exponential backoff (2 attempts, 2–10s wait).

### Writer Prompt Structure

The writer generates a Markdown report structured as:
1. **Introduction**
2. **Key Findings** (minimum 5 well-explained points)
3. **Conclusion**
4. **Sources** (all URLs found in the research)

### Critic Prompt Structure

The critic outputs strictly formatted feedback:
```
Score: X/10

Strengths:
- ...

Areas to Improve:
- ...

One line verdict:
...
```

---

## 📝 Logging

The pipeline writes structured JSON log entries to `log.txt` after each step:

```json
{"timestamp": "2026-05-05T01:00:00.000000", "step": "step_1", "message": "Search completed successfully"}
{"timestamp": "2026-05-05T01:00:30.000000", "step": "step_2", "message": "Content scraping completed"}
{"timestamp": "2026-05-05T01:01:00.000000", "step": "step_3", "message": "Report generation completed"}
{"timestamp": "2026-05-05T01:01:15.000000", "step": "step_4", "message": "Critique completed"}
```

`log.txt` is excluded from git via `.gitignore`.

---

## 🖥️ CLI Usage

Run the pipeline directly from the command line and get JSON output:

```bash
python run_pipeline_json.py "Artificial Intelligence in Healthcare"
```

**Stdout:** Full result as JSON  
**Stderr:** Errors as JSON `{ "success": false, "error": "..." }`  
**Exit code:** `0` on success, `1` on failure

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `flask` | ≥3.0.0 | Web framework / API server |
| `flask-cors` | ≥4.0.0 | Cross-Origin Resource Sharing |
| `langchain` | ≥0.2.0 | Agent orchestration framework |
| `langchain-core` | ≥0.2.0 | Core LangChain primitives |
| `langchain-openai` | ≥0.1.0 | OpenAI model integration |
| `tavily-python` | ≥0.3.0 | Tavily web search API client |
| `beautifulsoup4` | ≥4.12.0 | HTML parsing for scraper |
| `requests` | ≥2.31.0 | HTTP client for scraping |
| `lxml` | ≥5.0.0 | Fast HTML/XML parser (BS4 backend) |
| `python-dotenv` | ≥1.0.0 | `.env` file loading |
| `tenacity` | ≥8.2.0 | Retry logic with exponential backoff |
| `waitress` | ≥3.0.0 | Production WSGI server (Windows-compatible) |

---

## ⚠️ Known Limitations

- **Windows only:** Use `waitress` for production. `gunicorn` is Linux/macOS only.
- **No cancellation:** If the frontend disconnects, the pipeline thread sends a cancel signal via `threading.Event` but the LLM calls themselves cannot be interrupted mid-flight.
- **Sequential pipeline:** All 4 steps run sequentially. Total time is typically 45–90 seconds depending on topic complexity and API response times.
- **Single concurrent request:** No request queue — multiple simultaneous research requests each spawn their own thread.
