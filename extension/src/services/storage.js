/**
 * Cross-browser storage abstraction with in-memory fallback for testing
 */

const memoryStorage = new Map();

function getStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return { api: chrome.storage.local, type: 'chrome' };
  }
  if (typeof browser !== 'undefined' && browser.storage && browser.storage.local) {
    return { api: browser.storage.local, type: 'browser' };
  }
  return null;
}

export async function storageGet(key, defaultValue = null) {
  const extStorage = getStorage();
  if (extStorage) {
    if (extStorage.type === 'browser') {
      try {
        const result = await extStorage.api.get([key]);
        return result && result[key] !== undefined ? result[key] : defaultValue;
      } catch (err) {
        console.warn('Storage get error:', err);
        return defaultValue;
      }
    }

    return new Promise((resolve) => {
      extStorage.api.get([key], (result) => {
        const lastError = typeof chrome !== 'undefined' ? chrome.runtime?.lastError : null;
        if (lastError) {
          console.warn('Storage get error:', lastError);
          resolve(defaultValue);
        } else {
          resolve(result && result[key] !== undefined ? result[key] : defaultValue);
        }
      });
    });
  }

  // Memory fallback for tests
  return memoryStorage.has(key) ? memoryStorage.get(key) : defaultValue;
}

export async function storageSet(key, value) {
  const extStorage = getStorage();
  if (extStorage) {
    if (extStorage.type === 'browser') {
      try {
        await extStorage.api.set({ [key]: value });
        return true;
      } catch (err) {
        console.warn('Storage set error:', err);
        return false;
      }
    }

    return new Promise((resolve) => {
      extStorage.api.set({ [key]: value }, () => {
        const lastError = typeof chrome !== 'undefined' ? chrome.runtime?.lastError : null;
        resolve(!lastError);
      });
    });
  }

  // Memory fallback for tests
  memoryStorage.set(key, value);
  return true;
}

export const STORAGE_KEYS = {
  FOCUS_MODE: 'leeting_focus_mode_enabled',
  SOLVE_BEFORE_SCROLL: 'leeting_solve_before_scroll_enabled',
  AUTO_FOCUS_LOCKED: 'leeting_auto_focus_locked',
  ACTIVE_TIMER: 'leeting_active_timer',
  CACHED_DAILY: 'leeting_cached_daily',
  CACHED_USER: 'leeting_cached_user',
  CACHED_CONTESTS: 'leeting_cached_contests',
  LAST_COIN_CLAIM: 'leeting_last_coin_claim',
  NOTIFIED_CONTESTS: 'leeting_notified_contests',
  EXTENSION_META: 'leeting_extension_meta',
  LAST_STARTUP_NOTIF_DATE: 'leeting_last_startup_notif_date',
  EXPANDED_SECTIONS: 'leeting_expanded_sections',
};

export async function getActiveTimer() {
  return storageGet(STORAGE_KEYS.ACTIVE_TIMER, null);
}

export async function setActiveTimer(timerData) {
  return storageSet(STORAGE_KEYS.ACTIVE_TIMER, timerData);
}

export async function getFocusModeEnabled() {
  return storageGet(STORAGE_KEYS.FOCUS_MODE, false);
}

export async function setFocusModeEnabled(enabled) {
  return storageSet(STORAGE_KEYS.FOCUS_MODE, Boolean(enabled));
}

export async function getSolveBeforeScrollEnabled() {
  return storageGet(STORAGE_KEYS.SOLVE_BEFORE_SCROLL, false);
}

export async function setSolveBeforeScrollEnabled(enabled) {
  return storageSet(STORAGE_KEYS.SOLVE_BEFORE_SCROLL, Boolean(enabled));
}

export async function getAutoFocusLocked() {
  return storageGet(STORAGE_KEYS.AUTO_FOCUS_LOCKED, false);
}

export async function setAutoFocusLocked(locked) {
  return storageSet(STORAGE_KEYS.AUTO_FOCUS_LOCKED, Boolean(locked));
}

export async function getLastCoinClaimDate() {
  return storageGet(STORAGE_KEYS.LAST_COIN_CLAIM, null);
}

export async function setLastCoinClaimDate(dateString) {
  return storageSet(STORAGE_KEYS.LAST_COIN_CLAIM, dateString);
}

export const DEFAULT_EXPANDED_SECTIONS = {
  user: true,
  daily: true,
  contest: true,
  sbs: true,
  focus: true,
  coins: true,
};

export async function getExpandedSections() {
  const saved = await storageGet(STORAGE_KEYS.EXPANDED_SECTIONS, null);
  if (!saved || typeof saved !== 'object') {
    return { ...DEFAULT_EXPANDED_SECTIONS };
  }
  return { ...DEFAULT_EXPANDED_SECTIONS, ...saved };
}

export async function setExpandedSections(sections) {
  return storageSet(STORAGE_KEYS.EXPANDED_SECTIONS, sections);
}
