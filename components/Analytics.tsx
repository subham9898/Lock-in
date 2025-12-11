import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { Task, ScheduleItem, UserProfile } from '../types';
import {
  Zap,
  CheckCircle2,
  Timer,
  Flame,
  Coffee,
  TrendingUp,
  TrendingDown,
  Lock,
  Unlock,
  Crown,
  Filter,
  Calendar,
  ArrowRight,
  BrainCircuit,
  AlertTriangle
} from 'lucide-react';
import { Button } from './Button';

interface AnalyticsProps {
  tasks: Task[];
  schedule: ScheduleItem[];
  userProfile: UserProfile;
}

type TimeRange = 'Today' | '1 Week' | '4 Weeks';
type ViewTab = 'Overview' | 'Advanced';

// Mock data for heatmaps/funnels since backend doesn't exist yet
const MOCK_HEATMAP = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 5 }, (_, hour) => ({
    day,
    hour: 8 + hour * 3, // rough buckets
    value: Math.floor(Math.random() * 100)
  }))
).flat();

const MOCK_FUNNEL = [
  { name: 'Started', value: 100, fill: '#8b5cf6' },
  { name: '25% Locked', value: 85, fill: '#a78bfa' },
  { name: '50% Deep', value: 60, fill: '#c084fc' },
  { name: 'Completed', value: 45, fill: '#d8b4fe' },
];

