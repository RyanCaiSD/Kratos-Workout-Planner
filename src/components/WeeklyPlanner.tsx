import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Plus,
  Play,
  Moon,
  TrendingUp,
  SlidersHorizontal,
  Dumbbell,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  WorkoutSession,
  WeeklyGoal,
  DayPlan,
  RoutineTemplate,
  UnitSystem,
  MuscleGroup,
} from '../types/fitness';
import {
  getWeekDates,
  formatDateToISO,
  formatWeight,
  MUSCLE_GROUP_LABELS,
  resolveDayPlan,
} from '../utils/storage';

interface WeeklyPlannerProps {
  sessions: WorkoutSession[];
  weeklyGoal: WeeklyGoal;
  schedule: DayPlan[];
  routines: RoutineTemplate[];
  unit: UnitSystem;
  onUpdateSchedule: (newSchedule: DayPlan[]) => void;
  onStartWorkoutWithRoutine: (routine?: RoutineTemplate) => void;
  onOpenGoalsModal: () => void;
  onOpenSmartGenerator: () => void;
  onViewSessionDetails: (session: WorkoutSession) => void;
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  sessions,
  weeklyGoal,
  schedule,
  routines,
  unit,
  onUpdateSchedule,
  onStartWorkoutWithRoutine,
  onOpenGoalsModal,
  onOpenSmartGenerator,
  onViewSessionDetails,
}) => {
  // Anchor date for week navigation
  const [anchorDate, setAnchorDate] = useState<Date>(new Date(2026, 10, 7)); // Nov 7, 2026
  const [selectedDayToAssign, setSelectedDayToAssign] = useState<string | null>(null);

  const weekDates = getWeekDates(anchorDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  // Benchmark reference dates (Nov 02 - Nov 08 is current week, Nov 09 - Nov 15 is next week)
  const currentWeekAnchor = new Date(2026, 10, 7);
  const nextWeekAnchor = new Date(2026, 10, 14);

  const currentWeekMondayIso = formatDateToISO(getWeekDates(currentWeekAnchor)[0]);
  const nextWeekMondayIso = formatDateToISO(getWeekDates(nextWeekAnchor)[0]);
  const displayedMondayIso = formatDateToISO(weekStart);

  const isViewingThisWeek = displayedMondayIso === currentWeekMondayIso;
  const isViewingNextWeek = displayedMondayIso === nextWeekMondayIso;

  const todayIso = formatDateToISO(new Date(2026, 10, 7)); // Reference today

  const weekIsoDates = weekDates.map((d) => formatDateToISO(d));

  // Filter sessions completed during this displayed week
  const weekSessions = sessions.filter((s) => weekIsoDates.includes(s.date) && s.completed);

  // Compute metrics for the active week
  const completedWorkoutsCount = weekSessions.length;
  const totalDurationMinutes = weekSessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalVolumeLifted = weekSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
  const totalSetsCompleted = weekSessions.reduce((acc, s) => acc + (s.totalSets || 0), 0);

  // Calculate muscle sets for this week
  const muscleSetsThisWeek: Partial<Record<MuscleGroup, number>> = {};
  weekSessions.forEach((s) => {
    s.exercises.forEach((ex) => {
      const completedSets = ex.sets.filter((set) => set.completed).length;
      if (completedSets > 0) {
        muscleSetsThisWeek[ex.primaryMuscle] = (muscleSetsThisWeek[ex.primaryMuscle] || 0) + completedSets;
      }
    });
  });

  // Calculate streak (consecutive weeks meeting or exceeding targetWorkouts)
  const calculateStreak = (): number => {
    if (sessions.length === 0) return 0;
    let streak = 0;
    const target = weeklyGoal.targetWorkouts || 1;
    if (completedWorkoutsCount >= target) {
      streak += 1;
    }
    for (let w = 1; w <= 12; w++) {
      const prevWeekAnchor = new Date(2026, 10, 7 - w * 7);
      const dates = getWeekDates(prevWeekAnchor).map((d) => formatDateToISO(d));
      const count = sessions.filter((s) => dates.includes(s.date) && s.completed).length;
      if (count >= target) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  };

  const streakWeeks = calculateStreak();

  const handlePrevWeek = () => {
    const prev = new Date(anchorDate);
    prev.setDate(prev.getDate() - 7);
    setAnchorDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + 7);
    setAnchorDate(next);
  };

  const handleJumpToToday = () => {
    setAnchorDate(new Date(2026, 10, 7));
  };

  const handleAssignRoutineToDay = (dateIso: string, routineId: string | 'rest' | 'clear') => {
    let updated = [...schedule];
    const existingIndex = updated.findIndex((d) => d.date === dateIso);

    if (routineId === 'clear') {
      if (existingIndex >= 0) {
        updated.splice(existingIndex, 1);
      }
    } else if (routineId === 'rest') {
      const restPlan: DayPlan = {
        date: dateIso,
        isRestDay: true,
        routineName: 'Rest & Recovery',
      };
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], ...restPlan };
      } else {
        updated.push(restPlan);
      }
    } else {
      const foundRoutine = routines.find((r) => r.id === routineId);
      const plan: DayPlan = {
        date: dateIso,
        isRestDay: false,
        routineId,
        routineName: foundRoutine?.name || 'Custom Workout',
      };
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], ...plan };
      } else {
        updated.push(plan);
      }
    }

    onUpdateSchedule(updated);
    setSelectedDayToAssign(null);
  };

  const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const weekRangeTitle = `${monthFormatter.format(weekStart)} – ${monthFormatter.format(weekEnd)}, ${weekStart.getFullYear()}`;

  const workoutPct = weeklyGoal.targetWorkouts > 0 ? Math.min(100, Math.round((completedWorkoutsCount / weeklyGoal.targetWorkouts) * 100)) : 0;
  const timePct = weeklyGoal.targetActiveMinutes > 0 ? Math.min(100, Math.round((totalDurationMinutes / weeklyGoal.targetActiveMinutes) * 100)) : 0;
  const volumePct = weeklyGoal.targetVolume > 0 ? Math.min(100, Math.round((totalVolumeLifted / weeklyGoal.targetVolume) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Week Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>Weekly Planner</span>
            <span aria-hidden="true">·</span>
            <span>Periodization & Volume Scheduling</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Weekly Schedule & Targets
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick This Week / Next Week Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5">
            <button
              onClick={() => setAnchorDate(currentWeekAnchor)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                isViewingThisWeek
                  ? 'bg-amber-400 text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setAnchorDate(nextWeekAnchor)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                isViewingNextWeek
                  ? 'bg-amber-400 text-neutral-950 font-semibold shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60'
              }`}
            >
              Next Week
            </button>
          </div>

          {/* Date range with chevrons */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded p-0.5">
            <button
              onClick={handlePrevWeek}
              title="Previous Week"
              className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="px-3 text-xs font-mono font-medium text-neutral-200 whitespace-nowrap">
              {weekRangeTitle}
            </div>
            <button
              onClick={handleNextWeek}
              title="Next Week"
              className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleJumpToToday}
            className="px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 transition-colors whitespace-nowrap"
          >
            Today
          </button>

          <button
            onClick={onOpenSmartGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Smart Routine</span>
          </button>

          <button
            onClick={onOpenGoalsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 transition-colors whitespace-nowrap"
          >
            <Target className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Update Goals</span>
          </button>
        </div>
      </div>

      {/* Weekly Targets & Consistency Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metric 1: Workouts Completed */}
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Workouts Target</span>
            <span className="font-mono text-neutral-300">{workoutPct}%</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {completedWorkoutsCount}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              / {weeklyGoal.targetWorkouts} planned
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                workoutPct >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${workoutPct}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Active Time */}
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Active Duration</span>
            <span className="font-mono text-neutral-300">{timePct}%</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {totalDurationMinutes}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              / {weeklyGoal.targetActiveMinutes} mins
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                timePct >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${timePct}%` }}
            />
          </div>
        </div>

        {/* Metric 3: Total Volume Lifted */}
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded">
          <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
            <span>Total Volume</span>
            <span className="font-mono text-neutral-300">{volumePct}%</span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
              {totalVolumeLifted.toLocaleString()}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {unit}
            </span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                volumePct >= 100 ? 'bg-emerald-500' : 'bg-amber-400'
              }`}
              style={{ width: `${volumePct}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Streak & Discipline */}
        <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Consistency Streak</span>
            <button
              onClick={onOpenGoalsModal}
              className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1"
            >
              <SlidersHorizontal className="h-3 w-3" />
              <span>Edit Goal</span>
            </button>
          </div>
          <div className="flex items-center gap-3 my-2">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono text-neutral-100 tabular-nums">
                {streakWeeks} Weeks
              </div>
              <div className="text-xs text-neutral-400">Target met consecutively</div>
            </div>
          </div>
          <div className="text-[11px] text-neutral-500 font-mono">
            {totalSetsCompleted} working sets logged this week
          </div>
        </div>
      </div>

      {/* 7-Day Weekly Grid Matrix */}
      <div>
        {/* Next Week Alert Banner when viewing next week */}
        {isViewingNextWeek && (
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded mb-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-400 shrink-0" />
              <span>
                Viewing planned workouts for <strong className="text-amber-300">Next Week ({weekRangeTitle})</strong>
              </span>
            </div>
            <button
              onClick={() => setAnchorDate(currentWeekAnchor)}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 hover:underline transition-colors shrink-0"
            >
              ← Return to This Week
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-neutral-300 uppercase">
              {isViewingNextWeek ? "Next Week's Training Calendar" : '7-Day Training Calendar'}
            </h2>
            {isViewingNextWeek && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Next Week
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-500">
            Click any day to assign, edit routine or log
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDates.map((dayDate) => {
            const dateIso = formatDateToISO(dayDate);
            const isToday = dateIso === todayIso;
            const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
            const dayNum = dayDate.getDate();

            // Find scheduled plan (explicit in schedule or resolved recurring pattern)
            const plan = resolveDayPlan(schedule, dateIso, routines);
            // Find completed sessions for this date
            const daySessions = sessions.filter((s) => s.date === dateIso && s.completed);
            const hasCompleted = daySessions.length > 0;
            const primarySession = daySessions[0];

            return (
              <div
                key={dateIso}
                className={`relative flex flex-col justify-between p-3.5 rounded border transition-colors min-h-[170px] ${
                  isToday
                    ? 'bg-neutral-900 border-amber-400/50 shadow-sm'
                    : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {/* Day Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        isToday ? 'text-amber-400' : 'text-neutral-400'
                      }`}
                    >
                      {dayName}
                    </span>
                    <span
                      className={`text-sm font-mono font-bold ${
                        isToday ? 'text-amber-400' : 'text-neutral-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  {/* Body Content of Day */}
                  {hasCompleted ? (
                    <div className="space-y-1.5 my-2">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{primarySession.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-neutral-400 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-neutral-500" />
                          <span>{primarySession.durationMinutes}m</span>
                          <span>·</span>
                          <span>{primarySession.totalSets} sets</span>
                        </div>
                        <div className="text-neutral-300 font-semibold">
                          {formatWeight(primarySession.totalVolume, unit)}
                        </div>
                      </div>
                    </div>
                  ) : plan?.isRestDay ? (
                    <div className="my-3 flex items-center gap-1.5 text-xs text-neutral-400">
                      <Moon className="h-3.5 w-3.5 text-neutral-500" />
                      <span>{plan.routineName || 'Rest & Recovery'}</span>
                    </div>
                  ) : plan?.routineName ? (
                    <div className="my-2 space-y-1">
                      <div className="text-xs font-medium text-neutral-200 line-clamp-2">
                        {plan.routineName}
                      </div>
                      <span className="inline-block text-[10px] text-amber-400/80 uppercase font-mono">
                        {isViewingNextWeek ? 'Planned Next Week' : 'Scheduled'}
                      </span>
                    </div>
                  ) : (
                    <div className="my-3 text-xs text-neutral-500 italic">
                      No workout scheduled
                    </div>
                  )}
                </div>

                {/* Day Actions */}
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-1">
                  {hasCompleted ? (
                    <button
                      onClick={() => onViewSessionDetails(primarySession)}
                      className="text-[11px] text-neutral-400 hover:text-neutral-100 transition-colors underline-offset-2 hover:underline"
                    >
                      View Log
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const routine = routines.find((r) => r.id === plan?.routineId);
                        onStartWorkoutWithRoutine(routine);
                      }}
                      className="flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Start</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDayToAssign(dateIso)}
                    title="Change or Assign Routine"
                    className="p-1 text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upcoming Next Week Preview Section when viewing current week */}
        {isViewingThisWeek && (
          <div className="mt-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-neutral-200">
                  Upcoming Next Week's Training Schedule
                </h3>
                <span className="text-xs font-mono text-neutral-400">
                  (Nov 09 – Nov 15, 2026)
                </span>
              </div>
              <button
                onClick={() => setAnchorDate(nextWeekAnchor)}
                className="flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors self-start sm:self-auto"
              >
                <span>Open Next Week in Planner</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 7-day mini row for next week */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
              {getWeekDates(nextWeekAnchor).map((dayDate) => {
                const iso = formatDateToISO(dayDate);
                const dayName = dayDate.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dayDate.getDate();
                const nextPlan = resolveDayPlan(schedule, iso, routines);
                const routine = routines.find((r) => r.id === nextPlan?.routineId);

                return (
                  <div
                    key={iso}
                    className="p-2.5 bg-neutral-950/80 border border-neutral-800/80 rounded flex flex-col justify-between min-h-[95px] hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-neutral-400 uppercase text-[10px]">
                          {dayName}
                        </span>
                        <span className="font-mono text-neutral-300 text-xs font-bold">
                          {dayNum}
                        </span>
                      </div>
                      {nextPlan?.isRestDay ? (
                        <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
                          <Moon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{nextPlan.routineName || 'Rest'}</span>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-neutral-200 line-clamp-2 mt-0.5">
                          {nextPlan?.routineName}
                        </div>
                      )}
                    </div>

                    {!nextPlan?.isRestDay && nextPlan?.routineName && (
                      <div className="pt-2 mt-1 border-t border-neutral-800/60 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-amber-400/90">
                          {routine ? `${routine.exercises.length} ex.` : 'Workout'}
                        </span>
                        <button
                          onClick={() => onStartWorkoutWithRoutine(routine)}
                          title={`Start ${nextPlan.routineName}`}
                          className="text-[10px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                        >
                          <Play className="h-2.5 w-2.5 fill-current" />
                          <span>Start</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Muscle Group Volume Balance Barometer */}
      <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold tracking-wide text-neutral-200 uppercase">
              Weekly Muscle Volume Distribution
            </h3>
            <p className="text-xs text-neutral-400">
              Completed working sets across primary muscle groups compared to weekly targets
            </p>
          </div>
          <div className="text-xs font-mono text-neutral-400">
            Recommended: 10–20 sets/muscle for optimal hypertrophy
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
          {(
            [
              'chest',
              'back',
              'legs_quads',
              'legs_hamstrings',
              'shoulders',
              'biceps',
              'triceps',
              'core',
            ] as MuscleGroup[]
          ).map((muscle) => {
            const currentSets = muscleSetsThisWeek[muscle] || 0;
            const targetSets = weeklyGoal.targetMuscleSets[muscle] || 12;
            const pct = Math.min(100, Math.round((currentSets / targetSets) * 100));

            return (
              <div key={muscle} className="p-3 bg-neutral-900/80 border border-neutral-800/80 rounded">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-neutral-300">
                    {MUSCLE_GROUP_LABELS[muscle]}
                  </span>
                  <span className="font-mono text-neutral-400">
                    {currentSets} / {targetSets} sets
                  </span>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-neutral-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Routine Assignment Modal */}
      {selectedDayToAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-100">
                  Assign Routine to Day
                </h3>
                <span className="text-xs font-mono text-neutral-400">
                  {selectedDayToAssign}
                </span>
              </div>
              <button
                onClick={() => setSelectedDayToAssign(null)}
                className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              <button
                onClick={() => handleAssignRoutineToDay(selectedDayToAssign, 'rest')}
                className="w-full flex items-center justify-between p-3 text-left bg-neutral-800/40 hover:bg-neutral-800 rounded border border-neutral-700/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Moon className="h-4 w-4 text-neutral-400" />
                  <span className="text-sm font-medium text-neutral-200">Rest & Recovery Day</span>
                </div>
                <span className="text-xs font-mono text-neutral-400">Scheduled Rest</span>
              </button>

              <div className="pt-2 pb-1 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Select Routine Template:
              </div>

              {routines.map((routine) => (
                <button
                  key={routine.id}
                  onClick={() => handleAssignRoutineToDay(selectedDayToAssign, routine.id)}
                  className="w-full flex flex-col p-3 text-left bg-neutral-800/40 hover:bg-neutral-800 rounded border border-neutral-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-neutral-200">
                      {routine.name}
                    </span>
                    <span className="text-xs font-mono text-amber-400">
                      {routine.exercises.length} Exercises
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-1">
                    {routine.description}
                  </p>
                </button>
              ))}

              <button
                onClick={() => handleAssignRoutineToDay(selectedDayToAssign, 'clear')}
                className="w-full p-2 text-center text-xs text-neutral-400 hover:text-rose-400 transition-colors"
              >
                Clear Day Schedule
              </button>
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setSelectedDayToAssign(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
