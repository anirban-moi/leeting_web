import {
  applyFocusStyles,
  removeFocusStyles,
  handleShortsRedirect,
  hideYouTubeDistractionShelves,
} from '../src/content/focus.js';
import { getFocusModeEnabled, STORAGE_KEYS } from '../src/services/storage.js';

export default defineContentScript({
  matches: [
    '*://*.youtube.com/*',
    '*://*.instagram.com/*',
    '*://*.facebook.com/*',
    '*://*.fb.com/*',
    '*://*.linkedin.com/*',
  ],
  runAt: 'document_start',
  main() {
    let watcherInterval = null;
    let lastUrl = window.location.href;
    let isEnabled = false;

    function enforceFocus() {
      if (!isEnabled) return;
      if (handleShortsRedirect()) {
        return;
      }
      applyFocusStyles();
      if (window.location.hostname.includes('youtube.com')) {
        hideYouTubeDistractionShelves();
      }
    }

    function startWatcher() {
      if (watcherInterval) return;
      watcherInterval = setInterval(() => {
        if (!isEnabled) return;
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
        }
        enforceFocus();
      }, 800);
    }

    function stopWatcher() {
      if (watcherInterval) {
        clearInterval(watcherInterval);
        watcherInterval = null;
      }
    }

    async function evaluateFocusMode() {
      try {
        isEnabled = await getFocusModeEnabled();
        if (isEnabled) {
          enforceFocus();
          startWatcher();
        } else {
          stopWatcher();
          removeFocusStyles();
        }
      } catch (err) {
        console.warn('Leeting focus mode evaluation error:', err);
      }
    }

    // Initial check
    evaluateFocusMode();

    // Lightweight SPA navigation listeners
    window.addEventListener('popstate', enforceFocus);
    window.addEventListener('hashchange', enforceFocus);
    document.addEventListener('yt-navigate-finish', enforceFocus);
    document.addEventListener('DOMContentLoaded', enforceFocus);

    // Listen for storage updates
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'local' && changes[STORAGE_KEYS.FOCUS_MODE]) {
          evaluateFocusMode();
        }
      });
    }

    // Listen for direct messages from the popup
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message.type === 'FOCUS_MODE_CHANGED') {
          isEnabled = Boolean(message.enabled);
          if (isEnabled) {
            enforceFocus();
            startWatcher();
          } else {
            stopWatcher();
            removeFocusStyles();
          }
        }
      });
    }
  },
});
