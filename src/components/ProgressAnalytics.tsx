import React, { useState } from 'react';
import {
  TrendingUp,
  Trophy,
  Calendar,
  Clock,
  Dumbbell,
  Scale,
  Trash2,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  WorkoutSession,
  PersonalRecord,
  UnitSystem,
  MuscleGroup,
} from '../types/fitness';
import { formatWeight, MUSCLE_GROUP_LABELS } from '../utils/storage';

interface ProgressAnalyticsProps {
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  unit: UnitSystem;
  onDeleteSession: (sessionId: string) => void;
  onViewSessionDetails?: (session: WorkoutSession) => void;
}

export const ProgressAnalytics: React.FC<ProgressAnalyticsProps> = ({
  sessions,
  prs,
  unit,
  onDeleteSession,
}) => {
  const [selectedLiftFor1RM, setSelectedLiftFor1RM] = useState<string>(
    prs[0]?.exerciseId || 'ex-bench-press'
  );
  const [expandedSessionIds, setExpandedSessionIds] = useState<Record<string, boolean>>({});

  // Sort sessions chronologically
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Compute all-time aggregates
  const totalLifetimeVolume = sortedSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
  const totalCompletedWorkouts = sortedSessions.filter((s) => s.completed).length;
  const totalLifetimeHours = Math.round(
    sortedSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60
  );

  // Extract volume history points for the chart
  const volumeDataPoints = sortedSessions.map((s) => ({
    date: s.date,
    title: s.title,
    volume: s.totalVolume,
  }));

  // Max volume for scaling SVG chart
  const maxVolume = Math.max(...volumeDataPoints.map((p) => p.volume), 1000);

  // Extract 1RM progression data for selected exercise across all workouts
  const liftHistory: Array<{ date: string; weight: number; reps: number; estimated1RM: number }> = [];

  sortedSessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      if (ex.exerciseId === selectedLiftFor1RM) {
        ex.sets.forEach((set) => {
          if (set.completed && set.weight > 0 && set.reps > 0 && set.type !== 'warmup') {
            const e1rm = Math.round(set.weight * (1 + set.reps / 30));
            liftHistory.push({
              date: s.date,
              weight: set.weight,
              reps: set.reps,
              estimated1RM: e1rm,
            });
          }
        });
      }
    });
  });

  // Calculate highest 1RM for each date
  const dateToMax1RM: Record<string, number> = {};
  liftHistory.forEach((item) => {
    if (!dateToMax1RM[item.date] || item.estimated1RM > dateToMax1RM[item.date]) {
      dateToMax1RM[item.date] = item.estimated1RM;
    }
  });

  const oneRMChartPoints = Object.entries(dateToMax1RM).map(([date, e1rm]) => ({
    date,
    e1rm,
  }));

  const max1RM = Math.max(...oneRMChartPoints.map((p) => p.e1rm), 100);

  // Muscle balance ratio (Push vs Pull vs Legs sets)
  let pushSets = 0;
  let pullSets = 0;
  let legsSets = 0;

  sortedSessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      const completed = ex.sets.filter((st) => st.completed).length;
      if (['chest', 'shoulders', 'triceps'].includes(ex.primaryMuscle)) {
        pushSets += completed;
      } else if (['back', 'biceps'].includes(ex.primaryMuscle)) {
        pullSets += completed;
      } else if (['legs_quads', 'legs_hamstrings', 'glutes', 'calves'].includes(ex.primaryMuscle)) {
        legsSets += completed;
      }
    });
  });

  const totalSplitSets = Math.max(pushSets + pullSets + legsSets, 1);
  const pushRatio = Math.round((pushSets / totalSplitSets) * 100);
  const pullRatio = Math.round((pullSets / totalSplitSets) * 100);
  const legsRatio = Math.round((legsSets / totalSplitSets) * 100);

  const toggleSessionExpand = (id: string) => {
    setExpandedSessionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-5">
        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
          <span>Progress & Analytics</span>
          <span aria-hidden="true">·</span>
          <span>Hypertrophy Volume & 1RM Progression</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          Strength & Volume Progression
        </h1>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Total Volume Lifted</span>
            <Scale className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {totalLifetimeVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Accumulated {unit}
          </div>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Logged Workouts</span>
            <Calendar className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {totalCompletedWorkouts}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Full sessions executed
          </div>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Gym Time Invested</span>
            <Clock className="h-3.5 w-3.5 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            ~{totalLifetimeHours}h
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Under active tension
          </div>
        </div>

        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
            <span>Active PRs</span>
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {prs.length}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">
            Tracked personal bests
          </div>
        </div>
      </div>

      {/* Chart 1: Workout Volume Progression */}
      <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase">
              Progressive Overload: Session Volume Curve
            </h2>
            <p className="text-xs text-neutral-400">
              Total tonnage lifted per session across chronological workout dates
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-500">
            Targeting gradual weekly volume growth
          </span>
        </div>

        {/* Custom SVG Line & Bar Chart */}
        <div className="h-56 w-full pt-4">
          {volumeDataPoints.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-neutral-500">
              Log workouts to display volume progression.
            </div>
          ) : (
            <div className="h-full flex items-end gap-3 px-2 pb-6 border-b border-neutral-800 relative">
              {volumeDataPoints.map((pt, idx) => {
                const heightPct = Math.max(12, Math.round((pt.volume / maxVolume) * 100));
                return (
                  <div
                    key={`${pt.date}-${idx}`}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-neutral-950 border border-neutral-700 rounded px-2.5 py-1 text-center shadow-lg whitespace-nowrap pointer-events-none">
                      <span className="text-[10px] text-neutral-400">{pt.title}</span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {pt.volume.toLocaleString()} {unit}
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full max-w-[48px] bg-amber-500/80 hover:bg-amber-400 rounded-t transition-all duration-300"
                      style={{ height: `${heightPct}%` }}
                    />

                    {/* X-Axis Date */}
                    <span className="absolute -bottom-5 text-[10px] font-mono text-neutral-400">
                      {pt.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: 1RM Strength Progression */}
      <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase">
              Estimated 1-Rep Max (1RM) Progression
            </h2>
            <p className="text-xs text-neutral-400">
              Calculated via Epley formula: Weight × (1 + Reps/30)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Select Compound:</span>
            <select
              value={selectedLiftFor1RM}
              onChange={(e) => setSelectedLiftFor1RM(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 font-medium focus:outline-hidden focus:border-amber-400"
            >
              {prs.map((pr) => (
                <option key={pr.exerciseId} value={pr.exerciseId}>
                  {pr.exerciseName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1RM Trend Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 1RM Highlight Cards */}
          <div className="md:col-span-1 space-y-3">
            {prs.find((p) => p.exerciseId === selectedLiftFor1RM) && (
              <div className="p-4 bg-neutral-950 rounded border border-neutral-800 space-y-2">
                <span className="text-xs text-neutral-400">Current Best Record</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
                    {prs.find((p) => p.exerciseId === selectedLiftFor1RM)?.estimated1RM}
                  </span>
                  <span className="text-xs font-mono text-neutral-400">
                    {unit} est. 1RM
                  </span>
                </div>
                <div className="text-xs text-neutral-300 font-mono">
                  Set: {prs.find((p) => p.exerciseId === selectedLiftFor1RM)?.weight} {unit} ×{' '}
                  {prs.find((p) => p.exerciseId === selectedLiftFor1RM)?.reps} reps
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  Achieved: {prs.find((p) => p.exerciseId === selectedLiftFor1RM)?.date}
                </div>
              </div>
            )}

            {/* Muscle Split Balance Summary */}
            <div className="p-4 bg-neutral-950 rounded border border-neutral-800 space-y-2">
              <span className="text-xs text-neutral-400">Push / Pull / Legs Balance</span>
              <div className="w-full flex h-2 rounded overflow-hidden">
                <div
                  className="bg-sky-500"
                  style={{ width: `${pushRatio}%` }}
                  title={`Push: ${pushRatio}%`}
                />
                <div
                  className="bg-emerald-500"
                  style={{ width: `${pullRatio}%` }}
                  title={`Pull: ${pullRatio}%`}
                />
                <div
                  className="bg-amber-500"
                  style={{ width: `${legsRatio}%` }}
                  title={`Legs: ${legsRatio}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1">
                <span className="text-sky-400">Push: {pushRatio}%</span>
                <span className="text-emerald-400">Pull: {pullRatio}%</span>
                <span className="text-amber-400">Legs: {legsRatio}%</span>
              </div>
            </div>
          </div>

          {/* 1RM Trend Line Visualization */}
          <div className="md:col-span-2 h-48 bg-neutral-950/60 rounded border border-neutral-800 p-4 flex flex-col justify-between">
            <span className="text-xs font-mono text-neutral-400">
              Historical 1RM Progression Points
            </span>
            {oneRMChartPoints.length > 0 ? (
              <div className="h-28 flex items-end gap-6 px-4 pb-4 border-b border-neutral-800 relative">
                {oneRMChartPoints.map((pt, idx) => {
                  const heightPct = Math.max(15, Math.round((pt.e1rm / max1RM) * 100));
                  return (
                    <div
                      key={`${pt.date}-${idx}`}
                      className="flex-1 flex flex-col items-center justify-end h-full relative group"
                    >
                      <div className="text-[11px] font-mono text-neutral-300 font-bold mb-1">
                        {pt.e1rm}
                      </div>
                      <div
                        className="w-3 bg-amber-400 rounded-t"
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="text-[10px] font-mono text-neutral-500 mt-1">
                        {pt.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-neutral-500">
                No recorded sets for this compound lift yet.
              </div>
            )}
            <div className="text-[11px] text-neutral-500 text-right">
              Based on highest intensity sets per session
            </div>
          </div>
        </div>
      </div>

      {/* Workout History Log */}
      <div className="p-5 bg-neutral-900/60 border border-neutral-800 rounded space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase">
              Workout History Log
            </h2>
            <p className="text-xs text-neutral-400">
              Detailed breakdown of sets, weights, and records achieved
            </p>
          </div>
          <span className="text-xs font-mono text-neutral-400">
            {sortedSessions.length} Logged Sessions
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {sortedSessions.length === 0 ? (
            <div className="p-8 text-center bg-neutral-950/40 rounded border border-neutral-800 text-xs text-neutral-400 space-y-1">
              <div className="font-semibold text-neutral-300">Clean Slate — No Workouts Logged Yet</div>
              <p>Execute your first scheduled workout from the Weekly Planner or Active Workout tab to begin building your volume charts!</p>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const isExpanded = !!expandedSessionIds[session.id];

              return (
                <div
                  key={session.id}
                  className="bg-neutral-950/70 border border-neutral-800 rounded overflow-hidden"
                >
                {/* Session Header Card */}
                <div
                  onClick={() => toggleSessionExpand(session.id)}
                  className="flex items-center justify-between p-3.5 hover:bg-neutral-900/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-neutral-500 hover:text-neutral-200">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <div className="text-sm font-bold text-neutral-100">
                        {session.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono">
                        <span>{session.date}</span>
                        <span>·</span>
                        <span>{session.durationMinutes} mins</span>
                        <span>·</span>
                        <span>{session.totalSets} sets</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-mono font-bold text-neutral-200 tabular-nums">
                        {formatWeight(session.totalVolume, unit)}
                      </div>
                      {session.prsBroken && session.prsBroken.length > 0 && (
                        <span className="text-[10px] text-amber-400 font-mono font-bold">
                          ★ {session.prsBroken.length} PR
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Delete this workout from history?')) {
                          onDeleteSession(session.id);
                        }
                      }}
                      title="Delete Session"
                      className="p-1.5 text-neutral-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Session Detail */}
                {isExpanded && (
                  <div className="p-4 border-t border-neutral-800/80 bg-neutral-950/90 space-y-3">
                    {session.notes && (
                      <div className="text-xs text-neutral-300 italic p-2.5 bg-neutral-900/50 rounded border border-neutral-800">
                        "{session.notes}"
                      </div>
                    )}

                    <div className="space-y-3">
                      {session.exercises.map((ex, exIdx) => (
                        <div
                          key={`${ex.exerciseId}-${exIdx}`}
                          className="p-2.5 bg-neutral-900/40 rounded border border-neutral-800/60"
                        >
                          <div className="text-xs font-semibold text-neutral-200 mb-1.5">
                            {ex.exerciseName}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {ex.sets.map((st) => (
                              <div
                                key={st.id}
                                className={`px-2 py-1 rounded text-[11px] font-mono ${
                                  st.completed
                                    ? 'bg-neutral-800 text-neutral-200 border border-neutral-700/60'
                                    : 'bg-neutral-900 text-neutral-500 line-through'
                                }`}
                              >
                                Set {st.setNumber}: {st.weight} {unit} × {st.reps} reps
                                {st.rpe && ` @ RPE ${st.rpe}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
};
