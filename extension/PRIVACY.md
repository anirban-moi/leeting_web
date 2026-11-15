# Privacy & Permissions Policy — Leeting

**Effective Version:** 1.0.9  
**Data Controller:** None — Leeting operates 100% locally inside your browser and connects directly only to official LeetCode endpoints (`https://leetcode.com/graphql`).

---

## 1. Zero Third-Party Tracking or Telemetry

Leeting **does not** collect, store remotely, sell, or transmit your personal information, browsing history, coding submissions, or session cookies to any external analytics service, telemetry endpoint, or third-party backend.

All extension preferences and cached dashboard snapshots remain strictly inside your browser's local extension storage (`chrome.storage.local` / `browser.storage.local`).

---

## 2. Permissions Breakdown

Every permission declared in the Manifest V3 configuration serves a single, user-visible feature:

| Permission | Purpose & Usage |
| :--- | :--- |
| **`storage`** | Persists Focus Mode state, **Solve Before Scroll** state & auto-lock flag, daily LeetCoin check-in date, notified contest slugs, and cached LeetCode challenge/profile data locally (`leeting_*` keys). |
| **`alarms`** | Schedules lightweight background sync checks: Daily Challenge status every **30 minutes** and LeetCode Contest schedule every **60 minutes**. |
| **`notifications`** | Displays local desktop reminders when an upcoming LeetCode contest begins within **45 minutes**. |
| **`cookies`** | Reads `LEETCODE_SESSION` and `csrftoken` cookies for `*.leetcode.com` so the extension can sync your LeetCode streak, coin balance, and daily solve status using your existing signed-in browser session. Cookies are **never** sent anywhere outside `leetcode.com`. |
| **`declarativeNetRequest`** & **`declarativeNetRequestWithHostAccess`** | Used in two places only:<br>1. Attaches `Origin`, `Referer`, `Cookie`, and `x-csrftoken` headers exclusively to extension-initiated `https://leetcode.com/graphql` requests (never modifying normal LeetCode tab browsing).<br>2. Redirects distracting URLs (`instagram.com`, `facebook.com`, `fb.com`, `youtube.com/playables`, `linkedin.com/video`) to the local `blocked.html` page **only when Focus Mode is ON**. |

---

## 3. Host Permissions Breakdown

| Host Pattern | Why Access Is Requested |
| :--- | :--- |
| `*://*.leetcode.com/*` | Required to authenticate GraphQL requests with your session cookies (`globalData`, `getUserProfile`, `getStreakCounter`, `questionOfToday`, upcoming contests). **No content script is injected into `leetcode.com`** so LeetCode pages remain completely untouched and fast. |
| `*://*.youtube.com/*` | Redirects `/shorts/<id>` to standard `/watch?v=<id>`, blocks `/playables`, and hides Shorts & Playables shelves/sidebar links when **Focus Mode** is ON. |
| `*://*.instagram.com/*` | Blocks distracting Instagram access when **Focus Mode** is ON by redirecting to local `blocked.html`. |
| `*://*.facebook.com/*`, `*://*.fb.com/*` | Blocks distracting Facebook access when **Focus Mode** is ON by redirecting to local `blocked.html`. |
| `*://*.linkedin.com/*` | Redirects `linkedin.com/video` to local `blocked.html` and hides LinkedIn Video navigation links, feed carousels, and short-form video posts when **Focus Mode** is ON. |
| `http://localhost/*`, `http://127.0.0.1/*` | Enables bi-directional remote control with the local **Leeting Web** companion dashboard via `window.postMessage`. No data is ever sent externally. |

---

## 4. Data Stored Locally

Leeting stores only the following keys in `storage.local`:

- `leeting_focus_mode_enabled` — Whether Focus Mode is active (`true`/`false`).
- `leeting_solve_before_scroll_enabled` — Whether daily auto-lock mode is enabled (`true`/`false`).
- `leeting_auto_focus_locked` — Tracks whether Focus Mode was auto-locked for today's unsolved challenge.
- `leeting_active_timer` — Active Pomodoro focus countdown state (`isActive`, `durationMinutes`, `startedAt`, `endTime`).
- `leeting_cached_daily` — Cached Daily Challenge title, difficulty, topic tags, link, and completion status.
- `leeting_cached_user` — Cached LeetCode username, avatar URL, point balance, and streak counter.
- `leeting_cached_contests` — Cached upcoming contest schedules.
- `leeting_last_coin_claim` — Date string (`YYYY-MM-DD`) of your last LeetCode Store check-in click.
- `leeting_notified_contests` — Map of contest slugs already notified so you are never alerted twice for the same contest.
- `leeting_expanded_sections` — User preference map for collapsible dropdown sections (`user`, `daily`, `contest`, `sbs`, `focus`, `coins`).
- `leeting_last_startup_notif_date` — Date string (`YYYY-MM-DD`) of browser startup notification check to prevent duplicate daily alerts.
- `leeting_extension_meta` — Non-destructive local version upgrade metadata.

Clearing extension data or uninstalling Leeting immediately removes all locally stored data.
