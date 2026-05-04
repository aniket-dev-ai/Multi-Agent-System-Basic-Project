# 🔬 Agenta Research — Frontend

A **Next.js 16 frontend** for the multi-agent AI research system. Provides a real-time, data-driven interface that connects to the Flask backend, streams live pipeline progress via SSE, and renders the final research report in a rich tabbed dashboard.

---

## 📁 Project Structure

```
my-project/
├── app/
│   ├── layout.tsx              # Root layout — fonts, metadata, ThemeProvider
│   ├── page.tsx                # Home page — renders ResearchContainer
│   └── globals.css             # Design tokens, Tailwind theme, dark mode vars
│
├── components/
│   ├── research-container.tsx  # Main shell — wires hook to UI, handles all states
│   ├── search-section.tsx      # Hero search bar and heading
│   ├── loading-state.tsx       # Real-time pipeline progress UI (steps + skeletons)
│   ├── dashboard-results.tsx   # Tabbed results dashboard (4 tabs)
│   ├── theme-provider.tsx      # next-themes wrapper
│   ├── theme-toggle.tsx        # Light/dark/system toggle button
│   │
│   ├── views/
│   │   ├── report-view.tsx         # Markdown-rendered final report
│   │   ├── search-results-view.tsx # Raw search results (monospace)
│   │   ├── scraped-content-view.tsx# Scraped web content
│   │   └── feedback-view.tsx       # Critic agent feedback
│   │
│   └── ui/                     # Shadcn UI primitives
│       ├── badge.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── scroll-area.tsx
│       ├── separator.tsx
│       ├── skeleton.tsx
│       └── tabs.tsx
│
├── hooks/
│   └── use-research.ts         # Core state hook — SSE streaming, parsing, reset
│
├── lib/
│   └── utils.ts                # cn() utility (clsx + tailwind-merge)
│
├── .env.local                  # Environment variables
├── next.config.ts              # Next.js configuration
├── tsconfig.json               # TypeScript configuration
├── components.json             # Shadcn UI configuration
└── package.json                # Dependencies and scripts
```

---

## 🖥️ UI Architecture — Component Tree

```
RootLayout (layout.tsx)
└── ThemeProvider
    └── Home (page.tsx)
        └── ResearchContainer          ← controls all state via useResearch()
            ├── Header (logo + ThemeToggle)
            ├── [idle / loading state]
            │   ├── SearchSection      ← topic input + submit
            │   ├── ErrorBanner        ← shows on pipeline error
            │   └── LoadingState       ← live pipeline step tracker + skeletons
            └── [result state]
                ├── "New Research" button   ← calls reset() (no page reload)
                └── DashboardResults
                    └── Tabs (4 tabs)
                        ├── ReportView          ← Markdown-rendered report
                        ├── SearchResultsView   ← raw search output
                        ├── ScrapedContentView  ← scraped page content
                        └── FeedbackView        ← critic score + feedback
```

---

## 🔄 Data Flow — SSE Streaming

```
User submits topic
        │
        ▼
useResearch.startResearch(topic)
        │
        ├── fetch GET /api/research/stream?topic=...
        │
        ▼
   SSE Stream opens
        │
        ├── event: status → setStatus({ step, message })  → LoadingState updates
        ├── event: status → setStatus(...)
        ├── event: status → setStatus(...)
        ├── event: status → setStatus(...)
        │
        └── event: result → setResult(data)
                │
                ▼
          DashboardResults renders (4 tabs)
```

The SSE parser reads both `event:` lines (to determine type) and `data:` lines (to parse JSON), correctly routing `status` / `result` / `error` events.

---

## ⚙️ Configuration

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the Flask backend | `http://localhost:5000` |

> The `NEXT_PUBLIC_` prefix makes this variable available in the browser bundle.

---

## 🚀 Setup & Running

### Prerequisites
- Node.js 18+
- Backend API running on port 5000 (see `Backend Agent API/README.md`)

### 1. Install Dependencies

```bash
cd my-project
npm install
```

### 2. Configure Environment

`.env.local` is pre-configured for local development:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Server

```bash
npm run dev
```

Starts at **http://localhost:3000** with Turbopack hot-reload.

### 4. Production Build

```bash
npm run build
npm run start
```

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start dev server with Turbopack |
| `build` | `next build` | Build optimized production bundle |
| `start` | `next start` | Serve production build |
| `lint` | `eslint` | Run ESLint checks |

---

## 🎨 Design System

### Theme
- **Light/Dark mode** via `next-themes` with system preference detection
- **Resolved theme** used for toggle (correctly handles `system` mode)
- Design tokens defined in `globals.css` using CSS custom properties (`oklch` color space)

### Typography
| Font | Variable | Usage |
|------|----------|-------|
| **Figtree** | `--font-sans` | Body text, UI elements |
| **Lora** | `--font-heading` | Headings |
| **Geist Mono** | `--font-geist-mono` → `--font-mono` | Code blocks |

### Color Palette (OKLCH)
All colors are defined as CSS variables for both light and dark modes. Key tokens:

