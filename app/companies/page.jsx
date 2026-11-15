'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useAuth } from '../../components/auth/AuthProvider';
import { 
  Building2, 
  ExternalLink, 
  Search, 
  Filter, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Flame, 
  Layers, 
  RotateCcw, 
  ArrowUpDown, 
  Check, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  BookmarkCheck,
  TrendingUp,
  Tag,
  Globe,
  Lock,
  LogIn,
  X
} from 'lucide-react';

const TIMEFRAMES = [
  { key: 'thirty-days', line1: 'Last 30', line2: 'Days', label: 'Last 30 Days', short: '30 Days', desc: 'Active interview rounds' },
  { key: 'three-months', line1: 'Last 3', line2: 'Months', label: 'Last 3 Months', short: '3 Months', desc: 'Recent interview trend' },
  { key: 'six-months', line1: 'Last 6', line2: 'Months', label: 'Last 6 Months', short: '6 Months', desc: 'Standard hiring season' },
  { key: 'all', line1: 'All', line2: 'Time', label: 'All Time', short: 'All Time', desc: 'Complete historical archive' }
];

const FREQ_THRESHOLDS = [
  { value: 0, label: 'All Frequencies' },
  { value: 80, label: '≥ 80% (Must Solve)' },
  { value: 60, label: '≥ 60% (High Priority)' },
  { value: 40, label: '≥ 40% (Medium Priority)' },
  { value: 20, label: '≥ 20% (Foundational)' }
];

