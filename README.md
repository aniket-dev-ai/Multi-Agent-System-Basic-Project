# 🤖 Agenta — Multi-Agent AI Research System

A full-stack **multi-agent AI research platform** that autonomously searches the web, scrapes relevant pages, generates a structured research report, and critiques it — all streamed live to the browser in real time.

Built with **Python Flask + LangChain** on the backend and **Next.js 16 + React 19** on the frontend.

---

## 📸 How It Works

```
User enters a topic
        │
        ▼
  ┌─────────────┐     SSE Stream      ┌──────────────────────────┐
  │  Next.js    │ ◄───────────────── │    Flask API (port 5000)  │
  │  Frontend   │                    │                           │
  │  port 3000  │                    │  Step 1: Search Agent     │
  └─────────────┘                    │  Step 2: Reader Agent     │
        │                            │  Step 3: Writer Chain     │
        ▼                            │  Step 4: Critic Chain     │
  Live pipeline                      └──────────────────────────┘
  progress UI                                    │
        │                               Tavily + OpenAI APIs
        ▼
  Tabbed Results Dashboard
  (Report · Search · Scraped · Feedback)
```

---

## 📁 Repository Structure

```
Multi Agent System Basic Project/
├── Backend Agent API/          # Python Flask API + LangChain agents
│   ├── app.py                  # Flask server (REST + SSE endpoints)
│   ├── pipeline.py             # 4-step pipeline orchestrator
│   ├── agents.py               # Agent & chain builders
│   ├── tool.py                 # web_search + scrape_url tools
│   ├── run_pipeline_json.py    # CLI runner
│   ├── requirement.txt         # Python dependencies
│   ├── .env                    # API keys & config (not committed)
│   └── README.md               # Backend documentation
│
└── my-project/                 # Next.js 16 frontend
    ├── app/                    # Next.js App Router pages
    ├── components/             # React components + Shadcn UI
    ├── hooks/use-research.ts   # SSE streaming state hook
    ├── lib/utils.ts            # Utility functions
    ├── .env.local              # Frontend environment config
    └── README.md               # Frontend documentation
```

---

## 🧠 The 4-Agent Pipeline

Every research request flows through four sequential steps:

| Step | Agent | Tool | Output |
|------|-------|------|--------|
| 1 | **Search Agent** | Tavily Web Search | 5 search results (title, URL, snippet) |
| 2 | **Reader Agent** | URL Scraper | Full text from the most relevant page |
| 3 | **Writer Chain** | — (LLM only) | Structured Markdown research report |
| 4 | **Critic Chain** | — (LLM only) | Score + strengths + areas to improve |

---

## ⚡ Quick Start

### Prerequisites

- **Python 3.10+** (with `pip`)
- **Node.js 18+** (with `npm`)
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com)
- **Tavily API key** — [tavily.com](https://tavily.com)

---

### 1. Clone the Repository

```bash
git clone <repo-url>
cd "Multi Agent System Basic Project"
```

---

### 2. Set Up the Backend

```bash
cd "Backend Agent API"
pip install -r requirement.txt
```

Create a `.env` file:

```env
TAVILY_API_KEY=tvly-your-key-here
OPENAI_API_KEY=sk-proj-your-key-here
PORT=5000
CORS_ORIGIN=http://localhost:3000
```

Start the backend:

```bash
python app.py
```

✅ Backend runs at **http://localhost:5000**

---

### 3. Set Up the Frontend

```bash
cd "my-project"
npm install
```

`.env.local` is pre-configured:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

✅ Frontend runs at **http://localhost:3000**

---

### 4. Open the App

Navigate to **http://localhost:3000**, enter a research topic, and click **Research**.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/research` | Run pipeline, return full JSON result |
| `GET` | `/api/research/stream?topic=...` | Run pipeline, stream SSE events |

### SSE Event Types

| Event | When | Payload |
|-------|------|---------|
| `status` | Each pipeline step | `{ step, message }` |
| `result` | Pipeline complete | Full research result object |
| `error` | Pipeline failed | `{ error: "message" }` |

---

## 🏗️ Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **Python 3.10+** | Runtime |
| **Flask 3** | Web framework + SSE streaming |
| **Flask-CORS** | Cross-origin request handling |
| **LangChain** | Agent orchestration framework |
| **LangChain-OpenAI** | GPT model integration |
| **Tavily Python** | Web search API |
| **BeautifulSoup4 + lxml** | HTML parsing / web scraping |
| **Tenacity** | Retry logic with exponential backoff |
| **Waitress** | Production WSGI server (Windows-compatible) |
| **python-dotenv** | Environment variable loading |

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** (App Router) | React framework + Turbopack |
| **React 19** | UI library |
| **TypeScript 5** | Type safety |
| **Tailwind CSS 4** | Utility-first styling |
| **Shadcn UI** | Accessible component library (Radix-based) |
| **next-themes** | Dark / light / system theme |
| **react-markdown + remark-gfm** | Markdown rendering |
| **lucide-react** | Icon library |

---

## 🔑 Environment Variables

### Backend (`Backend Agent API/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `TAVILY_API_KEY` | ✅ | Tavily search API key |
| `OPENAI_API_KEY` | ✅ | OpenAI API key |
| `PORT` | ✅ | Server port (default: `5000`) |
| `CORS_ORIGIN` | ✅ | Frontend URL for CORS (default: `http://localhost:3000`) |

### Frontend (`my-project/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL (default: `http://localhost:5000`) |

---

## 🖥️ Production Deployment

### Backend (Windows)

```bash
waitress-serve --port=5000 app:app
```

> ❌ **Do not use `gunicorn`** — it depends on `fcntl`, a Unix-only module, and will crash on Windows.

### Backend (Linux / macOS)

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Frontend

```bash
npm run build
npm run start
```

---

## 🛠️ CLI Usage

Run the research pipeline directly from the terminal without the web server:

```bash
cd "Backend Agent API"
python run_pipeline_json.py "Artificial Intelligence in Healthcare"
```

**Output:** Full result as JSON on stdout  
**Errors:** JSON `{ "success": false, "error": "..." }` on stderr  
**Exit codes:** `0` success · `1` failure

---

## ⚠️ Important Notes

| Issue | Detail |
|-------|--------|
| **Port conflict** | Backend runs on `5000`, frontend on `3000`. Never run both on the same port. |
| **Windows + gunicorn** | Gunicorn is Linux-only. Use `waitress` or `python app.py` on Windows. |
| **API keys** | Never commit `.env` or `.env.local`. Both are in `.gitignore`. |
| **Pipeline duration** | Each full research run takes **45–90 seconds** depending on topic and API latency. |

---

## 📚 Detailed Documentation

- [**Backend README**](./Backend%20Agent%20API/README.md) — API endpoints, agent details, tools, logging, pipeline internals
- [**Frontend README**](./my-project/README.md) — Component tree, SSE hook, design system, data flow, all dependencies
