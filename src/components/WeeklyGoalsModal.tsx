import React, { useState } from 'react';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Calendar,
  Flame,
  Dumbbell,
  Clock,
  Layers,
  Activity,
  HeartPulse,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  WeeklyGoal,
  CustomMilestone,
  MuscleGroup,
  UnitSystem,
  DayPlan,
  RoutineTemplate,
} from '../types/fitness';
import {
  MUSCLE_GROUP_LABELS,
  exportDataAsJSON,
  importDataFromJSON,
  adjustWorkoutPlanFromGoal,
  convertVolume,
} from '../utils/storage';

interface WeeklyGoalsModalProps {
  goal: WeeklyGoal;
  unit: UnitSystem;
  currentSchedule: DayPlan[];
  currentRoutines: RoutineTemplate[];
  onSaveGoal: (
    newGoal: WeeklyGoal,
    adjustedRoutines?: RoutineTemplate[],
    adjustedSchedule?: DayPlan[]
  ) => void;
  onClose: () => void;
  onResetData: () => void;
}

const SPLIT_DESCRIPTIONS: Record<number, { name: string; desc: string }> = {
  2: {
    name: 'Full Body Compound & Hypertrophy A/B',
    desc: '2 days/week: Tuesday (Compound Heavy) & Friday (Hypertrophy Density). High recovery efficiency.',
  },
  3: {
    name: 'Push / Pull / Legs (PPL) Classic Split',
    desc: '3 days/week: Monday (Push), Wednesday (Pull), Friday (Legs). Foundational hypertrophy & recovery.',
  },
  4: {
    name: 'Upper / Lower Power & Hypertrophy Split',
    desc: '4 days/week: Mon (Upper), Tue (Lower), Thu (Upper), Fri (Lower). Optimal frequency & strength balance.',
  },
  5: {
    name: 'Push / Pull / Legs + Upper / Lower Hybrid',
    desc: '5 days/week: Mon (Push), Tue (Pull), Wed (Legs), Fri (Upper Power), Sat (Lower Strength). Elite density.',
  },
  6: {
    name: 'High-Frequency PPL Double Wave',
    desc: '6 days/week: Mon-Sat alternating Push/Pull/Legs twice per week. Maximum hypertrophy accumulation.',
  },
};