export const Analytics: React.FC<AnalyticsProps> = ({ tasks, schedule, userProfile }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('Today');
  const [activeTab, setActiveTab] = useState<ViewTab>('Overview');
  const [isPro, setIsPro] = useState(false); // Simulating Pro State
  const [showPaywall, setShowPaywall] = useState(false);

  // --- Helper Functions ---
  const parseDate = (dateStr?: string) => dateStr ? new Date(dateStr) : new Date();
  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
  const isWithinLastDays = (date: Date, days: number) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - days);
    return date >= past && date <= today;
  };

  // --- Data aggregation ---
  const currentStats = useMemo(() => {
    const today = new Date();
    let filteredTasks: Task[] = [];

    if (timeRange === 'Today') {
      filteredTasks = tasks.filter(t => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), today));
    } else if (timeRange === '1 Week') {
      filteredTasks = tasks.filter(t => t.completed && t.completedAt && isWithinLastDays(new Date(t.completedAt), 7));
    } else {
      filteredTasks = tasks.filter(t => t.completed && t.completedAt && isWithinLastDays(new Date(t.completedAt), 28));
    }

    const focusTimeMinutes = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || t.durationMinutes || 0), 0);
    const tasksCompleted = filteredTasks.length;
    const sessions = filteredTasks.length;
    const breakTimeMinutes = Math.floor(focusTimeMinutes * 0.2);

    return { focusTimeMinutes, tasksCompleted, sessions, breakTimeMinutes };
  }, [tasks, timeRange]);

  const prevStats = useMemo(() => {
    const today = new Date();
    let filteredTasks: Task[] = [];

    if (timeRange === 'Today') {
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      filteredTasks = tasks.filter(t => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), yesterday));
    } else if (timeRange === '1 Week') {
      const end = new Date(); end.setDate(today.getDate() - 7);
      const start = new Date(); start.setDate(today.getDate() - 14);
      filteredTasks = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= start && new Date(t.completedAt) < end);
    } else {
      const end = new Date(); end.setDate(today.getDate() - 28);
      const start = new Date(); start.setDate(today.getDate() - 56);
      filteredTasks = tasks.filter(t => t.completed && t.completedAt && new Date(t.completedAt) >= start && new Date(t.completedAt) < end);
    }

    const focusTimeMinutes = filteredTasks.reduce((acc, t) => acc + (t.timeSpent || t.durationMinutes || 0), 0);
    const tasksCompleted = filteredTasks.length;
    const sessions = filteredTasks.length;
    const breakTimeMinutes = Math.floor(focusTimeMinutes * 0.2);

    return { focusTimeMinutes, tasksCompleted, sessions, breakTimeMinutes };
  }, [tasks, timeRange]);

  const formatDuration = (mins: number) => {
    if (mins === 0) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getPercentChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - prev) / prev) * 100);
  };

  // --- Chart Data ---
  const chartData = useMemo(() => {
    const days = timeRange === 'Today' ? 7 : timeRange === '1 Week' ? 7 : 28;
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayTasks = tasks.filter(t => t.completed && t.completedAt && isSameDay(new Date(t.completedAt), d));
      const totalMinutes = dayTasks.reduce((acc, t) => acc + (t.timeSpent || t.durationMinutes || 0), 0);

      data.push({
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: totalMinutes,
        tasks: dayTasks.length
      });
    }
    return data;
  }, [tasks, timeRange]);

  // --- Components ---

  const StatCard = ({ title, value, icon: Icon, trend, gradient }: any) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} shadow-lg border border-white/10 group hover:scale-[1.02] transition-transform duration-300`}>
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
        <Icon className="w-16 h-16 text-white rotate-12" />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <h4 className="text-sm font-bold text-white/90 uppercase tracking-wider font-mono">{title}</h4>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-3xl font-bold text-white font-mono tracking-tight mb-2">
          {value}
        </div>
        <div className="flex items-center gap-2">
          {trend > 0 ? <TrendingUp className="w-3 h-3 text-white" /> : <TrendingDown className="w-3 h-3 text-white/80" />}
          <span className="text-xs font-bold text-white font-mono">{Math.abs(trend)}%</span>
        </div>
      </div>
    </div>
  );

  const PaywallOverlay = () => (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300 rounded-3xl">
      <div className="bg-gradient-to-br from-primary to-secondary p-4 rounded-full mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-pulse">
        <Crown className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white font-mono uppercase mb-2">Unlock Advanced Intel</h3>
      <p className="text-zinc-300 max-w-md mb-8 font-mono text-sm leading-relaxed">
        Gain access to deep focus patterns, bottleneck analysis, unlimted history, and AI coaching. Level up your productivity game.
      </p>
      <ul className="text-left space-y-3 mb-8 text-sm text-zinc-300 font-mono border border-zinc-700 bg-black/40 p-6 rounded-xl w-full max-w-sm">
        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Custom Date Ranges</li>
        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Drop-off Funnel Analysis</li>
        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Coach Suggestions</li>
        <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> CSV Data Export</li>
      </ul>
      <Button onClick={() => { setIsPro(true); setShowPaywall(false); }} className="px-8 py-6 text-lg shadow-lg shadow-primary/20">
        UPGRADE TO PRO <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
      <p className="mt-4 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">14-Day Money Back Guarantee</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 pb-20">

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground font-mono uppercase tracking-tight flex items-center gap-3">
            LEADERBOARD
            {isPro && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded border border-primary/30 align-super">PRO ACTIVE</span>}
          </h2>
          <p className="text-muted text-sm font-mono mt-1">Analyze your performance and optimization metrics.</p>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('Overview')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 ${activeTab === 'Overview'
                ? 'bg-surface-highlight text-foreground shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('Advanced')}
            className={`px-4 py-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-2 ${activeTab === 'Advanced'
                ? 'bg-primary text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300'
              }`}
          >
            Advanced
            {!isPro && <Lock className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* --- OVERVIEW TAB --- */}
      {activeTab === 'Overview' && (
        <div className="space-y-6 animate-in slide-in-from-left duration-500">

          {/* Range Selector */}
          <div className="flex justify-end">
            <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              {(['Today', '1 Week', '4 Weeks'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold font-mono transition-all ${timeRange === range
                      ? 'bg-zinc-700 text-white'
                      : 'text-zinc-500 hover:text-white'
                    }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <StatCard
              title="Focus Time" value={formatDuration(currentStats.focusTimeMinutes)}
              icon={Zap} trend={getPercentChange(currentStats.focusTimeMinutes, prevStats.focusTimeMinutes)}
              gradient="bg-gradient-to-br from-orange-400 to-yellow-500"
            />
            <StatCard
              title="Tasks Done" value={currentStats.tasksCompleted}
              icon={CheckCircle2} trend={getPercentChange(currentStats.tasksCompleted, prevStats.tasksCompleted)}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-400"
            />
            <StatCard
              title="Sessions" value={currentStats.sessions}
              icon={Timer} trend={getPercentChange(currentStats.sessions, prevStats.sessions)}
              gradient="bg-gradient-to-br from-blue-500 to-cyan-400"
            />
            <StatCard
              title="Streak" value={`${userProfile.streak} Days`}
              icon={Flame} trend={0}
              gradient="bg-gradient-to-br from-red-500 to-orange-600"
            />
            <StatCard
              title="Break Time" value={formatDuration(currentStats.breakTimeMinutes)}
              icon={Coffee} trend={getPercentChange(currentStats.breakTimeMinutes, prevStats.breakTimeMinutes)}
              gradient="bg-gradient-to-br from-pink-500 to-rose-400"
            />
          </div>

          {/* Main Chart */}
          <div className="bg-zinc-950 rounded-3xl border border-zinc-800 p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

            <h3 className="text-lg font-bold text-foreground font-mono uppercase mb-8 relative z-10 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Productivity Flow
            </h3>

            <div className="h-[300px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="name" stroke="#52525b"
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} dy={10}
                  />
                  <YAxis
                    stroke="#52525b"
                    tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false} tickLine={false} dx={-10}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', border: '1px solid #3f3f46', borderRadius: '12px', color: '#fff' }}
                    labelStyle={{ fontFamily: 'monospace', color: '#a1a1aa', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="minutes" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* --- ADVANCED TAB --- */}
      {activeTab === 'Advanced' && (
        <div className="relative space-y-6 animate-in slide-in-from-right duration-500">
          {(!isPro && !showPaywall) && (
            <div onClick={() => setShowPaywall(true)} className="absolute inset-0 z-40 bg-background/50 backdrop-blur-[2px] cursor-pointer flex items-center justify-center group">
              <div className="bg-primary text-white font-bold font-mono px-6 py-3 rounded-full flex items-center gap-2 shadow-xl group-hover:scale-110 transition-transform">
                <Lock className="w-4 h-4" /> Click to Unlock Pro Insights
              </div>
            </div>
          )}

          {showPaywall && <PaywallOverlay />}

          {/* Advanced Filters */}
          <div className="flex flex-wrap gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
            <Button variant="outline" className="text-xs h-9 bg-zinc-900 border-zinc-700">
              <Calendar className="w-3 h-3 mr-2 text-zinc-400" /> Date Range: Custom
            </Button>
            <Button variant="outline" className="text-xs h-9 bg-zinc-900 border-zinc-700">
              <Filter className="w-3 h-3 mr-2 text-zinc-400" /> Filter: All Sessions
            </Button>
            <div className="ml-auto text-[10px] text-zinc-500 font-mono uppercase flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Live Data
            </div>
          </div>

          {/* Row 1: Focus Patterns (Heatmap) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-foreground font-mono flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" /> Focus Heatmap
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">Intensity of focus by hour of day</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-widest">Golden Hours</p>
                  <p className="text-lg font-bold text-orange-400 font-mono">7 AM — 10 AM</p>
                  <p className="text-[10px] text-emerald-500 font-mono">+32% Productivity</p>
                </div>
              </div>

              {/* Fake Grid Visualization */}
              <div className="grid grid-cols-8 gap-1 h-48">
                <div className="flex flex-col justify-between text-[9px] text-zinc-600 font-mono py-1">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className="grid grid-rows-7 gap-1">
                    {Array.from({ length: 7 }).map((_, j) => {
                      const opacity = Math.random();
                      return (
                        <div
                          key={`${i}-${j}`}
                          className="rounded-sm w-full h-full transition-all hover:scale-125"
                          style={{
                            backgroundColor: `rgba(249, 115, 22, ${opacity > 0.2 ? opacity : 0.05})`, // Orange tint
                          }}
                          title={`Hour: ${i}:00, Activity: ${Math.floor(opacity * 100)}%`}
                        ></div>
                      )
                    })}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-zinc-600 font-mono">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
              </div>
            </div>

            {/* Session Quality Funnel */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl flex flex-col">
              <h3 className="font-bold text-foreground font-mono flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-purple-500" /> Retention Funnel
              </h3>
              <div className="flex-1 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart layout="vertical" data={MOCK_FUNNEL} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontFamily: 'monospace', fill: '#71717a' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#09090b', borderRadius: '8px', border: '1px solid #333' }} />
                    <Bar dataKey="value" barSize={20} radius={[0, 4, 4, 0]}>
                      {MOCK_FUNNEL.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-zinc-900/50 rounded-lg p-3 mt-4 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-mono uppercase mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" /> Common Drop-off
                </p>
                <p className="text-xs text-zinc-300 font-mono">Most sessions end at <span className="text-white font-bold">12 mins</span> due to distractions.</p>
              </div>
            </div>
          </div>

          {/* Row 2: Deep Trends & Coach */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deep trends placeholder */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-xl">
              <h3 className="font-bold text-foreground font-mono flex items-center gap-2 mb-6">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> 30-Day Trend
              </h3>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono">Avg Daily Focus</p>
                    <p className="text-2xl font-bold text-white font-mono">4h 12m</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">+12% vs last month</p>
                  </div>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[65%]"></div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase">Completion</p>
                    <p className="text-xs font-bold text-emerald-400">88%</p>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase">Interrupts</p>
                    <p className="text-xs font-bold text-red-400">2.4/hr</p>
                  </div>
                  <div className="bg-zinc-900 p-2 rounded border border-zinc-800 text-center">
                    <p className="text-[9px] text-zinc-500 uppercase">Deep Work</p>
                    <p className="text-xs font-bold text-purple-400">65%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Coach */}
            <div className="bg-gradient-to-br from-indigo-950 to-black border border-indigo-900/50 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] translate-x-1/2 -translate-y-1/2"></div>

              <h3 className="font-bold text-white font-mono flex items-center gap-2 mb-6 relative z-10">
                <BrainCircuit className="w-4 h-4 text-indigo-400" /> AI Coach
              </h3>

              <div className="space-y-3 relative z-10">
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex gap-3 hover:bg-white/10 transition-colors">
                  <div className="mt-0.5"><CheckCircle2 className="w-4 h-4 text-indigo-400" /></div>
                  <div>
                    <p className="text-xs text-indigo-200 font-bold mb-0.5">Late Night Power</p>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">You complete 40% more tasks after 8 PM. Consider shifting study blocks to evening.</p>
                  </div>
                </div>
                <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex gap-3 hover:bg-white/10 transition-colors">
                  <div className="mt-0.5"><Zap className="w-4 h-4 text-yellow-400" /></div>
                  <div>
                    <p className="text-xs text-yellow-200 font-bold mb-0.5">Break Rhythm</p>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">Your focus drops after 45m. Try the 45/15 Pomodoro split instead of 25/5.</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <span className="text-[9px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded border border-indigo-500/30 uppercase tracking-wider">Night Owl Badge</span>
                  <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded border border-emerald-500/30 uppercase tracking-wider">Deep Focus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
