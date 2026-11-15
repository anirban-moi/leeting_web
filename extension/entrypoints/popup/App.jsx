import React, { useState, useEffect } from 'react';
import {
  Flame,
  Trophy,
  Coins,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  ShieldAlert,
  Lock,
  RefreshCw,
  LogIn,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  storageGet,
  STORAGE_KEYS,
  getFocusModeEnabled,
  setFocusModeEnabled,
  getSolveBeforeScrollEnabled,
  setSolveBeforeScrollEnabled,
  getAutoFocusLocked,
  setLastCoinClaimDate,
  getExpandedSections,
  setExpandedSections,
} from '../../src/services/storage.js';
import { runDailyCheck, runContestCheck, enforceSolveBeforeScroll } from '../../src/background/worker.js';
import { syncFocusModeNetworkRules } from '../../src/services/network.js';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const [daily, setDaily] = useState(null);
  const [dailyError, setDailyError] = useState(null);
  const [contests, setContests] = useState([]);
  const [focusMode, setFocusMode] = useState(false);
  const [solveBeforeScroll, setSolveBeforeScroll] = useState(false);
  const [autoLocked, setAutoLocked] = useState(false);
  const [coinsClaimed, setCoinsClaimed] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [expandedSections, setExpandedSectionsState] = useState({
    user: true,
    daily: true,
    contest: true,
    sbs: true,
    focus: true,
    coins: true,
  });

  const toggleSection = (sectionKey) => {
    setExpandedSectionsState((prev) => {
      const next = { ...prev, [sectionKey]: !prev[sectionKey] };
      setExpandedSections(next);
      return next;
    });
  };

  // Load initial state from storage or trigger background sync
  useEffect(() => {
    async function init() {
      try {
        const [
          cachedUser,
          cachedDaily,
          isFocusOn,
          isSolveBeforeScrollOn,
          isAutoLocked,
          lastClaimDate,
          savedSections,
        ] = await Promise.all([
          storageGet(STORAGE_KEYS.CACHED_USER, null),
          storageGet(STORAGE_KEYS.CACHED_DAILY, null),
          getFocusModeEnabled(),
          getSolveBeforeScrollEnabled(),
          getAutoFocusLocked(),
          storageGet(STORAGE_KEYS.LAST_COIN_CLAIM, null),
          getExpandedSections(),
        ]);

        if (cachedUser) setUser(cachedUser);
        if (cachedDaily) setDaily(cachedDaily);
        setFocusMode(Boolean(isFocusOn));
        setSolveBeforeScroll(Boolean(isSolveBeforeScrollOn));
        setAutoLocked(Boolean(isAutoLocked));
        if (savedSections) setExpandedSectionsState(savedSections);

        const today = new Date().toISOString().split('T')[0];
        setCoinsClaimed(lastClaimDate === today);

        // Fetch live fresh data from background worker
        await refreshData();
      } catch (err) {
        console.error('Failed to initialize popup:', err);
      } finally {
        setLoading(false);
      }
    }

    init();

    // Listen to real-time storage changes (e.g. from Web Dashboard or background alarms)
    const handleStorageChange = (changes, areaName) => {
      if (areaName !== 'local') return;
      if (changes[STORAGE_KEYS.FOCUS_MODE] !== undefined) {
        setFocusMode(Boolean(changes[STORAGE_KEYS.FOCUS_MODE].newValue));
      }
      if (changes[STORAGE_KEYS.SOLVE_BEFORE_SCROLL] !== undefined) {
        setSolveBeforeScroll(Boolean(changes[STORAGE_KEYS.SOLVE_BEFORE_SCROLL].newValue));
      }
      if (changes[STORAGE_KEYS.AUTO_FOCUS_LOCKED] !== undefined) {
        setAutoLocked(Boolean(changes[STORAGE_KEYS.AUTO_FOCUS_LOCKED].newValue));
      }
      if (changes[STORAGE_KEYS.CACHED_DAILY] !== undefined) {
        setDaily(changes[STORAGE_KEYS.CACHED_DAILY].newValue);
      }
      if (changes[STORAGE_KEYS.CACHED_USER] !== undefined) {
        setUser(changes[STORAGE_KEYS.CACHED_USER].newValue);
      }
    };

    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener(handleStorageChange);
    }

    return () => {
      if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, []);

  const refreshData = async () => {
    setRefreshing(true);
    setSyncError(null);

    const applyUpdate = (dailyData, contestList) => {
      if (dailyData?.user) setUser(dailyData.user);
      if (dailyData?.daily) setDaily(dailyData.daily);
      setDailyError(dailyData?.dailyError || null);
      if (typeof dailyData?.focusMode === 'boolean') {
        setFocusMode(dailyData.focusMode);
      }
      if (typeof dailyData?.autoLocked === 'boolean') {
        setAutoLocked(dailyData.autoLocked);
      }
      if (contestList) setContests(contestList);

      const today = new Date().toISOString().split('T')[0];
      storageGet(STORAGE_KEYS.LAST_COIN_CLAIM, null).then((date) => {
        setCoinsClaimed(date === today);
      });
    };

    try {
      let msgErr = null;
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        const response = await Promise.race([
          new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }, (res) => {
              if (chrome.runtime?.lastError) {
                msgErr = chrome.runtime.lastError.message;
                resolve(null);
              } else {
                resolve(res);
              }
            });
          }),
          new Promise((resolve) => setTimeout(() => {
            msgErr = 'worker timeout';
            resolve(null);
          }, 10000)),
        ]);

        if (response && response.success) {
          applyUpdate(response.dailyData, response.contests);
          return;
        }
        if (response && response.error) {
          msgErr = response.error;
        }
      }

      // Direct fallback inside popup if service worker messaging timed out or wasn't available
      if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
        const [dailyData, contestList] = await Promise.all([runDailyCheck(), runContestCheck()]);
        applyUpdate(dailyData, contestList);
      } else if (msgErr) {
        setSyncError(msgErr);
      }
    } catch (err) {
      console.warn('Refresh fallback error:', err);
      setSyncError(err?.message || 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const isFocusLocked = Boolean(
    solveBeforeScroll && !daily?.isSolved
  );

  const handleToggleFocusMode = async () => {
    if (isFocusLocked) return;
    const nextState = !focusMode;
    setFocusMode(nextState);
    await setFocusModeEnabled(nextState);
    await syncFocusModeNetworkRules(nextState);

    // Broadcast to all active tabs (both focus shield and web companion bridge)
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({}, (tabs) => {
        tabs?.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'FOCUS_MODE_CHANGED',
              enabled: nextState,
            }).catch(() => {});
            chrome.tabs.sendMessage(tab.id, {
              type: 'LEETING_STATE_UPDATE',
              payload: {
                focusMode: nextState,
                solveBeforeScroll,
              },
            }).catch(() => {});
          }
        });
      });
    }
  };

  const handleToggleSolveBeforeScroll = async () => {
    const nextEnabled = !solveBeforeScroll;
    setSolveBeforeScroll(nextEnabled);
    await setSolveBeforeScrollEnabled(nextEnabled);

    const lockState = await enforceSolveBeforeScroll(daily);
    setFocusMode(lockState.focusMode);
    setAutoLocked(lockState.autoLocked);

    // Broadcast update to all open tabs (content scripts & web companion)
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({}, (tabs) => {
        tabs?.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'LEETING_STATE_UPDATE',
              payload: {
                solveBeforeScroll: nextEnabled,
                focusMode: lockState.focusMode,
                autoLocked: lockState.autoLocked,
              },
            }).catch(() => {});
          }
        });
      });
    }
  };

  const handleClaimCoins = async () => {
    const today = new Date().toISOString().split('T')[0];
    await setLastCoinClaimDate(today);
    setCoinsClaimed(true);
    openUrl('https://leetcode.com/store/');
  };

  const openUrl = (url) => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  };

  const formatCountdown = (startTimeMs) => {
    const diff = startTimeMs - Date.now();
    if (diff <= 0) return 'Live now!';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `in ${days}d ${hours % 24}h`;
    }
    return `in ${hours}h ${mins}m`;
  };

  const nextContest = contests && contests.length > 0 ? contests[0] : null;

  return (
    <div className="flex flex-col bg-[#1a1a1a] text-[#eff1f6] p-3 text-xs font-sans w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333] pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-[#ffa116] flex items-center justify-center font-bold text-black text-sm shadow">
            L
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-sm font-bold tracking-wide">Leeting</h1>
              <span className="text-[9px] text-gray-500 bg-[#262626] px-1 rounded">
                v{typeof chrome !== 'undefined' && chrome.runtime?.getManifest ? chrome.runtime.getManifest().version : '1.0.9'}
              </span>
            </div>
            <p className="text-[10px] text-gray-400">LeetCode & Focus Companion</p>
          </div>
        </div>

        <button
          onClick={refreshData}
          disabled={refreshing}
          className="p-1.5 rounded-md hover:bg-[#2c2c2c] text-gray-400 hover:text-white transition"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#ffa116]' : ''}`} />
        </button>
      </div>

      {/* User Status / Streaks */}
      <div className="bg-[#242424] rounded-lg p-3 mb-2.5 border border-[#333] transition-[background-color,border-color] duration-200">
        {user?.isSignedIn ? (
          <div>
            <div
              onClick={() => toggleSection('user')}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSections.user}
              className="flex items-center justify-between cursor-pointer select-none"
              title={expandedSections.user ? 'Collapse profile section' : 'Expand profile section'}
            >
              <div className="flex items-center space-x-2">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-6 h-6 rounded-full border border-gray-600" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold">
                    {user.username ? user.username[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="font-semibold text-gray-200">{user.username}</span>
              </div>

              <div className="flex items-center space-x-2">
                {/* Coins */}
                <div className="flex items-center space-x-1 text-[#ffa116] bg-[#ffa116]/10 px-2 py-0.5 rounded-full font-medium">
                  <Coins className="w-3 h-3" />
                  <span>{user.points || 0}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                    expandedSections.user ? 'rotate-0' : '-rotate-90'
                  }`}
                />
              </div>
            </div>

            <div
              className={`accordion-collapse ${expandedSections.user ? 'expanded' : ''}`}
              data-testid="user-dropdown"
              aria-hidden={!expandedSections.user}
            >
              <div className="accordion-inner">
                <div className="mt-2.5">
                  {/* Current Streak */}
                  <div className="bg-[#1c1c1c] px-3 py-2 rounded border border-[#333] flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-gray-300">
                      <Flame className="w-4 h-4 text-orange-400 fill-current" />
                      <span className="font-medium">Current Streak</span>
                      {refreshing && <span className="text-[9px] text-gray-500">(syncing...)</span>}
                    </div>
                    <span className="text-sm font-bold text-orange-400">
                      {user.currentStreak || 0} {user.currentStreak === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                  {(user.streakDebug || syncError) && !user.currentStreak && (
                    <div className="mt-1.5 text-[9px] text-yellow-400/80 text-center break-all">
                      Streak info: {user.streakDebug || syncError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div
              onClick={() => toggleSection('user')}
              role="button"
              tabIndex={0}
              aria-expanded={expandedSections.user}
              className="flex items-center justify-between cursor-pointer select-none"
              title={expandedSections.user ? 'Collapse' : 'Expand'}
            >
              <div className="flex items-center space-x-1.5 text-gray-400">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">
                  {user?.hasSessionCookie ? 'Session Cookie Detected (Sync Pending)' : 'Not logged in to LeetCode'}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                  expandedSections.user ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </div>

            <div
              className={`accordion-collapse ${expandedSections.user ? 'expanded' : ''}`}
              data-testid="user-dropdown"
              aria-hidden={!expandedSections.user}
            >
              <div className="accordion-inner">
                <div className="text-center pt-2">
                  <p className="text-[10px] text-gray-500 mb-2">
                    {user?.hasSessionCookie
                      ? 'Please refresh your open LeetCode tab once, then click Sync below.'
                      : 'Log in on LeetCode in your browser to sync streak & coins.'}
                  </p>
                  <div className="flex items-center justify-center space-x-2">
                    {user?.hasSessionCookie ? (
                      <button
                        onClick={refreshData}
                        className="inline-flex items-center space-x-1 bg-[#ffa116] text-black font-semibold px-3 py-1.5 rounded-md hover:bg-[#ffb342] transition"
                      >
                        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                        <span>Sync Now</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openUrl('https://leetcode.com/accounts/login/')}
                        className="inline-flex items-center space-x-1 bg-[#ffa116] text-black font-semibold px-3 py-1.5 rounded-md hover:bg-[#ffb342] transition"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Log In to LeetCode</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Challenge Card */}
      <div className="bg-[#242424] rounded-lg p-3 mb-2.5 border border-[#333] transition-[background-color,border-color] duration-200">
        <div
          onClick={() => toggleSection('daily')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedSections.daily}
          className="flex items-center justify-between cursor-pointer select-none"
          title={expandedSections.daily ? 'Collapse Daily Challenge' : 'Expand Daily Challenge'}
        >
          <span className="font-semibold text-gray-300">Daily Challenge</span>
          <div className="flex items-center space-x-2">
            {daily?.isSolved ? (
              <span className="inline-flex items-center space-x-1 text-[#00b8a3] bg-[#00b8a3]/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Solved</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-[#ff375f] bg-[#ff375f]/10 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                <Clock className="w-3 h-3" />
                <span>Pending</span>
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                expandedSections.daily ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </div>

        <div
          className={`accordion-collapse ${expandedSections.daily ? 'expanded' : ''}`}
          data-testid="daily-dropdown"
          aria-hidden={!expandedSections.daily}
        >
          <div className="accordion-inner">
            <div className="mt-2.5">
              {daily ? (
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        daily.difficulty === 'Easy'
                          ? 'bg-[#00b8a3]/20 text-[#00b8a3]'
                          : daily.difficulty === 'Medium'
                          ? 'bg-[#ffc01e]/20 text-[#ffc01e]'
                          : 'bg-[#ff375f]/20 text-[#ff375f]'
                      }`}
                    >
                      {daily.difficulty}
                    </span>
                    <h2 className="font-semibold text-gray-100 truncate text-xs flex-1">
                      {daily.title}
                    </h2>
                  </div>

                  {daily.topicTags && daily.topicTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      {daily.topicTags.slice(0, 3).map((tag) => (
                        <span key={tag} className="bg-[#333] text-gray-400 px-1.5 py-0.5 rounded text-[9px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => openUrl(daily.link)}
                    className="w-full flex items-center justify-center space-x-1 bg-[#2f2f2f] hover:bg-[#383838] text-gray-200 py-1.5 rounded transition border border-[#444]"
                  >
                    <span>{daily.isSolved ? 'Review Submission' : 'Solve on LeetCode'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="text-gray-400 text-center py-2 text-[11px] flex flex-col items-center">
                  <span>{refreshing ? 'Fetching today\'s challenge...' : (dailyError || 'Challenge data pending')}</span>
                  <button
                    onClick={refreshData}
                    className="mt-1 text-[#ffa116] hover:underline"
                  >
                    Click to refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Contest Card */}
      {nextContest && (
        <div className="bg-[#242424] rounded-lg p-3 mb-2.5 border border-[#333] transition-[background-color,border-color] duration-200">
          <div
            onClick={() => toggleSection('contest')}
            role="button"
            tabIndex={0}
            aria-expanded={expandedSections.contest}
            className="flex items-center justify-between cursor-pointer select-none"
            title={expandedSections.contest ? 'Collapse Upcoming Contest' : 'Expand Upcoming Contest'}
          >
            <span className="font-semibold text-gray-300 flex items-center space-x-1">
              <Trophy className="w-3.5 h-3.5 text-yellow-500" />
              <span>Upcoming Contest</span>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-[#ffa116] font-semibold text-[10px]">
                {formatCountdown(nextContest.startTimeMs)}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                  expandedSections.contest ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </div>
          </div>

          <div
            className={`accordion-collapse ${expandedSections.contest ? 'expanded' : ''}`}
            data-testid="contest-dropdown"
            aria-hidden={!expandedSections.contest}
          >
            <div className="accordion-inner">
              <div className="mt-2.5 pt-2 border-t border-[#333] flex items-center justify-between">
                <span className="text-gray-300 truncate font-medium text-[11px]">
                  {nextContest.title}
                </span>
                <button
                  onClick={() => openUrl(nextContest.url)}
                  className="text-[#ffa116] hover:underline flex items-center space-x-0.5 text-[10px] ml-2 shrink-0"
                >
                  <span>Details</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solve Before Scroll Card */}
      <div className="bg-[#242424] rounded-lg p-3 mb-2.5 border border-[#333] transition-[background-color,border-color] duration-200">
        <div
          onClick={() => toggleSection('sbs')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedSections.sbs}
          className="flex items-center justify-between cursor-pointer select-none"
          title={expandedSections.sbs ? 'Collapse Solve Before Scroll' : 'Expand Solve Before Scroll'}
        >
          <div className="flex items-center space-x-2">
            <Lock className={`w-4 h-4 ${solveBeforeScroll ? (daily?.isSolved ? 'text-[#00b8a3]' : 'text-amber-400') : 'text-gray-500'}`} />
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-gray-200">Solve Before Scroll</span>
              {solveBeforeScroll && isFocusLocked && (
                <span className="inline-flex items-center space-x-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Locked</span>
                </span>
              )}
              {solveBeforeScroll && daily?.isSolved && (
                <span className="inline-flex items-center space-x-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>Solved Today</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleSolveBeforeScroll();
              }}
              aria-label="Toggle Solve Before Scroll"
              title="Toggle Solve Before Scroll"
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                solveBeforeScroll ? 'bg-amber-500' : 'bg-[#444]'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  solveBeforeScroll ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                expandedSections.sbs ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </div>

        <div
          className={`accordion-collapse ${expandedSections.sbs ? 'expanded' : ''}`}
          data-testid="sbs-dropdown"
          aria-hidden={!expandedSections.sbs}
        >
          <div className="accordion-inner">
            <div className="mt-2.5 pt-2 border-t border-[#333]">
              <div className="text-[11px] text-gray-300 mb-1">
                {isFocusLocked ? (
                  <span className="text-amber-400 font-medium">
                    Focus Mode is locked ON until today's Daily Challenge is solved.
                  </span>
                ) : solveBeforeScroll && daily?.isSolved ? (
                  <span className="text-[#00b8a3] font-medium">
                    Daily challenge solved! Focus Mode can be freely toggled today.
                  </span>
                ) : solveBeforeScroll ? (
                  <span>Auto-locks Focus Mode ON each morning until today's Daily Challenge is solved.</span>
                ) : (
                  <span className="text-gray-400">
                    Lock Focus Mode automatically every day until you solve the LeetCode Daily Challenge.
                  </span>
                )}
              </div>
              <div className="text-[10px] text-gray-400">
                Blocks Shorts, Playables, Instagram & Facebook until you finish your daily problem.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Focus Mode Card */}
      <div className="bg-[#242424] rounded-lg p-3 mb-2.5 border border-[#333] transition-[background-color,border-color] duration-200">
        <div
          onClick={() => toggleSection('focus')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedSections.focus}
          className="flex items-center justify-between cursor-pointer select-none"
          title={expandedSections.focus ? 'Collapse Focus Mode' : 'Expand Focus Mode'}
        >
          <div className="flex items-center space-x-2">
            {focusMode ? (
              <Shield className="w-4 h-4 text-[#00b8a3]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-gray-500" />
            )}
            <div className="flex items-center space-x-1.5">
              <span className="font-semibold text-gray-200">Focus Mode</span>
              {isFocusLocked && (
                <span className="inline-flex items-center space-x-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Auto-Locked</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFocusMode();
              }}
              disabled={isFocusLocked}
              aria-label="Toggle Focus Mode"
              title={isFocusLocked ? 'Controlled by Solve Before Scroll until Daily Challenge is solved' : 'Toggle Focus Mode'}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition ${
                focusMode ? 'bg-[#00b8a3]' : 'bg-[#444]'
              } ${isFocusLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                  focusMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                expandedSections.focus ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </div>

        <div
          className={`accordion-collapse ${expandedSections.focus ? 'expanded' : ''}`}
          data-testid="focus-dropdown"
          aria-hidden={!expandedSections.focus}
        >
          <div className="accordion-inner">
            <div className="mt-2.5 pt-2 border-t border-[#333]">
              <div className="text-[11px] mb-2">
                {focusMode ? (
                  <span className="text-[#00b8a3] font-medium">Blocking distracting feeds</span>
                ) : (
                  <span className="text-gray-400">Distracting feeds are currently allowed</span>
                )}
                {isFocusLocked && (
                  <span className="text-amber-400 block text-[10px] mt-0.5">
                    Locked ON by Solve Before Scroll. Solve today's challenge to unlock.
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="bg-[#1c1c1c] text-gray-300 px-2 py-0.5 rounded border border-[#333]">YouTube Shorts</span>
                <span className="bg-[#1c1c1c] text-gray-300 px-2 py-0.5 rounded border border-[#333]">YT Playables</span>
                <span className="bg-[#1c1c1c] text-gray-300 px-2 py-0.5 rounded border border-[#333]">Instagram</span>
                <span className="bg-[#1c1c1c] text-gray-300 px-2 py-0.5 rounded border border-[#333]">Facebook</span>
                <span className="bg-[#1c1c1c] text-gray-300 px-2 py-0.5 rounded border border-[#333]">LinkedIn Video</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LeetCoins Check-in Card */}
      <div className="bg-[#242424] rounded-lg p-2.5 border border-[#333] transition-[background-color,border-color] duration-200">
        <div
          onClick={() => toggleSection('coins')}
          role="button"
          tabIndex={0}
          aria-expanded={expandedSections.coins}
          className="flex items-center justify-between cursor-pointer select-none"
          title={expandedSections.coins ? 'Collapse LeetCoin Reward' : 'Expand LeetCoin Reward'}
        >
          <div className="flex items-center space-x-1.5">
            <Coins className="w-3.5 h-3.5 text-[#ffa116]" />
            <span className="text-gray-200 font-medium">Daily LeetCoin Reward</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClaimCoins();
              }}
              className={`inline-flex items-center space-x-1 font-semibold px-2.5 py-1 rounded text-[10px] transition ${
                coinsClaimed
                  ? 'bg-[#2f2f2f] hover:bg-[#383838] text-[#00b8a3] border border-[#00b8a3]/30'
                  : 'bg-[#ffa116] hover:bg-[#ffb342] text-black'
              }`}
            >
              <span>{coinsClaimed ? 'Store' : 'Claim'}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>

            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ease-in-out ${
                expandedSections.coins ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </div>

        <div
          className={`accordion-collapse ${expandedSections.coins ? 'expanded' : ''}`}
          data-testid="coins-dropdown"
          aria-hidden={!expandedSections.coins}
        >
          <div className="accordion-inner">
            <div className="mt-2 pt-2 border-t border-[#333] text-[10px] text-gray-400">
              {coinsClaimed
                ? 'Checked in today. Visit the LeetCode Store to redeem coins for badges and perks.'
                : 'Claim daily bonus coins directly on the LeetCode Store.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
