'use client';

import { useState, useMemo } from 'react';
import { Calendar, Flame, Award } from 'lucide-react';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format date as YYYY-MM-DD
function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format UTC date as YYYY-MM-DD
function formatUtcKey(d) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ActivityHeatmap({
  submissionCalendar = null,
  currentStreak = 0,
  longestStreak = 0,
  totalActiveDays = 0,
  username = 'The-Boss',
  isLive = false,
}) {
  const [activeView, setActiveView] = useState('365'); // '365' | 'year' | '35'
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  // Parse submissionCalendar into a fast lookup map: { 'YYYY-MM-DD': count }
  const calendarMap = useMemo(() => {
    const map = {};
    if (submissionCalendar) {
      let parsed = submissionCalendar;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = null;
        }
      }

      if (parsed && typeof parsed === 'object') {
        for (const [ts, count] of Object.entries(parsed)) {
          const sec = Number(ts);
          const numCount = Number(count);
          if (!isNaN(sec) && numCount > 0) {
            const dateObj = new Date(sec * 1000);
            const localKey = formatDateKey(dateObj);
            const utcKey = formatUtcKey(dateObj);

            map[localKey] = (map[localKey] || 0) + numCount;
            if (utcKey !== localKey) {
              map[utcKey] = (map[utcKey] || 0) + numCount;
            }
          }
        }
      }
    }
    return map;
  }, [submissionCalendar]);

  const hasLiveData = Object.keys(calendarMap).length > 0;

  // Generate distinct month block sections
  const { monthBlocks, totalSolvedInView, activeDaysInView, totalDaysInView } = useMemo(() => {
    const now = new Date();
    const todayNormalized = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayKey = formatDateKey(todayNormalized);

    // Number of months to show based on view
    // 365 Days: 13 months (e.g. Nov 2025 to Nov 2026)
    // Year: Jan 2026 to Dec 2026 (12 months)
    // 35 Days: 2 months (Oct and Nov)
    let monthsToBuild = [];

    if (activeView === 'year') {
      const curYear = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        monthsToBuild.push({ year: curYear, month: m });
      }
    } else if (activeView === '35') {
      for (let i = 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsToBuild.push({ year: d.getFullYear(), month: d.getMonth() });
      }
    } else {
      // Last 365 Days (13 months to cover full 365+ days)
      for (let i = 12; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthsToBuild.push({ year: d.getFullYear(), month: d.getMonth() });
      }
    }

    // Pseudorandom realistic fallback generator if no live data is available
    const getDemoCount = (d) => {
      const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const dayOfWk = d.getDay();
      if (dayOfWk === 0 && dayOfYear % 3 === 0) return 0;
      const hash = Math.sin(dayOfYear * 997 + 13) * 10000;
      const rand = hash - Math.floor(hash);
      if (rand > 0.85) return Math.floor(rand * 5) + 3; // 3-7
      if (rand > 0.45) return Math.floor(rand * 3) + 1; // 1-3
      if (rand > 0.25) return 1;
      return 0;
    };

    let totalSolved = 0;
    let activeDays = 0;
    let totalDays = 0;

    const blocks = monthsToBuild.map(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun, 6 = Sat

      const totalSlots = firstDayOfWeek + daysInMonth;
      const numCols = Math.ceil(totalSlots / 7);
      const cols = [];

      for (let c = 0; c < numCols; c++) {
        const colDays = [];
        for (let r = 0; r < 7; r++) {
          const slotIndex = c * 7 + r;
          const dayNum = slotIndex - firstDayOfWeek + 1;

          if (dayNum >= 1 && dayNum <= daysInMonth) {
            const cellDate = new Date(year, month, dayNum);
            const dateStr = formatDateKey(cellDate);
            const isToday = dateStr === todayKey;
            const isFuture = cellDate > todayNormalized && !isToday;

            let count = 0;
            if (!isFuture) {
              if (hasLiveData) {
                count = calendarMap[dateStr] || 0;
              } else {
                count = getDemoCount(cellDate);
              }
            }

            let level = 0;
            if (count === 1) level = 1;
            else if (count >= 2 && count <= 3) level = 2;
            else if (count >= 4 && count <= 5) level = 3;
            else if (count >= 6) level = 4;

            if (!isFuture) {
              totalDays += 1;
              if (count > 0) {
                totalSolved += count;
                activeDays += 1;
              }
            }

            colDays.push({
              valid: true,
              day: dayNum,
              date: cellDate,
              dateStr,
              dayOfWeek: r,
              count,
              level: isFuture ? -1 : level,
              isToday,
              isFuture,
            });
          } else {
            colDays.push({ valid: false });
          }
        }
        cols.push(colDays);
      }

      return {
        name: MONTH_NAMES[month],
        year,
        month,
        cols,
      };
    });

    return {
      monthBlocks: blocks,
      totalSolvedInView: totalSolved,
      activeDaysInView: activeDays,
      totalDaysInView: totalDays,
    };
  }, [activeView, calendarMap, hasLiveData]);

  // Locate today's cell to display as default when nothing is hovered/selected
  const todayCell = useMemo(() => {
    for (const block of monthBlocks) {
      for (const col of block.cols) {
        for (const cell of col) {
          if (cell.valid && cell.isToday) {
            return cell;
          }
        }
      }
    }
    return null;
  }, [monthBlocks]);

  const defaultCell = useMemo(() => {
    const now = new Date();
    return {
      date: now,
      dateStr: formatDateKey(now),
      count: 0,
      level: 0,
      isToday: true,
      valid: true,
    };
  }, []);

  const activeDisplay = hoveredCell || selectedCell || todayCell || defaultCell;

  // Color mappings for levels
  const getCellClasses = (level, isToday, isFuture, isSelected) => {
    if (isFuture) {
      return 'bg-white/[0.01] border-white/[0.03] text-transparent cursor-default pointer-events-none opacity-20';
    }

    const base = 'transition-all duration-150 rounded-[3px] border cursor-pointer relative';
    const selection = isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#08090d] z-20 scale-125' : '';
    const todayRing = isToday ? 'ring-1.5 ring-leeting-orange ring-offset-1 ring-offset-[#08090d] z-10' : '';

    switch (level) {
      case 1:
        return `${base} bg-emerald-950/80 border-emerald-800/40 hover:border-emerald-500/80 hover:shadow-[0_0_8px_rgba(16,185,129,0.4)] hover:scale-125 ${selection} ${todayRing}`;
      case 2:
        return `${base} bg-emerald-800/80 border-emerald-600/50 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)] hover:scale-125 ${selection} ${todayRing}`;
      case 3:
        return `${base} bg-emerald-600 border-emerald-500 hover:border-emerald-300 hover:shadow-[0_0_12px_rgba(16,185,129,0.7)] hover:scale-125 ${selection} ${todayRing}`;
      case 4:
        return `${base} bg-emerald-400 border-emerald-300 hover:brightness-110 hover:shadow-[0_0_14px_rgba(52,211,153,0.85)] hover:scale-125 ${selection} ${todayRing}`;
      case 0:
      default:
        return `${base} bg-white/[0.025] border-white/[0.06] hover:border-white/[0.2] hover:scale-110 ${selection} ${todayRing}`;
    }
  };

  const formatHumanDate = (dateObj) => {
    if (!dateObj) return '';
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="glass-obsidian p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/[0.06] mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-leeting-orange border border-amber-500/20 shadow-inner">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  365-Day Consistency Matrix
                </h3>
                {isLive && hasLiveData ? (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live GraphQL
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-400">
                    Demo Preset
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400">
                {activeView === '365' && '13 distinct month block sections with spacer separation'}
                {activeView === 'year' && `All 12 months logged in ${new Date().getFullYear()}`}
                {activeView === '35' && 'Recent 5-week zoomed consistency cadence'}
              </span>
            </div>
          </div>

          {/* View Toggles & Legend */}
          <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
            {/* View Pill Selector */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/50 border border-white/[0.08] text-xs backdrop-blur-md">
              <button
                onClick={() => setActiveView('365')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  activeView === '365'
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 365 Days
              </button>
              <button
                onClick={() => setActiveView('year')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  activeView === 'year'
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {new Date().getFullYear()}
              </button>
              <button
                onClick={() => setActiveView('35')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  activeView === '35'
                    ? 'bg-white/[0.12] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                35 Days
              </button>
            </div>

            {/* Legend */}
            <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400 px-3 py-1.5 rounded-2xl bg-black/30 border border-white/[0.05]">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-white/[0.03] border border-white/[0.08]" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-950/80 border border-emerald-800/40" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-800/80 border border-emerald-600/50" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600 border border-emerald-500" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 border border-emerald-300" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Heatmap Matrix Display: Month Block Sections with Empty Spacers */}
        <div className="relative">
          <div className="flex items-start">
            {/* Pinned Day Labels Column on Left - NEVER SCROLLS when slider moves */}
            <div className="flex flex-col flex-shrink-0 w-8 sm:w-9 pr-2 select-none z-10">
              {/* Spacer matching Month Name Header Height */}
              <div className="h-6 mb-2" />
              {/* 7 Day Rows strictly aligned with grid cells */}
              <div className="flex flex-col gap-1 sm:gap-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                <div className="h-3 sm:h-3.5 flex items-center leading-none" />
                <div className="h-3 sm:h-3.5 flex items-center leading-none text-slate-400">Mon</div>
                <div className="h-3 sm:h-3.5 flex items-center leading-none" />
                <div className="h-3 sm:h-3.5 flex items-center leading-none text-slate-400">Wed</div>
                <div className="h-3 sm:h-3.5 flex items-center leading-none" />
                <div className="h-3 sm:h-3.5 flex items-center leading-none text-slate-400">Fri</div>
                <div className="h-3 sm:h-3.5 flex items-center leading-none" />
              </div>
            </div>

            {/* Scrollable Container with Custom Styling */}
            <div className="overflow-x-auto pb-4 pt-1 flex-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="min-w-[800px] select-none flex items-start">
                {monthBlocks.map((month, mIdx) => (
                  <div key={mIdx} className="flex items-start">
                    {/* Month Block Section */}
                    <div className="flex flex-col items-center">
                      {/* Name of the Month on Top of that Block Section */}
                      <div className="h-6 mb-2 flex items-center justify-center">
                        <span className="text-xs font-normal text-slate-400">
                          {month.name}
                        </span>
                      </div>

                      {/* Month Columns (7 Days Each) */}
                      <div className="flex gap-1 sm:gap-1.5">
                        {month.cols.map((col, cIdx) => (
                          <div key={cIdx} className="flex flex-col gap-1 sm:gap-1.5 flex-shrink-0">
                            {col.map((cell, rIdx) => {
                              if (!cell.valid) {
                                return (
                                  <div
                                    key={rIdx}
                                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 invisible pointer-events-none"
                                  />
                                );
                              }
                              return (
                                <div
                                  key={rIdx}
                                  onMouseEnter={() => setHoveredCell(cell)}
                                  onMouseLeave={() => setHoveredCell(null)}
                                  onClick={() => !cell.isFuture && setSelectedCell(cell)}
                                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${getCellClasses(
                                    cell.level,
                                    cell.isToday,
                                    cell.isFuture,
                                    selectedCell?.dateStr === cell.dateStr
                                  )}`}
                                  title={`${cell.count} problem(s) on ${cell.dateStr}`}
                                />
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Empty Separator Column Between Two Months */}
                    {mIdx < monthBlocks.length - 1 && (
                      <div className="w-3.5 sm:w-4 flex flex-col items-center justify-start flex-shrink-0 pt-8 px-1">
                        {/* Empty divider column / separator line */}
                        <div className="w-[1px] h-[95px] sm:h-[110px] bg-white/[0.08] rounded-full mx-auto" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permanent Middle Inspection Bar - Keeps UI 100% Consistent & Stable */}
          <div className="mt-4 p-3.5 rounded-2xl bg-black/60 border border-white/[0.1] backdrop-blur-md flex items-center justify-between min-h-[58px] transition-all">
            <div className="flex items-center gap-3">
              <div
                className={`w-3.5 h-3.5 rounded-[4px] flex-shrink-0 transition-colors ${
                  activeDisplay.level === 4
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : activeDisplay.level === 3
                    ? 'bg-emerald-600'
                    : activeDisplay.level === 2
                    ? 'bg-emerald-800'
                    : activeDisplay.level === 1
                    ? 'bg-emerald-950 border border-emerald-700'
                    : 'bg-white/[0.05] border border-white/[0.1]'
                }`}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white block">
                    {formatHumanDate(activeDisplay.date)}
                  </span>
                  {activeDisplay.isToday && (
                    <span className="text-[10px] text-amber-400 font-extrabold uppercase bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded">
                      Today
                    </span>
                  )}
                  {selectedCell?.dateStr === activeDisplay.dateStr && (
                    <span className="text-[10px] text-cyan-400 font-extrabold uppercase bg-cyan-400/10 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                      Pinned
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono mt-0.5 block">
                  {activeDisplay.count > 0 ? (
                    <span className="text-emerald-400 font-bold">
                      {activeDisplay.count} problem{activeDisplay.count > 1 ? 's' : ''} solved
                    </span>
                  ) : (
                    <span className="text-slate-400">0 problems solved</span>
                  )}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono font-bold block transition-colors">
                {activeDisplay.level === 4 && <span className="text-emerald-400">Level 4 · Maximum Velocity</span>}
                {activeDisplay.level === 3 && <span className="text-emerald-400">Level 3 · Intense Session</span>}
                {activeDisplay.level === 2 && <span className="text-emerald-300">Level 2 · Moderate Cadence</span>}
                {activeDisplay.level === 1 && <span className="text-emerald-200">Level 1 · Active Cadence</span>}
                {activeDisplay.level === 0 && <span className="text-slate-500">Level 0 · Rest Day</span>}
              </span>
              <span className="text-[10px] text-slate-500">
                {hoveredCell ? 'Click to pin details' : selectedCell ? 'Pinned Day' : 'Hover over any day to inspect'}
              </span>
            </div>
          </div>

          {/* Selected Cell Deep Dive Drawer */}
          {selectedCell && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/20 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Selected Day: {formatHumanDate(selectedCell.date)}
                    </span>
                    {selectedCell.isToday && (
                      <span className="text-[10px] text-amber-400 font-black uppercase bg-amber-500/20 px-1.5 py-0.5 rounded">
                        Current Day
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-emerald-300 font-mono mt-0.5 block">
                    {selectedCell.count} algorithmic problem{selectedCell.count > 1 ? 's' : ''} completed · Goal satisfied
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCell(null)}
                className="text-xs text-slate-400 hover:text-white px-3 py-1 rounded-xl bg-white/[0.05] border border-white/[0.08]"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Bottom Quick Analytics Strip */}
        <div className="pt-6 mt-6 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-0.5 font-semibold">Total Solved (View)</span>
            <span className="text-base font-black text-white font-mono">{totalSolvedInView}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5 font-semibold">Active Days</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {activeDaysInView} <span className="text-slate-500 text-xs font-normal">/ {totalDaysInView}d</span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5 font-semibold">Current Streak</span>
            <span className="text-base font-black text-amber-400 font-mono flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {currentStreak} Days
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-0.5 font-semibold">Longest Streak</span>
            <span className="text-base font-black text-cyan-400 font-mono flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              {longestStreak} Days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}