'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { registerDevice } from './device-service.js';

export const ExtensionBridgeContext = createContext(null);

/**
 * Core hook logic that creates and orchestrates the extension bridge state.
 */
function useExtensionBridgeCore(userId = null) {
  const [isDetected, setIsDetected] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [version, setVersion] = useState('1.0.9');
  const [browserName, setBrowserName] = useState('Chrome');
  const [latency, setLatency] = useState(null);
  const [remoteUser, setRemoteUser] = useState(null);
  const [remoteDaily, setRemoteDaily] = useState(null);
  const [remoteContests, setRemoteContests] = useState([]);
  const [focusModeEnabled, setFocusModeEnabled] = useState(false);
  const [solveBeforeScrollEnabled, setSolveBeforeScrollEnabled] = useState(false);
  const [remoteTimer, setRemoteTimer] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);

  const pendingRequestsRef = useRef(new Map());
  const deviceRegisteredRef = useRef(false);

  // Send a typed request to the extension bridge and await response
  const sendBridgeCommand = useCallback((type, payload = {}) => {
    return new Promise((resolve, reject) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timeoutId = setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          reject(new Error(`Extension request timeout: ${type}`));
        }
      }, 3500);

      pendingRequestsRef.current.set(requestId, {
        resolve: (data) => {
          clearTimeout(timeoutId);
          resolve(data);
        },
        reject: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        },
        sentAt: performance.now(),
      });

      const msg = {
        source: 'LEETING_WEB_APP',
        type,
        payload,
        requestId,
      };

      window.postMessage(msg, '*');
      if (typeof document !== 'undefined') {
        try {
          document.dispatchEvent(new CustomEvent('LEETING_PAGE_COMMAND', { detail: msg }));
        } catch {}
      }
    });
  }, []);

  // Poll extension status and calculate latency
  const checkStatus = useCallback(async () => {
    try {
      const start = performance.now();
      const res = await sendBridgeCommand('GET_STATUS');
      const roundTrip = Math.round(performance.now() - start);

      setLatency(roundTrip);
      setIsOnline(true);
      setIsDetected(true);
      setLastSyncedAt(new Date());

      if (res) {
        if (res.version) setVersion(res.version);
        if (res.user) setRemoteUser(res.user);
        if (res.daily) setRemoteDaily(res.daily);
        if (Array.isArray(res.contests)) setRemoteContests(res.contests);
        if (typeof res.focusMode === 'boolean') setFocusModeEnabled(res.focusMode);
        if (typeof res.solveBeforeScroll === 'boolean') setSolveBeforeScrollEnabled(res.solveBeforeScroll);
        if (res.activeTimer !== undefined) setRemoteTimer(res.activeTimer);
      }

      // Auto-register in Supabase device registry once per session
      if (userId && !deviceRegisteredRef.current) {
        deviceRegisteredRef.current = true;
        const deviceId = `browser_${browserName.toLowerCase()}_agent`;
        registerDevice(userId, {
          deviceId,
          deviceName: `${browserName} Browser Companion`,
          browserType: browserName,
          extensionVersion: res?.version || '1.0.9',
        }).catch(() => {});
      }

      return res;
    } catch {
      setIsOnline(false);
      return null;
    }
  }, [sendBridgeCommand, userId, browserName]);

  // Listen for messages broadcast from the extension content script
  useEffect(() => {
    function handleBridgePayload(payloadData) {
      if (!payloadData || typeof payloadData !== 'object') return;
      if (payloadData.source !== 'LEETING_EXTENSION_BRIDGE') return;

      const { type, data, requestId, success, error, version: extVer, browser: extBrowser } = payloadData;

      // Handle Presence Announcement
      if (type === 'ANNOUNCE_PRESENCE') {
        setIsDetected(true);
        setIsOnline(true);
        if (extVer) setVersion(extVer);
        if (extBrowser) setBrowserName(extBrowser);
        return;
      }

      // Handle Real-Time Storage State Changes
      if (type === 'STATE_CHANGED' && payloadData.payload) {
        const { focusMode, solveBeforeScroll, daily, contests, user, activeTimer } = payloadData.payload;
        if (typeof focusMode === 'boolean') setFocusModeEnabled(focusMode);
        if (typeof solveBeforeScroll === 'boolean') setSolveBeforeScrollEnabled(solveBeforeScroll);
        if (daily) setRemoteDaily(daily);
        if (Array.isArray(contests)) setRemoteContests(contests);
        if (user) setRemoteUser(user);
        if (activeTimer !== undefined) setRemoteTimer(activeTimer);
        setIsOnline(true);
        setIsDetected(true);
        return;
      }

      // Handle Command Replies
      if (requestId) {
        const pending = pendingRequestsRef.current.get(requestId);
        if (pending) {
          pendingRequestsRef.current.delete(requestId);
          if (success) {
            pending.resolve(data);
          } else {
            pending.reject(new Error(error || 'Command failed'));
          }
        }
      }
    }

    const handleWindowMessage = (event) => {
      handleBridgePayload(event?.data);
    };

    const handleCustomEvent = (event) => {
      handleBridgePayload(event?.detail);
    };

    window.addEventListener('message', handleWindowMessage);
    if (typeof document !== 'undefined') {
      document.addEventListener('LEETING_BRIDGE_MESSAGE', handleCustomEvent);
    }

    // Synchronously check dataset tag from content script
    if (typeof document !== 'undefined' && document.documentElement?.dataset?.leetingExtension) {
      setIsDetected(true);
      setVersion(document.documentElement.dataset.leetingExtension);
      if (document.documentElement.dataset.leetingBrowser) {
        setBrowserName(document.documentElement.dataset.leetingBrowser);
      }
    }

    // Initial ping
    window.postMessage({ source: 'LEETING_WEB_APP', type: 'PING_PRESENCE' }, '*');
    const timer = setTimeout(() => {
      checkStatus();
    }, 150);

    // Periodic heartbeat every 4 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 4000);

    // Immediate sync when tab or window regains focus (e.g. after toggling in extension popup)
    const handleFocus = () => {
      checkStatus();
    };

    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkStatus();
      }
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      if (typeof document !== 'undefined') {
        document.removeEventListener('LEETING_BRIDGE_MESSAGE', handleCustomEvent);
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      window.removeEventListener('focus', handleFocus);
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [checkStatus]);

  // Remote Control: Set Focus Mode in Extension
  const setRemoteFocus = useCallback(
    async (enabled) => {
      const prev = focusModeEnabled;
      setFocusModeEnabled(enabled);
      try {
        const res = await sendBridgeCommand('SET_FOCUS_MODE', { enabled });
        if (res && typeof res.focusMode === 'boolean') {
          setFocusModeEnabled(res.focusMode);
        }
        return { success: true, ...res };
      } catch (err) {
        setFocusModeEnabled(prev);
        console.warn('Failed to set focus mode in extension:', err);
        return { success: false, error: err?.message };
      }
    },
    [sendBridgeCommand, focusModeEnabled]
  );

  // Remote Control: Set Solve Before Scroll in Extension
  const setRemoteSolveBeforeScroll = useCallback(
    async (enabled) => {
      const prev = solveBeforeScrollEnabled;
      setSolveBeforeScrollEnabled(enabled);
      try {
        const res = await sendBridgeCommand('SET_SOLVE_BEFORE_SCROLL', { enabled });
        if (res && typeof res.solveBeforeScroll === 'boolean') {
          setSolveBeforeScrollEnabled(res.solveBeforeScroll);
        }
        if (res && typeof res.focusMode === 'boolean') {
          setFocusModeEnabled(res.focusMode);
        }
        return { success: true, ...res };
      } catch (err) {
        setSolveBeforeScrollEnabled(prev);
        console.warn('Failed to set SBS in extension:', err);
        return { success: false, error: err?.message };
      }
    },
    [sendBridgeCommand, solveBeforeScrollEnabled]
  );

  // Remote Control: Start Focus Timer in Extension
  const startRemoteTimer = useCallback(
    async (durationMinutes = 25) => {
      try {
        const startedAt = Date.now();
        const endTime = startedAt + durationMinutes * 60 * 1000;
        const res = await sendBridgeCommand('START_FOCUS_TIMER', {
          durationMinutes,
          startedAt,
          endTime,
        });
        setFocusModeEnabled(true);
        if (res?.timer) setRemoteTimer(res.timer);
        return { success: true, ...res };
      } catch (err) {
        console.warn('Failed to start remote timer:', err);
        return { success: false, error: err?.message };
      }
    },
    [sendBridgeCommand]
  );

  // Remote Control: Stop / Pause Focus Timer in Extension
  const stopRemoteTimer = useCallback(
    async () => {
      try {
        const res = await sendBridgeCommand('STOP_FOCUS_TIMER');
        if (typeof res?.focusMode === 'boolean') {
          setFocusModeEnabled(res.focusMode);
        }
        if (res?.timer) setRemoteTimer(res.timer);
        return { success: true, ...res };
      } catch (err) {
        console.warn('Failed to stop remote timer:', err);
        return { success: false, error: err?.message };
      }
    },
    [sendBridgeCommand]
  );

  // Trigger manual sync
  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await sendBridgeCommand('REFRESH_LEETCODE');
      if (res?.user) setRemoteUser(res.user);
      if (res?.daily) setRemoteDaily(res.daily);
      if (Array.isArray(res?.contests)) setRemoteContests(res.contests);
      setLastSyncedAt(new Date());
      setIsOnline(true);
      return res;
    } catch (err) {
      console.warn('Manual sync failed:', err);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [sendBridgeCommand]);

  return {
    isDetected,
    isOnline,
    version,
    browserName,
    latency,
    remoteUser,
    remoteDaily,
    remoteContests,
    focusModeEnabled,
    solveBeforeScrollEnabled,
    remoteTimer,
    isSyncing,
    lastSyncedAt,
    setRemoteFocus,
    setRemoteSolveBeforeScroll,
    startRemoteTimer,
    stopRemoteTimer,
    triggerSync,
    checkStatus,
  };
}

/**
 * Unified Global Provider that maintains a single, persistent extension bridge across all pages and components.
 */
export function ExtensionBridgeProvider({ children, userId = null }) {
  const bridge = useExtensionBridgeCore(userId);
  return React.createElement(
    ExtensionBridgeContext.Provider,
    { value: bridge },
    children
  );
}

/**
 * Hook to consume the single extension bridge. Falls back to standalone if invoked outside Provider.
 */
export function useExtensionBridge(userId = null) {
  const context = useContext(ExtensionBridgeContext);
  const standalone = useExtensionBridgeCore(userId);

  // If inside ExtensionBridgeProvider, use the shared singleton context
  if (context) {
    return context;
  }

  // Fallback for isolated components or unit tests
  return standalone;
}