export default function CompaniesPage() {
  const { user, isCloudConnected } = useAuth();
  const [indexData, setIndexData] = useState(null);
  
  // 1. By default, no company is selected (null = All available questions)
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('thirty-days');
  const [companyData, setCompanyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkeletonActive, setIsSkeletonActive] = useState(true);
  
  // Auth Prompt Modal & Toast State
  const [mounted, setMounted] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const [targetQuestionTitle, setTargetQuestionTitle] = useState('');
  const [authToast, setAuthToast] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [minFrequency, setMinFrequency] = useState(0);
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | done | pending
  const [sortBy, setSortBy] = useState('freq-desc'); // freq-desc | freq-asc | title-asc | diff-asc
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Solved Questions Tracker (Persisted in localStorage)
  const [doneQuestions, setDoneQuestions] = useState(new Set());

  // Debounce search query to prevent stutter while typing
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // 2-Second Timeout Skeleton Effect: activates whenever dataset or filter changes
  useEffect(() => {
    setIsSkeletonActive(true);
    const timer = setTimeout(() => {
      setIsSkeletonActive(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [selectedCompany, selectedTimeframe, selectedTopic, minFrequency, difficultyFilter, statusFilter, sortBy, currentPage, pageSize, debouncedSearch]);

  const showSkeleton = isLoading || isSkeletonActive;

  // 1. Load index metadata and localStorage done state on mount
  useEffect(() => {
    fetch('/data/companies/index.json')
      .then(res => res.json())
      .then(data => {
        setIndexData(data);
      })
      .catch(err => console.error('Failed to load company index:', err));

    try {
      const saved = localStorage.getItem('leeting_done_company_questions');
      if (saved) {
        setDoneQuestions(new Set(JSON.parse(saved)));
      }
    } catch (e) {
      console.warn('Could not read localStorage for done questions:', e);
    }
  }, []);

  // 2. Fetch company data when selectedCompany changes:
  // If selectedCompany is null, fetch all-questions.json (all N questions)
  // If selectedCompany is a company slug, fetch <slug>.json (X specific questions)
  useEffect(() => {
    setIsLoading(true);
    const targetFile = selectedCompany ? `${selectedCompany}.json` : 'all-questions.json';
    fetch(`/data/companies/${targetFile}`)
      .then(res => res.json())
      .then(data => {
        setCompanyData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(`Failed to load ${targetFile}:`, err);
        setIsLoading(false);
      });
  }, [selectedCompany]);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCompany, selectedTimeframe, selectedTopic, minFrequency, difficultyFilter, statusFilter, searchQuery, sortBy]);

  // Toggle "Make As Done"
  const toggleDone = (link) => {
    setDoneQuestions(prev => {
      const next = new Set(prev);
      if (next.has(link)) {
        next.delete(link);
      } else {
        next.add(link);
      }
      try {
        localStorage.setItem('leeting_done_company_questions', JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error('Failed to persist done questions:', e);
      }
      return next;
    });
  };

  // Safe Mark Done Click: Locks action and triggers prompt if not signed in
  const handleMarkDoneClick = (link, title) => {
    if (!isCloudConnected) {
      setTargetQuestionTitle(title || 'Interview Question');
      setAuthPromptOpen(true);
      setAuthToast('🔒 Sign in required to mark questions as solved and sync your progress.');
      return;
    }
    toggleDone(link);
  };

  // Toggle company selection: clicking an active company deselects it back to null
  const handleCompanyToggle = (slug) => {
    setSelectedCompany(prev => (prev === slug ? null : slug));
  };

  // Raw questions for current timeframe (N questions if no company, X questions if company selected)
  const rawQuestions = useMemo(() => {
    if (!companyData || !companyData.timeframes) return [];
    return companyData.timeframes[selectedTimeframe] || [];
  }, [companyData, selectedTimeframe]);

  // Filtered and sorted questions
  const filteredQuestions = useMemo(() => {
    return rawQuestions
      .filter(q => {
        // Search query
        if (debouncedSearch) {
          const query = debouncedSearch.toLowerCase();
          const matchTitle = q.title.toLowerCase().includes(query);
          const matchTopic = q.topics && q.topics.some(t => t.toLowerCase().includes(query));
          const matchCompany = q.companies && q.companies.some(c => c.toLowerCase().includes(query));
          if (!matchTitle && !matchTopic && !matchCompany) return false;
        }

        // Topic filter
        if (selectedTopic !== 'all') {
          if (!q.topics || !q.topics.includes(selectedTopic)) return false;
        }

        // Frequency threshold
        if (minFrequency > 0 && q.frequency < minFrequency) return false;

        // Difficulty filter
        if (difficultyFilter !== 'all') {
          if (q.difficulty.toLowerCase() !== difficultyFilter.toLowerCase()) return false;
        }

        // Done status filter
        const isDone = doneQuestions.has(q.link);
        if (statusFilter === 'done' && !isDone) return false;
        if (statusFilter === 'pending' && isDone) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'freq-desc') return b.frequency - a.frequency;
        if (sortBy === 'freq-asc') return a.frequency - b.frequency;
        if (sortBy === 'title-asc') return a.title.localeCompare(b.title);
        if (sortBy === 'diff-asc') {
          const map = { Easy: 1, Medium: 2, Hard: 3 };
          return (map[a.difficulty] || 2) - (map[b.difficulty] || 2);
        }
        return 0;
      });
  }, [rawQuestions, debouncedSearch, selectedTopic, minFrequency, difficultyFilter, statusFilter, sortBy, doneQuestions]);

  // Target Progress Statistics:
  // If no company selected -> total is N (all available questions)
  // If company selected -> total is X (company-specific questions)
  const stats = useMemo(() => {
    const total = rawQuestions.length;
    const completed = rawQuestions.filter(q => doneQuestions.has(q.link)).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [rawQuestions, doneQuestions]);

  // Paginated questions
  const totalPages = Math.ceil(filteredQuestions.length / pageSize) || 1;
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Company list from index or fallback
  const companiesList = indexData?.companies || [
    { name: 'Google', slug: 'google' },
    { name: 'Meta', slug: 'meta' },
    { name: 'Amazon', slug: 'amazon' },
    { name: 'Microsoft', slug: 'microsoft' },
    { name: 'Apple', slug: 'apple' },
    { name: 'Uber', slug: 'uber' },
    { name: 'Netflix', slug: 'netflix' },
    { name: 'Bloomberg', slug: 'bloomberg' },
  ];

  // All 173 Topics list (completely rendered, no slice)
  const availableTopics = indexData?.allTopics || [];

  // Total global count across all companies for current timeframe
  const allCompaniesCount = indexData?.totalQuestions?.[selectedTimeframe] ?? rawQuestions.length;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. Header Banner & Progress Hub */}
      <div className="relative rounded-3xl bg-white dark:bg-gradient-to-br dark:from-[#121622]/90 dark:via-[#0e121a]/80 dark:to-[#090b10]/95 border border-slate-200 dark:border-white/[0.08] p-6 md:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-leeting-orange/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-leeting-orange/15 border border-leeting-orange/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" />
              <span>
                {selectedCompany 
                  ? `${companyData?.name || 'Company'} Interview Track`
                  : 'Company Wise Interview Prep Matrix • Master Catalog'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>
                {selectedCompany 
                  ? `${companyData?.name || 'Company'} Interview Questions` 
                  : 'All Available Interview Questions'}
              </span>
              {selectedCompany && (
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="text-xs font-normal text-slate-500 dark:text-slate-400 hover:text-leeting-orange px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] transition-colors"
                  title="Deselect company to view all questions"
                >
                  ✕ View All
                </button>
              )}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {selectedCompany ? (
                <>Showing questions frequently asked in <span className="text-slate-900 dark:text-slate-200 font-semibold">{companyData?.name}</span> interviews. Click the company pill again to return to all {allCompaniesCount} available questions.</>
              ) : (
                <>Displaying all <span className="text-slate-900 dark:text-slate-200 font-semibold">{stats.total} available questions</span> across all companies. Select any company pill below to filter specific questions asked by that employer.</>
              )}
            </p>
          </div>

          {/* Solved Progress Metric Widget (Target Progress) */}
          <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] rounded-2xl p-4 md:p-5 shrink-0 min-w-[260px] space-y-3 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <BookmarkCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>
                  {selectedCompany ? `${companyData?.name || 'Company'} Target Progress` : 'Target Progress'}
                </span>
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {stats.completed} / {stats.total} Solved
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-white/[0.06] rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>{stats.percentage}% Completed</span>
              <span>{stats.total - stats.completed} Remaining</span>
            </div>

            {!isCloudConnected && (
              <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px]">
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Sign In to sync solved progress
                </span>
                <Link href="/sign-in" className="text-amber-600 dark:text-amber-400 font-bold hover:underline">
                  Sign In ↗
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Primary Filter Controls Bar */}
      <div className="space-y-4">
        
        {/* Company Selection Row: Fixed Label + Horizontally Scrollable Pills */}
        <div className="flex items-center gap-2.5 w-full">
          {/* Static "Company:" Tag Kept OUTSIDE the Scrolling Area */}
          <div className="shrink-0 pb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1 select-none">
              <Building2 className="w-3.5 h-3.5 text-leeting-orange" />
              Company:
            </span>
          </div>

          {/* Horizontally Scrollable Pills Area */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 flex-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* "All Questions" default unselected pill */}
            <button
              onClick={() => setSelectedCompany(null)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border ${
                selectedCompany === null
                  ? 'bg-leeting-orange text-slate-950 font-bold border-leeting-orange shadow-lg shadow-orange-500/20 scale-105'
                  : 'bg-slate-100 dark:bg-[#0f131c]/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-200/70 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Questions</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedCompany === null ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-black/5 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
              }`}>
                {indexData?.totalQuestions?.[selectedTimeframe] ?? '3050'}
              </span>
            </button>

            {/* Company pills (toggleable: clicking active company deselects back to null) */}
            {companiesList.map(comp => {
              const isSelected = selectedCompany === comp.slug;
              return (
                <button
                  key={comp.slug}
                  onClick={() => handleCompanyToggle(comp.slug)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-leeting-orange text-slate-950 font-bold border-leeting-orange shadow-lg shadow-orange-500/20 scale-105 ring-2 ring-amber-400/30'
                      : 'bg-slate-100 dark:bg-[#0f131c]/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-200/70 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{comp.name}</span>
                  {comp.questionCounts && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-slate-950/20 text-slate-900 font-bold' : 'bg-black/5 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
                    }`}>
                      {comp.questionCounts[selectedTimeframe] ?? comp.questionCounts['all']}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframe Tabs & Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          
          {/* Timeframe Tabs (30d, 3m, 6m, All) */}
          <div className="md:col-span-6 flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-[#0c1018]/80 border border-slate-200 dark:border-white/[0.08] backdrop-blur-md">
            {TIMEFRAMES.map(tf => {
              const isActive = selectedTimeframe === tf.key;
              const count = companyData?.timeframes?.[tf.key]?.length ?? 
                (selectedCompany === null ? (indexData?.totalQuestions?.[tf.key] ?? 0) : 0);

              return (
                <button
                  key={tf.key}
                  onClick={() => setSelectedTimeframe(tf.key)}
                  className={`flex-1 py-1.5 px-2 sm:px-3 rounded-xl transition-all duration-200 text-center flex items-center justify-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-leeting-orange text-slate-950 font-bold shadow-md shadow-orange-500/20 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400 dark:text-slate-500'}`} />
                  <div className="flex flex-col text-left leading-tight shrink-0">
                    <span className="text-[11px] sm:text-xs font-bold leading-tight">{tf.line1}</span>
                    <span className={`text-[10px] leading-tight ${isActive ? 'text-slate-950/80 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {tf.line2}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full shrink-0 font-bold ${
                      isActive 
                        ? 'bg-slate-950/20 text-slate-950' 
                        : 'bg-black/5 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder={
                selectedCompany 
                  ? `Search ${companyData?.name || 'company'} questions by title or topic...`
                  : `Search all ${stats.total} questions by title, topic, or company...`
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-[#0c1018]/80 border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-leeting-orange/60 focus:ring-1 focus:ring-leeting-orange/40 transition-all backdrop-blur-md"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Controls: Frequency, Topic (All 173 Topics), Difficulty, Status, Sorting */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          
          {/* 1. Frequency Threshold */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-amber-500 dark:text-amber-400" />
              Frequency
            </label>
            <select
              value={minFrequency}
              onChange={(e) => setMinFrequency(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-400/50"
            >
              {FREQ_THRESHOLDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* 2. Topic Filter (All 173 topics rendered without slice) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-leeting-orange" />
                Topic ({availableTopics.length})
              </span>
              {selectedTopic !== 'all' && (
                <button 
                  onClick={() => setSelectedTopic('all')}
                  className="text-[9px] text-leeting-orange hover:underline lowercase"
                >
                  clear
                </button>
              )}
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-leeting-orange/50"
            >
              <option value="all">All Topics ({availableTopics.length})</option>
              {availableTopics.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* 3. Difficulty Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-500 dark:text-blue-400" />
              Difficulty
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-400/50"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          {/* 4. Solved Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-400/50"
            >
              <option value="all">All Questions</option>
              <option value="pending">Pending Only ({stats.total - stats.completed})</option>
              <option value="done">Completed Only ({stats.completed})</option>
            </select>
          </div>

          {/* 5. Sorting */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-purple-500 dark:text-purple-400" />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-400/50"
            >
              <option value="freq-desc">Highest Frequency</option>
              <option value="freq-asc">Lowest Frequency</option>
              <option value="title-asc">Problem Title (A-Z)</option>
              <option value="diff-asc">Difficulty (Easy → Hard)</option>
            </select>
          </div>

          {/* 6. Page Size & Reset */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Per Page</span>
              {(selectedTopic !== 'all' || minFrequency > 0 || difficultyFilter !== 'all' || statusFilter !== 'all' || searchQuery || selectedCompany !== null) && (
                <button
                  onClick={() => {
                    setSelectedCompany(null);
                    setSelectedTopic('all');
                    setMinFrequency(0);
                    setDifficultyFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-leeting-orange hover:underline text-[9px] lowercase font-semibold"
                >
                  reset all
                </button>
              )}
            </label>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#0f131c] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-slate-400/50"
            >
              <option value={25}>25 Questions</option>
              <option value={50}>50 Questions</option>
              <option value={100}>100 Questions</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. The Core Table: All Question | Leetcode Link | Frequency | Make As Done | Topic Name */}
      <div className="rounded-3xl border border-slate-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0a0d14]/85 backdrop-blur-xl overflow-hidden shadow-2xl transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th scope="col" className="py-3.5 px-4 w-12 text-center">#</th>
                <th scope="col" className="py-3.5 px-4">All Question</th>
                <th scope="col" className="py-3.5 px-4 w-36">Leetcode Link</th>
                <th scope="col" className="py-3.5 px-4 w-40">Frequency</th>
                <th scope="col" className="py-3.5 px-4 w-36 text-center">Make As Done</th>
                <th scope="col" className="py-3.5 px-4 w-64">Topic Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-xs">
              {showSkeleton ? (
                // 2-Second Timeout Skeleton Rows
                Array.from({ length: Math.min(10, pageSize) }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="w-5 h-4 bg-slate-200 dark:bg-white/[0.06] rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-52 sm:w-72 h-4 bg-slate-200 dark:bg-white/[0.06] rounded-md mb-2" />
                      <div className="flex gap-2">
                        <div className="w-14 h-3.5 bg-slate-100 dark:bg-white/[0.04] rounded-full" />
                        <div className="w-16 h-3.5 bg-slate-100 dark:bg-white/[0.04] rounded-full" />
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-24 h-7 bg-slate-200 dark:bg-white/[0.06] rounded-xl" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="w-28 space-y-1.5">
                        <div className="w-10 h-3 bg-slate-200 dark:bg-white/[0.06] rounded" />
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.04] rounded-full" />
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="w-24 h-7 bg-slate-200 dark:bg-white/[0.06] rounded-xl mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-1.5">
                        <div className="w-16 h-5 bg-slate-200 dark:bg-white/[0.06] rounded-md" />
                        <div className="w-14 h-5 bg-slate-100 dark:bg-white/[0.04] rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedQuestions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500 dark:text-slate-400">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                        <Filter className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">No questions match your filters</p>
                      <p className="text-xs text-slate-500">
                        Try lowering your frequency threshold or clearing the search query.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedCompany(null);
                          setSelectedTopic('all');
                          setMinFrequency(0);
                          setDifficultyFilter('all');
                          setStatusFilter('all');
                          setSearchQuery('');
                        }}
                        className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-transparent transition-colors"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                // Data Rows with Progressive One-by-One Staggered Entrance
                paginatedQuestions.map((q, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isDone = doneQuestions.has(q.link);

                  return (
                    <tr 
                      key={q.link || q.title} 
                      style={{ animationDelay: `${Math.min(idx * 45, 1200)}ms` }}
                      className={`animate-row-fade-in group hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors duration-150 ${
                        isDone ? 'bg-emerald-500/[0.04] dark:bg-emerald-950/10' : ''
                      }`}
                    >
                      {/* Row Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-slate-400 dark:text-slate-500 text-[11px]">
                        {globalIdx}
                      </td>

                      {/* 1. All Question (Title, Difficulty, Acceptance, Companies) */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold tracking-tight transition-all truncate ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-slate-100 group-hover:text-amber-500 dark:group-hover:text-amber-400'
                            }`}>
                              {q.title}
                            </span>
                            {q.frequency >= 85 && (
                              <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title="High Frequency Question">
                                <Flame className="w-2.5 h-2.5 fill-amber-500 dark:fill-amber-400" />
                                Hot
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px]">
                            {/* Difficulty Badge */}
                            <span className={`font-bold px-2 py-0.5 rounded-full border ${
                              q.difficulty.toLowerCase() === 'easy'
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : q.difficulty.toLowerCase() === 'medium'
                                ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                            }`}>
                              {q.difficulty}
                            </span>

                            {q.acceptance && (
                              <span className="text-slate-500 font-mono">
                                Acc: {q.acceptance}
                              </span>
                            )}

                            {/* Show companies asking this question when in "All Questions" view */}
                            {!selectedCompany && q.companies && q.companies.length > 0 && (
                              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
                                <Building2 className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                                <span>{q.companies.slice(0, 3).join(', ')}{q.companies.length > 3 ? ` +${q.companies.length - 3}` : ''}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Leetcode Link */}
                      <td className="py-3.5 px-4">
                        <a
                          href={q.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400 border border-slate-200 dark:border-white/[0.08] hover:border-amber-500/40 text-slate-700 dark:text-slate-300 text-xs transition-all group/link"
                        >
                          <span className="font-mono text-[11px]">Solve Problem</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-amber-500 dark:group-hover/link:text-amber-400 transition-colors" />
                        </a>
                      </td>

                      {/* 3. Frequency */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5 w-32">
                          <div className="flex items-center justify-between text-xs font-mono font-bold">
                            <span className={
                              q.frequency >= 80 ? 'text-amber-600 dark:text-amber-400' :
                              q.frequency >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                            }>
                              {q.frequency.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                q.frequency >= 80 ? 'bg-gradient-to-r from-amber-500 to-leeting-orange' :
                                q.frequency >= 50 ? 'bg-gradient-to-r from-teal-500 to-emerald-400' :
                                'bg-slate-400 dark:bg-slate-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(8, q.frequency))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 4. Make As Done */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleMarkDoneClick(q.link, q.title)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border ${
                            !isCloudConnected
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 shadow-sm cursor-pointer'
                              : isDone
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 shadow-sm hover:bg-emerald-500/25'
                              : 'bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-white/[0.08]'
                          }`}
                          title={!isCloudConnected ? "Locked: Sign in required to mark questions done" : (isDone ? "Mark as pending" : "Mark as done")}
                        >
                          {!isCloudConnected ? (
                            <>
                              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Mark Done</span>
                            </>
                          ) : isDone ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Done ✓</span>
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5 text-slate-400" />
                              <span>Mark Done</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* 5. Topic Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {q.topics && q.topics.slice(0, 3).map(topic => (
                            <button
                              key={topic}
                              onClick={() => setSelectedTopic(topic)}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-[10px] font-medium border border-slate-200 dark:border-white/[0.06] transition-colors truncate"
                            >
                              {topic}
                            </button>
                          ))}
                          {q.topics && q.topics.length > 3 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center font-mono">
                              +{q.topics.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/70 dark:bg-black/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {filteredQuestions.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span> to <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, filteredQuestions.length)}
            </span> of <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
              {filteredQuestions.length}
            </span> questions
            {filteredQuestions.length !== rawQuestions.length && (
              <span className="text-slate-400 dark:text-slate-500 ml-1">
                (filtered from {rawQuestions.length})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || showSkeleton}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-mono text-xs text-slate-600 dark:text-slate-300">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || showSkeleton}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-sm"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SignIn Prompt Modal when user clicks locked "Mark Done" while signed out */}
      {mounted && authPromptOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 dark:bg-black/85 backdrop-blur-xl animate-fadeIn">
          <div className="glass-obsidian w-full max-w-md p-6 sm:p-7 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden text-center animate-scaleUp">
            {/* Ambient amber backglow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close button */}
            <button
              onClick={() => setAuthPromptOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Lock Icon Badge */}
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-500 shadow-[0_0_20px_rgba(255,161,22,0.25)]">
              <Lock className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Mark as Done
            </h3>

            <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              &quot;Mark Done&quot; is locked for guest users. Please sign in to your Leeting account to mark questions as solved, track company-wise completion rates, and sync your interview preparation across all devices.
            </p>

            {targetQuestionTitle && (
              <div className="mt-3 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
                Question: {targetQuestionTitle}
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 justify-center">
              <Link
                href="/sign-in"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#ffa116] hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/25 transition-all hover:scale-105"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In to Continue</span>
              </Link>

              <button
                onClick={() => setAuthPromptOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Floating Action Feedback Toast */}
      {authToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl animate-fadeIn border border-amber-300">
          <span>{authToast}</span>
          <Link href="/sign-in" className="underline font-black hover:opacity-80">
            Sign In ↗
          </Link>
          <button onClick={() => setAuthToast(null)} className="p-0.5 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
