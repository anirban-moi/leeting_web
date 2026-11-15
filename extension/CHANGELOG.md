# Changelog

All notable changes to **Leeting - LeetCode & Focus Companion** are documented here.

---

## [1.0.9] — 2026-11-12

### Added
- **Solve Before Scroll Mode**: Automatically locks Focus Mode ON when signed in and today's LeetCode Daily Challenge is still unsolved, unlocking automatically as soon as you solve it.
- **LinkedIn Shorts / Video Blocking**: Blocks `linkedin.com/video` navigation via declarative redirect to `blocked.html` and hides `/video` nav items, feed carousels, and video feed posts when Focus Mode is ON.
- **Safe Extension Upgrade Handling**: Extracted background lifecycle handlers into `src/background/lifecycle.js` with `handleInstalled`, ensuring upgrades from `v1.0.8` preserve all stored preferences, cached challenge/profile data, daily coin check-in dates, contest alert history, and Focus Mode rules.
- **Firefox MV3 Support**: Added `browser_specific_settings.gecko` configuration (`strict_min_version: "113.0"`), `--mv3` build/zip scripts, and Promise-based `browser.storage.local` compatibility in `src/services/storage.js`.
- **Automated Auth, Background & Upgrade Test Suites**: Added `tests/auth.test.js` and `tests/lifecycle.test.js`, plus expanded unit coverage for LinkedIn Focus Mode, `worker.js`, `network.js`, `storage.js`, `App.jsx`, and `manifest`.
- **Documentation & Release Materials**: Added `README.md` with architecture diagram & screenshots, `PRIVACY.md`, and Chrome/Edge/Firefox installation guides.

### Changed
- Aligned manifest, `package.json`, and popup UI version badges cleanly at **`1.0.9`**.
- Updated `public/blocked.html` copy to mention Instagram, Facebook, LinkedIn Video, and YouTube Shorts & Games.

---

## [1.0.8] — 2026-11-11

### Added
- Custom dark-mode `public/blocked.html` Focus Mode block page exposed via `web_accessible_resources` across `<all_urls>`.
- Declarative Net Request (`declarativeNetRequest`) blocking for Instagram, Facebook (`facebook.com`, `fb.com`), and YouTube Playables (`/playables`), plus DOM shelf hiding for dynamic YouTube Playables renderers.
- Signed-out 1-click **Log In to LeetCode** button & session-cookie pending status indicator.
- Direct **Claim** shortcut to `https://leetcode.com/store/` for daily LeetCoins.

### Changed
- Removed `executeScript` tab injection on `leetcode.com`, removed heavy `MutationObserver` loops, and added a 2-second debounce on filtered `cookies.onChanged` events for fast browsing performance.
- Simplified dashboard streak card to show **Current Streak** cleanly with `userStatus`, `userProfile`, and `streakCounter` sync.
