import { defineContentScript } from 'wxt/sandbox';

export default defineContentScript({
  matches: [
    'http://localhost/*',
    'http://127.0.0.1/*',
    'https://*.leeting.dev/*',
    'https://*.vercel.app/*',
  ],
  runAt: 'document_start',
  main() {
    console.log('[Leeting Extension Bridge] Content script initialized on web companion.');

    // Helper to detect current browser
    const getBrowserName = () => {
      const ua = navigator.userAgent;
      if (/Edg/.test(ua)) return 'Edge';
      if (/Firefox/.test(ua)) return 'Firefox';
      if (/Chrome/.test(ua)) return 'Chrome';
      return 'Browser';
    };

    const browser = getBrowserName();
    const version = '1.0.9';

    // Tag documentElement cleanly without interfering with React SSR hydration
    const tagDocument = () => {
      try {
        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.dataset.leetingExtension = version;
          document.documentElement.dataset.leetingBrowser = browser;
        }
      } catch {}
    };

    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tagDocument, { once: true });
      } else {
        setTimeout(tagDocument, 0);
      }
    }

    // Dual-transport broadcast to page via window.postMessage AND document.dispatchEvent
    const broadcastToPage = (msg) => {
      try {
        window.postMessage(msg, '*');
      } catch {}
      try {
        if (typeof document !== 'undefined') {
          document.dispatchEvent(new CustomEvent('LEETING_BRIDGE_MESSAGE', { detail: msg }));
        }
      } catch {}
    };

    // Announce extension presence to the web dashboard
    const announcePresence = () => {
      broadcastToPage({
        source: 'LEETING_EXTENSION_BRIDGE',
        type: 'ANNOUNCE_PRESENCE',
        version,
        browser,
        timestamp: Date.now(),
      });
    };

    // Announce immediately and periodically
    announcePresence();
    const intervalId = setInterval(announcePresence, 2000);

    // Immediately broadcast current storage snapshot to web app
    const broadcastStorageSnapshot = () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.local?.get) {
        chrome.storage.local.get(null, (items) => {
          if (!items) return;
          const payload = {};
          if (items.leeting_focus_mode_enabled !== undefined) {
            payload.focusMode = Boolean(items.leeting_focus_mode_enabled);
          }
          if (items.leeting_solve_before_scroll_enabled !== undefined) {
            payload.solveBeforeScroll = Boolean(items.leeting_solve_before_scroll_enabled);
          }
          if (items.leeting_auto_focus_locked !== undefined) {
            payload.autoLocked = Boolean(items.leeting_auto_focus_locked);
          }
          if (items.leeting_cached_daily !== undefined) {
            payload.daily = items.leeting_cached_daily;
          }
          if (items.leeting_cached_contests !== undefined) {
            payload.contests = items.leeting_cached_contests;
          }
          if (items.leeting_cached_user !== undefined) {
            payload.user = items.leeting_cached_user;
          }
          if (items.leeting_active_timer !== undefined) {
            payload.activeTimer = items.leeting_active_timer;
          }
          if (Object.keys(payload).length > 0) {
            broadcastToPage({
              source: 'LEETING_EXTENSION_BRIDGE',
              type: 'STATE_CHANGED',
              payload,
            });
          }
        });
      }
    };

    broadcastStorageSnapshot();

    // Broadcast storage updates in real-time to the web dashboard
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== 'local') return;
        const payload = {};
        if (changes.leeting_focus_mode_enabled !== undefined) {
          payload.focusMode = Boolean(changes.leeting_focus_mode_enabled.newValue);
        }
        if (changes.leeting_solve_before_scroll_enabled !== undefined) {
          payload.solveBeforeScroll = Boolean(changes.leeting_solve_before_scroll_enabled.newValue);
        }
        if (changes.leeting_cached_daily !== undefined) {
          payload.daily = changes.leeting_cached_daily.newValue;
        }
        if (changes.leeting_cached_contests !== undefined) {
          payload.contests = changes.leeting_cached_contests.newValue;
        }
        if (changes.leeting_cached_user !== undefined) {
          payload.user = changes.leeting_cached_user.newValue;
        }
        if (changes.leeting_active_timer !== undefined) {
          payload.activeTimer = changes.leeting_active_timer.newValue;
        }

        if (Object.keys(payload).length > 0) {
          broadcastToPage({
            source: 'LEETING_EXTENSION_BRIDGE',
            type: 'STATE_CHANGED',
            payload,
          });
        }
      });
    }

    // Listen to direct broadcast messages from the extension popup or background worker
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (message?.type === 'LEETING_STATE_UPDATE' && message.payload) {
          broadcastToPage({
            source: 'LEETING_EXTENSION_BRIDGE',
            type: 'STATE_CHANGED',
            payload: message.payload,
          });
        } else if (message?.type === 'FOCUS_MODE_CHANGED') {
          broadcastToPage({
            source: 'LEETING_EXTENSION_BRIDGE',
            type: 'STATE_CHANGED',
            payload: { focusMode: Boolean(message.enabled) },
          });
        } else if (message?.type === 'TIMER_STATE_CHANGED') {
          broadcastToPage({
            source: 'LEETING_EXTENSION_BRIDGE',
            type: 'STATE_CHANGED',
            payload: { activeTimer: message.timer },
          });
        }
      });
    }

    // Relay commands from Web App -> Extension Background Service Worker
    const handledRequestIds = new Set();

    const handleCommand = async (cmdData) => {
      if (!cmdData || cmdData.source !== 'LEETING_WEB_APP') {
        return;
      }

      const { type, payload, requestId } = cmdData;

      if (type === 'PING_PRESENCE') {
        announcePresence();
        broadcastStorageSnapshot();
        return;
      }

      if (requestId) {
        if (handledRequestIds.has(requestId)) return;
        handledRequestIds.add(requestId);
        if (handledRequestIds.size > 200) {
          const first = handledRequestIds.values().next().value;
          handledRequestIds.delete(first);
        }
      }

      if (typeof chrome === 'undefined' || !chrome.runtime?.id) {
        broadcastToPage({
          source: 'LEETING_EXTENSION_BRIDGE',
          type: `${type}_REPLY`,
          requestId,
          success: false,
          error: 'Extension context invalidated. Please reload the extension and refresh this tab.',
        });
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({
          source: 'LEETING_WEB_BRIDGE',
          type,
          payload,
        });

        broadcastToPage({
          source: 'LEETING_EXTENSION_BRIDGE',
          type: `${type}_REPLY`,
          requestId,
          success: true,
          data: response,
        });

        // Trigger snapshot update after modifying state
        if (type === 'SET_FOCUS_MODE' || type === 'SET_SOLVE_BEFORE_SCROLL' || type === 'START_FOCUS_TIMER' || type === 'STOP_FOCUS_TIMER') {
          setTimeout(broadcastStorageSnapshot, 50);
        }
      } catch (err) {
        broadcastToPage({
          source: 'LEETING_EXTENSION_BRIDGE',
          type: `${type}_REPLY`,
          requestId,
          success: false,
          error: err?.message || 'Extension background unreachable',
        });
      }
    };

    window.addEventListener('message', (event) => handleCommand(event.data));
    if (typeof document !== 'undefined') {
      document.addEventListener('LEETING_PAGE_COMMAND', (event) => handleCommand(event.detail));
    }

    window.addEventListener('beforeunload', () => {
      clearInterval(intervalId);
    });
  },
});
