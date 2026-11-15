'use client';

const CACHE_KEY = 'leeting_user_cache';
const LOGGED_IN_ONCE_KEY = 'leeting_has_logged_in_once';

/**
 * Checks if the user has signed in at least once on this browser.
 * @returns {boolean}
 */
export function hasUserLoggedInOnce() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LOGGED_IN_ONCE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Retrieves the cached user profile and stats from localStorage.
 * @returns {object|null}
 */
export function getCachedUserData() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Caches the user profile, username, and stats for future visits.
 * @param {object} data
 */
export function saveUserCache(data) {
  if (typeof window === 'undefined' || !data) return;
  try {
    const existing = getCachedUserData() || {};
    const updated = {
      ...existing,
      ...data,
      lastCachedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
    localStorage.setItem(LOGGED_IN_ONCE_KEY, 'true');
  } catch (e) {
    console.warn('Failed to save user cache to localStorage:', e);
  }
}

/**
 * Clears the cached user profile and marks logged in once as false.
 */
export function clearUserCache() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(LOGGED_IN_ONCE_KEY);
  } catch (e) {
    console.warn('Failed to clear user cache from localStorage:', e);
  }
}