| Token | Light | Dark |
|-------|-------|------|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.148 0.004 228.8)` (deep navy) |
| `--primary` | `oklch(0.52 0.105 223)` (steel blue) | `oklch(0.45 0.085 224)` (muted blue) |
| `--foreground` | near-black | near-white |

### Key UI Patterns
- **Glassmorphism** — `backdrop-blur` on search input
- **Grid background** — subtle dot/line grid via CSS `linear-gradient`
- **Glow blob** — soft radial gradient behind the hero area
- **Skeleton loading** — animated placeholders while pipeline runs
- **Micro-animations** — `animate-in`, `fade-in`, `slide-in-from-bottom` on result reveal
- **Ping indicator** — animated dot on "Real-time Analysis Pipeline Active" badge

---

## 🪝 `useResearch` Hook

The core custom hook in `hooks/use-research.ts` manages all research state.

### State

| State | Type | Description |
|-------|------|-------------|
| `loading` | `boolean` | `true` while SSE stream is active |
| `result` | `ResearchResult \| null` | Final research result from the pipeline |
| `error` | `string \| null` | Error message if pipeline fails |
| `status` | `ResearchStatus` | Current pipeline step for the loading UI |

### Functions

| Function | Description |
|----------|-------------|
| `startResearch(topic)` | Opens SSE stream, processes events, updates state |
| `reset()` | Clears all state back to idle (no page reload) |

### Types

```typescript
type ResearchResult = {
  success: boolean;
  topic: string;
  search_results: string;   // Raw search output from Tavily
  scraped_content: string;  // Text extracted from scraped URL
  report: string;           // Full Markdown research report
  feedback: string;         // Critic score + structured evaluation
  timestamp: string;        // ISO 8601 timestamp
  error?: string;
};

type ResearchStatus = {
  step: string;    // 'idle' | 'initializing' | 'searching' | 'reading' | 'writing' | 'critic'
  message: string; // Human-readable status message
};
```

### SSE Parsing

The hook correctly implements the SSE protocol:
1. Reads `event:` lines to determine event type (`status` / `result` / `error`)
2. Reads `data:` lines to parse JSON payload
3. Routes to the correct state update per event type
4. Re-throws pipeline errors so they surface in the UI (not silently swallowed)

---

## 📊 Loading State — Pipeline Steps

The `LoadingState` component displays a real-time step tracker with 5 states:

| Step ID | Label | Visual State |
|---------|-------|-------------|
| `initializing` | Initializing | Spinning loader (current) |
| `searching` | Web Search | Spinning loader (current) / checkmark (done) |
| `reading` | Deep Reading | Spinning loader (current) / checkmark (done) |
| `writing` | Report Drafting | Spinning loader (current) / checkmark (done) |
| `critic` | Quality Review | Spinning loader (current) / checkmark (done) |

Completed steps show a **strikethrough** label and a green checkmark icon. The current step pulses.

---

## 📑 Result Dashboard — 4 Tabs

| Tab | Component | Content | Rendering |
|-----|-----------|---------|-----------|
| **Final Report** | `ReportView` | Full Markdown research report | `react-markdown` with GFM + custom styled components |
| **Search Logic** | `SearchResultsView` | Raw Tavily search output | Monospace `<pre>` block |
| **Scraped Data** | `ScrapedContentView` | Raw text from scraped URL | Prose-styled `<div>` |
| **Critic Feedback** | `FeedbackView` | Score + strengths + areas to improve + verdict | Whitespace-preserved `<div>` |

All tabs use `ScrollArea` with a `60–70vh` fixed height.

---

## 📦 Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 16.2.4 | React framework with App Router |
| `react` | 19.2.4 | UI library |
| `react-dom` | 19.2.4 | DOM rendering |
| `next-themes` | ^0.4.6 | Dark/light/system theme management |
| `react-markdown` | ^10.1.0 | Markdown rendering in ReportView |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown (tables, strikethrough, etc.) |
| `shadcn` | ^4.6.0 | Component library (Radix-based) |
| `radix-ui` | ^1.4.3 | Unstyled accessible UI primitives |
| `lucide-react` | ^1.14.0 | Icon library |
| `@hugeicons/react` | ^1.1.6 | Extended icon set |
| `clsx` | ^2.1.1 | Conditional className utility |
| `tailwind-merge` | ^3.5.0 | Merge conflicting Tailwind classes |
| `class-variance-authority` | ^0.7.1 | Component variant management |
| `tw-animate-css` | ^1.4.0 | CSS animation utilities |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5 | Type safety |
| `tailwindcss` | ^4 | Utility-first CSS |
| `@tailwindcss/postcss` | ^4 | Tailwind PostCSS integration |
| `eslint` | ^9 | Linting |
| `eslint-config-next` | 16.2.4 | Next.js ESLint rules |

---

## 🔗 Backend Connection

The frontend connects to the backend at `NEXT_PUBLIC_API_URL` (default `http://localhost:5000`).

| Backend Endpoint | Used By | Purpose |
|-----------------|---------|---------|
| `GET /api/research/stream?topic=...` | `useResearch.startResearch()` | Primary SSE stream |
| `POST /api/research` | — (not used in UI, available for direct calls) | Synchronous fallback |
| `GET /health` | — (not used in UI, available for monitoring) | Health check |

Make sure the backend is running before using the frontend. CORS is configured on the backend to allow requests from `http://localhost:3000`.