export const WeeklyGoalsModal: React.FC<WeeklyGoalsModalProps> = ({
  goal,
  unit,
  currentSchedule,
  currentRoutines,
  onSaveGoal,
  onClose,
  onResetData,
}) => {
  const [formData, setFormData] = useState<WeeklyGoal>({ ...goal });
  const [selectedFitnessGoal, setSelectedFitnessGoal] = useState<
    'strength' | 'hypertrophy' | 'fat_loss' | 'mobility'
  >(goal.fitnessGoal || 'hypertrophy');
  const [autoAdjustPlan, setAutoAdjustPlan] = useState<boolean>(true);
  const [sessionDuration, setSessionDuration] = useState<number>(() => {
    const freq = goal.targetWorkouts || 4;
    return Math.round((goal.targetActiveMinutes || 240) / freq) || 60;
  });

  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneTarget, setNewMilestoneTarget] = useState<number>(100);
  const [newMilestoneCurrent, setNewMilestoneCurrent] = useState<number>(0);
  const [newMilestoneUnit, setNewMilestoneUnit] = useState<string>(unit);
  const [newMilestoneCat, setNewMilestoneCat] = useState<CustomMilestone['category']>('strength');

  // Recalculate targets based on frequency & fitness goal
  const handleSelectDays = (days: number) => {
    const baseVolumeLbs = days * 8000;
    const nextVolume = unit === 'kg' ? convertVolume(baseVolumeLbs, 'lbs', 'kg') : baseVolumeLbs;
    const nextSets = days * (selectedFitnessGoal === 'strength' ? 12 : 15);
    const cardioMins = selectedFitnessGoal === 'fat_loss' ? days * 20 : 30;

    setFormData((prev) => ({
      ...prev,
      targetWorkouts: days,
      targetActiveMinutes: days * sessionDuration,
      targetTotalSets: nextSets,
      targetVolume: nextVolume,
      targetCardioMinutes: cardioMins,
      targetMuscleSets: {
        chest: Math.round(nextSets * 0.2),
        back: Math.round(nextSets * 0.22),
        legs_quads: Math.round(nextSets * 0.2),
        legs_hamstrings: Math.round(nextSets * 0.15),
        shoulders: Math.round(nextSets * 0.15),
        core: Math.round(nextSets * 0.08),
      },
    }));
  };

  const handleSelectFitnessGoal = (newGoalCat: 'strength' | 'hypertrophy' | 'fat_loss' | 'mobility') => {
    setSelectedFitnessGoal(newGoalCat);
    const days = formData.targetWorkouts || 4;
    const nextSets = days * (newGoalCat === 'strength' ? 12 : 15);
    const cardioMins = newGoalCat === 'fat_loss' ? days * 20 : 30;

    setFormData((prev) => ({
      ...prev,
      targetTotalSets: nextSets,
      targetCardioMinutes: cardioMins,
      fitnessGoal: newGoalCat,
    }));
  };

  const handleSelectDuration = (mins: number) => {
    setSessionDuration(mins);
    const days = formData.targetWorkouts || 4;
    setFormData((prev) => ({
      ...prev,
      targetActiveMinutes: days * mins,
    }));
  };

  const handleToggleMilestone = (id: string) => {
    const updated = formData.milestones.map((m) => {
      if (m.id === id) {
        const nextCompleted = !m.completed;
        if (nextCompleted) {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        }
        return { ...m, completed: nextCompleted };
      }
      return m;
    });
    setFormData({ ...formData, milestones: updated });
  };

  const handleDeleteMilestone = (id: string) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((m) => m.id !== id),
    });
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newM: CustomMilestone = {
      id: `ms-${Date.now()}`,
      title: newMilestoneTitle.trim(),
      category: newMilestoneCat,
      currentValue: newMilestoneCurrent,
      targetValue: newMilestoneTarget,
      unit: newMilestoneUnit || unit,
      completed: false,
    };

    setFormData({
      ...formData,
      milestones: [...formData.milestones, newM],
    });

    setNewMilestoneTitle('');
    setNewMilestoneTarget(100);
    setNewMilestoneCurrent(0);
  };

  const handleExportData = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kratos_fitness_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && importDataFromJSON(content)) {
        alert('Fitness data successfully imported!');
        window.location.reload();
      } else {
        alert('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveAndClose = () => {
    if (autoAdjustPlan) {
      // Adjust workout plan, routine templates, and calendar schedule for upcoming days & weeks
      const { adjustedSchedule, adjustedRoutines, adjustedGoal } = adjustWorkoutPlanFromGoal(
        currentSchedule,
        currentRoutines,
        formData,
        selectedFitnessGoal,
        new Date(2026, 10, 7),
        unit
      );
      onSaveGoal(adjustedGoal, adjustedRoutines, adjustedSchedule);
    } else {
      onSaveGoal({
        ...formData,
        fitnessGoal: selectedFitnessGoal,
      });
    }
    onClose();
  };

  const currentDays = formData.targetWorkouts || 4;
  const splitInfo = SPLIT_DESCRIPTIONS[currentDays] || SPLIT_DESCRIPTIONS[4];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-amber-400" />
              <h2 className="text-lg font-bold text-neutral-100">
                Update Fitness Goals & Workout Plan
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Modify your training frequency, objective, or target volume anytime. Your workout calendar adapts automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-100 p-1 rounded hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto space-y-5 pr-1 flex-1">
          {/* Section 1: Primary Fitness Objective */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                1. Primary Training Objective
              </label>
              <span className="text-[11px] font-mono text-amber-400">
                Calibrates reps & rest intervals
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'hypertrophy',
                  label: 'Hypertrophy',
                  desc: '8–12 reps · 90s rest',
                  icon: Dumbbell,
                },
                {
                  id: 'strength',
                  label: 'Heavy Strength',
                  desc: '4–6 reps · 180s rest',
                  icon: Flame,
                },
                {
                  id: 'fat_loss',
                  label: 'Fat Loss & Burn',
                  desc: '12–15 reps · 60s rest',
                  icon: Activity,
                },
                {
                  id: 'mobility',
                  label: 'Athletic Conditioning',
                  desc: 'Tempo & Core stamina',
                  icon: HeartPulse,
                },
              ].map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedFitnessGoal === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      handleSelectFitnessGoal(
                        cat.id as 'strength' | 'hypertrophy' | 'fat_loss' | 'mobility'
                      )
                    }
                    className={`p-3 rounded border text-left transition-colors flex flex-col justify-between min-h-[75px] ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-400 text-neutral-100 shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? 'text-amber-300' : 'text-neutral-200'
                        }`}
                      >
                        {cat.label}
                      </span>
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          isSelected ? 'text-amber-400' : 'text-neutral-500'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 mt-1">
                      {cat.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Frequency & Training Split */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                2. Weekly Frequency & Split
              </label>
              <span className="text-[11px] font-mono text-neutral-400">
                {currentDays} workouts planned per week
              </span>
            </div>

            {/* Frequency Selector Buttons */}
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((days) => {
                const isSelected = currentDays === days;
                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleSelectDays(days)}
                    className={`py-2 px-1 text-center rounded border transition-colors ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950 font-bold border-amber-400 shadow-xs'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="text-xs">{days} Days</div>
                    <div className="text-[10px] font-mono opacity-80">/ week</div>
                  </button>
                );
              })}
            </div>

            {/* Split Description Card */}
            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <Calendar className="h-3.5 w-3.5 text-amber-400" />
                <span>{splitInfo.name}</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {splitInfo.desc}
              </p>
            </div>
          </div>

          {/* Section 3: Target Duration & Volume Benchmarks */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                3. Volume & Duration Targets
              </label>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Clock className="h-3 w-3 text-neutral-500" />
                <span>Session length:</span>
                {[45, 60, 75, 90].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleSelectDuration(m)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                      sessionDuration === m
                        ? 'bg-amber-400 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">
                  Workouts / Week
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={formData.targetWorkouts}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetWorkouts: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm font-mono text-neutral-100 font-bold focus:outline-hidden"
                  />
                  <span className="text-xs text-neutral-500 font-mono">days</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">
                  Active Minutes
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="15"
                    min="30"
                    value={formData.targetActiveMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetActiveMinutes: parseInt(e.target.value, 10) || 30,
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm font-mono text-neutral-100 font-bold focus:outline-hidden"
                  />
                  <span className="text-xs text-neutral-500 font-mono">mins</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">
                  Target Total Sets
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="5"
                    min="10"
                    value={formData.targetTotalSets}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetTotalSets: parseInt(e.target.value, 10) || 10,
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm font-mono text-neutral-100 font-bold focus:outline-hidden"
                  />
                  <span className="text-xs text-neutral-500 font-mono">sets</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                <label className="text-[11px] text-neutral-400 font-medium">
                  Volume Target ({unit})
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="2500"
                    min="5000"
                    value={formData.targetVolume}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetVolume: parseInt(e.target.value, 10) || 5000,
                      })
                    }
                    className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-sm font-mono text-neutral-100 font-bold focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Target Working Sets by Muscle Group */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                4. Weekly Target Working Sets by Muscle Group
              </label>
              <button
                type="button"
                onClick={() => handleSelectDays(currentDays)}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
              >
                Auto-distribute sets
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
              ).map((m) => (
                <div
                  key={m}
                  className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-800 text-xs"
                >
                  <span className="text-neutral-300 font-medium">{MUSCLE_GROUP_LABELS[m]}</span>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={formData.targetMuscleSets[m] || 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetMuscleSets: {
                          ...formData.targetMuscleSets,
                          [m]: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                    className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-center font-mono text-xs font-bold text-amber-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Plan Adjustment & Schedule Sync Callout */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-amber-300">
                  Adaptive Workout Plan & Calendar Synchronization
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoAdjustPlan}
                  onChange={(e) => setAutoAdjustPlan(e.target.checked)}
                  className="rounded border-neutral-700 text-amber-400 focus:ring-amber-400/20 bg-neutral-900 h-4 w-4"
                />
                <span className="text-xs text-neutral-200 font-medium">
                  Auto-adjust plan
                </span>
              </label>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              {autoAdjustPlan
                ? `When saved, your workout plan and calendar schedule for today, next week, and future weeks will instantly adjust to your new ${currentDays}-day ${splitInfo.name}. All completed workout sessions, historical volume, and PR logs remain strictly preserved.`
                : 'Goal numerical targets will be saved, but your scheduled calendar days and routines will remain unchanged.'}
            </p>
          </div>

          {/* Section 6: Personal Milestones & Strength Goals */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                6. Personal Milestones & PR Benchmarks
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">
                {formData.milestones.filter((m) => m.completed).length} /{' '}
                {formData.milestones.length} Completed
              </span>
            </div>

            {/* Existing Milestones */}
            <div className="space-y-2">
              {formData.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between p-3 rounded border transition-colors ${
                    m.completed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleToggleMilestone(m.id)}
                      className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
                        m.completed
                          ? 'bg-emerald-500 border-emerald-400 text-neutral-950'
                          : 'bg-neutral-900 border-neutral-700 text-transparent hover:border-amber-400'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 stroke-[2.5]" />
                    </button>
                    <div>
                      <div
                        className={`text-xs font-semibold ${
                          m.completed ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {m.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono">
                        Progress: {m.currentValue} / {m.targetValue} {m.unit}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteMilestone(m.id)}
                    className="text-neutral-600 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Milestone Form */}
            <form
              onSubmit={handleAddMilestone}
              className="p-3 bg-neutral-950/80 rounded border border-neutral-800 space-y-2.5"
            >
              <span className="text-xs font-semibold text-neutral-300">
                + Add Custom Fitness Milestone
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="e.g. Incline Bench 205 lbs for 8 reps"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Target"
                    value={newMilestoneTarget || ''}
                    onChange={(e) => setNewMilestoneTarget(parseFloat(e.target.value) || 0)}
                    className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs font-mono text-neutral-100"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={newMilestoneUnit}
                    onChange={(e) => setNewMilestoneUnit(e.target.value)}
                    className="w-1/2 bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs font-mono text-neutral-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newMilestoneTitle.trim()}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-xs font-medium text-neutral-200 rounded transition-colors"
                >
                  Add Goal
                </button>
              </div>
            </form>
          </div>

          {/* Section 7: Data Management & Backup */}
          <div className="pt-2 border-t border-neutral-800 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Data Management & Backup
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportData}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-950 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded cursor-pointer transition-colors">
                <Upload className="h-3.5 w-3.5" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Clear all workout session history and reset metrics back to 0 baseline?'
                    )
                  ) {
                    onResetData();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/20 rounded transition-colors ml-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to 0 Baseline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndClose}
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Save Goals & Adjust Workout Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
