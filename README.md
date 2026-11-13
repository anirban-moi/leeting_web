# Leeting Web Hub (Desktop Companion & Remote Controller)

**Leeting Web** (`leeting_web`) is the desktop web companion, remote controller, and monitoring hub for the [Leeting Browser Extension](../leeting).

Built with **Next.js (App Router)** and **Tailwind CSS**, it matches the LeetCode dark theme and provides a desktop interface to monitor your coding consistency, manage Pomodoro focus sessions, and control distraction blocking rules across all your browser instances.

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│               Leeting Architecture Hub                 │
└────────────────────────────────────────────────────────┘
          ▲                                ▲
          │ Uplink (Non-secret metrics)    │ Downlink (Remote rules)
          ▼                                ▼
┌──────────────────────┐         ┌──────────────────────┐
│  Leeting Extension   │         │     Leeting Web      │
│  (Manifest V3 Agent) │         │  (Desktop Companion) │
│                      │         │                      │
│ - Local Cookie Jar   │         │ - Dashboard Overview │
│ - Content Scripts    │         │ - Activity Heatmap   │
│ - DNR Block Rules    │         │ - Pomodoro Timer     │
│ - Alarms & Storage   │         │ - Device Registry    │
└──────────────────────┘         └──────────────────────┘
          │                                │
          └────────────────┬───────────────┘
                           │ Optional Cloud Sync
                           ▼
                 ┌───────────────────┐
                 │  Supabase Cloud   │
                 │  (Phase 2 Ready)  │
                 │                   │
                 │ - PostgreSQL RLS  │
                 │ - Auth (OAuth/PWD)│
                 │ - Activity Logs   │
                 └───────────────────┘
```

> [!IMPORTANT]
> **Authentication Isolation**: LeetCode credentials and session cookies (`LEETCODE_SESSION`, `csrftoken`) **never** leave the local browser extension cookie jar. Leeting Web only manages non-sensitive activity aggregates and remote blocking preferences.

---

## Feature Views (Phase 1 Implemented)

### 1. Overview Dashboard (`/`)
- Live connection indicator with username (`The-Boss`) and ranking.
- Metric cards for **Current Streak** (12 days), **LeetCoins** (1,894), and **Total Problems Solved** (482 / 3,370).
- **Daily Coding Challenge** interactive preview with direct LeetCode solve link.
- **Upcoming Contest** countdown card with 45-minute alert status.

### 2. Activity Hub (`/activity`)
- **35-Day Consistency Heatmap** color-coded from inactive to high-volume solving.
- **Difficulty Distribution** progress bars: Easy (62%), Medium (28%), Hard (10%).
- **Weekly Volume Bar Snapshot** tracking daily completions from Monday through Sunday.
- Habit metrics: Active days (5/7), peak solving day (Wednesday), weekly target (86%).

### 3. Focus & Shield Remote Controller (`/focus`)
- **Circular SVG Pomodoro Timer** with live interactive countdown (`25m`, `45m`, `60m`, `90m`) and start/pause/reset controls.
- **Solve Before Scroll Enforcer**: locks social media feeds until today's daily problem is solved.
- **Distraction Blocklist Toggles**:
  - YouTube Shorts
  - YouTube Playables
  - Instagram Web
  - Facebook Watch & Reels
  - LinkedIn Video Feed

### 4. Settings & Device Registry (`/settings`)
- **Connected Accounts**: LeetCode local session and Supabase Cloud Sync status.
- **Quiet Hours Scheduler**: Silences desktop and browser notifications between custom hours (e.g., `10:30 PM – 7:00 AM`).
- **Notification Preferences**: Daily challenge morning prompts, 45-minute contest alerts, and streak freeze risk warnings.
- **Registered Extension Instances**: Multi-browser registry (Edge, Chrome) with sync health and version details.

---

## Directory Structure

```text
leeting_web/
├── app/
│   ├── layout.jsx            # Root HTML layout with Sidebar and Header
│   ├── page.jsx              # Home Dashboard view
│   ├── activity/
│   │   └── page.jsx          # Activity & consistency overview
│   ├── focus/
│   │   └── page.jsx          # Focus timer & remote blocking controls
│   ├── settings/
│   │   └── page.jsx          # Settings, quiet hours & device management
│   └── globals.css           # Tailwind base styles and theme tokens
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx       # Persistent navigation sidebar
│   │   └── Header.jsx        # Top identity bar and connection pill
│   ├── cards/
│   │   ├── StatCard.jsx      # Reusable KPI metric card
│   │   ├── ChallengeCard.jsx # Daily challenge preview & action card
│   │   └── ContestCard.jsx   # Upcoming contest countdown card
│   └── focus/
│       ├── FocusTimer.jsx    # Circular countdown timer widget
│       └── RuleToggle.jsx    # Site blocking remote toggle switch
├── lib/
│   ├── mock-data.js          # Unified mock state (mirrors Phase 2 Supabase schema)
│   └── utils.js              # Formatting helpers (dates, countdowns, classes)
├── images/                   # Existing UI screenshot assets (PRESERVED)
├── leeting_product_architecture_pack/ # Architecture documentation (PRESERVED)
├── docs/                     # Detailed phase specifications
│   ├── LEETING_WEB_PLAN.md   # Master implementation plan
│   └── phases/               # Phase 1 to 5 specifications
├── package.json
├── tailwind.config.js
└── next.config.mjs
```

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- `pnpm` (recommended) or `npm`

### Installation & Run

```bash
# Navigate to the web companion directory
cd leeting_web

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Production Build

```bash
pnpm build
pnpm start
```

---

## Roadmap

- [x] **Phase 1: Frontend Web Controller Scaffold & UI Views** (Completed)
- [ ] **Phase 2: Backend Setup & Supabase Integration** (PostgreSQL schema, RLS, Auth)
- [ ] **Phase 3: Advanced Charts & Analytics** (Interactive trend charts & analytics)
- [ ] **Phase 4: Bidirectional Extension Sync** (Push/pull bridge between extension and web)
- [ ] **Phase 5: Production Deployment & CI/CD** (Automated Vercel deployment)
