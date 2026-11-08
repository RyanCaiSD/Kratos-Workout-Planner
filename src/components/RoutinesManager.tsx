import React, { useState } from 'react';
import {
  Plus,
  Play,
  Calendar,
  Trash2,
  Dumbbell,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  RoutineTemplate,
  Exercise,
  RoutineExerciseConfig,
  DayPlan,
} from '../types/fitness';
import { formatDateToISO } from '../utils/storage';

interface RoutinesManagerProps {
  routines: RoutineTemplate[];
  exercises: Exercise[];
  schedule: DayPlan[];
  onSaveRoutine: (routine: RoutineTemplate) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartRoutine: (routine: RoutineTemplate) => void;
  onScheduleRoutine: (dateIso: string, routineId: string, routineName: string) => void;
  onOpenSmartGenerator: () => void;
}

export const RoutinesManager: React.FC<RoutinesManagerProps> = ({
  routines,
  exercises,
  schedule,
  onSaveRoutine,
  onDeleteRoutine,
  onStartRoutine,
  onScheduleRoutine,
  onOpenSmartGenerator,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [scheduleModalRoutine, setScheduleModalRoutine] = useState<RoutineTemplate | null>(null);

  // New Routine Form State
  const [newName, setNewName] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<RoutineTemplate['category']>('Custom');
  const [newDaysPerWeek, setNewDaysPerWeek] = useState<number>(3);
  const [newConfigs, setNewConfigs] = useState<RoutineExerciseConfig[]>([]);
  const [selectedExToAdd, setSelectedExToAdd] = useState<string>('');

  const categories = ['All', 'PPL', 'Upper/Lower', 'Full Body', 'Custom'];

  const filteredRoutines = routines.filter((r) => {
    if (selectedCategory === 'All') return true;
    return r.category === selectedCategory;
  });

  const handleAddExerciseToNewRoutine = () => {
    if (!selectedExToAdd) return;
    const exists = newConfigs.some((c) => c.exerciseId === selectedExToAdd);
    if (exists) return;

    const ex = exercises.find((e) => e.id === selectedExToAdd);
    setNewConfigs([
      ...newConfigs,
      {
        exerciseId: selectedExToAdd,
        targetSets: ex?.defaultSets || 3,
        targetReps: `${ex?.defaultReps || 10}`,
        restSeconds: 90,
      },
    ]);
    setSelectedExToAdd('');
  };

  const handleRemoveExerciseFromNewRoutine = (idx: number) => {
    const updated = [...newConfigs];
    updated.splice(idx, 1);
    setNewConfigs(updated);
  };

  const handleSaveNewRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newConfigs.length === 0) return;

    const routine: RoutineTemplate = {
      id: `routine-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom training split',
      category: newCategory,
      daysPerWeek: newDaysPerWeek,
      exercises: newConfigs,
      isCustom: true,
    };

    onSaveRoutine(routine);
    setShowCreateModal(false);
    // Reset form
    setNewName('');
    setNewDesc('');
    setNewConfigs([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>Routines & Splits</span>
            <span aria-hidden="true">·</span>
            <span>Structured Workout Templates</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Workout Routines
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSmartGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors whitespace-nowrap"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Routine Generator</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Create Routine</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills (Functional Buttons) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-neutral-100 text-neutral-950 border-neutral-100'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRoutines.map((routine) => (
          <div
            key={routine.id}
            className="flex flex-col justify-between p-5 bg-neutral-900/60 border border-neutral-800 rounded space-y-4 hover:border-neutral-700 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-neutral-100">
                    {routine.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                    <span>{routine.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{routine.exercises.length} Exercises</span>
                  </div>
                </div>

                {routine.isCustom && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete routine "${routine.name}"?`)) {
                        onDeleteRoutine(routine.id);
                      }
                    }}
                    title="Delete Routine"
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-xs text-neutral-400 line-clamp-2">
                {routine.description}
              </p>

              {/* Exercises in routine preview */}
              <div className="space-y-1.5 pt-2">
                {routine.exercises.slice(0, 4).map((cfg, idx) => {
                  const ex = exercises.find((e) => e.id === cfg.exerciseId);
                  return (
                    <div
                      key={`${cfg.exerciseId}-${idx}`}
                      className="flex items-center justify-between text-xs py-1 px-2 bg-neutral-950/60 rounded border border-neutral-800/60"
                    >
                      <span className="text-neutral-300 truncate max-w-[200px]">
                        {ex?.name || cfg.exerciseId}
                      </span>
                      <span className="font-mono text-neutral-400 tabular-nums">
                        {cfg.targetSets} × {cfg.targetReps}
                      </span>
                    </div>
                  );
                })}
                {routine.exercises.length > 4 && (
                  <div className="text-[11px] text-neutral-500 font-mono text-right">
                    +{routine.exercises.length - 4} more exercises
                  </div>
                )}
              </div>
            </div>

            {/* Routine Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setScheduleModalRoutine(routine)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 rounded transition-colors"
              >
                <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                <span>Schedule</span>
              </button>

              <button
                onClick={() => onStartRoutine(routine)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Start Routine</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule to Day Modal */}
      {scheduleModalRoutine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-sm font-bold text-neutral-100">
                Schedule to Week Day
              </h3>
              <button
                onClick={() => setScheduleModalRoutine(null)}
                className="text-xs text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Assign <strong>{scheduleModalRoutine.name}</strong> to an upcoming day in your weekly planner:
            </p>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const targetDate = new Date(2026, 10, 7 + offset);
                const iso = formatDateToISO(targetDate);
                const dayName = targetDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                const isAlreadyScheduled = schedule.some((d) => d.date === iso && !d.isRestDay);

                return (
                  <button
                    key={iso}
                    onClick={() => {
                      onScheduleRoutine(iso, scheduleModalRoutine.id, scheduleModalRoutine.name);
                      setScheduleModalRoutine(null);
                    }}
                    className="w-full flex items-center justify-between p-2.5 text-left bg-neutral-800/40 hover:bg-neutral-800 rounded border border-neutral-700/50 text-xs text-neutral-200 transition-colors"
                  >
                    <span className="font-medium">{dayName}</span>
                    <span className="font-mono text-neutral-500">
                      {isAlreadyScheduled ? 'Replace Plan' : '+ Assign'}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setScheduleModalRoutine(null)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Routine Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveNewRoutine}
            className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Create Custom Workout Routine
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Routine Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest & Tricep Hypertrophy Blast"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Description / Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. High intensity supersets with 90s rest periods"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Split Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as RoutineTemplate['category'])}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden"
                  >
                    <option value="Custom">Custom</option>
                    <option value="PPL">PPL</option>
                    <option value="Upper/Lower">Upper/Lower</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Conditioning">Conditioning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Frequency (Days / Week)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={newDaysPerWeek}
                    onChange={(e) => setNewDaysPerWeek(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Add Exercises Section */}
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <label className="block text-xs font-semibold text-neutral-200">
                  Select Exercises ({newConfigs.length})
                </label>

                <div className="flex gap-2">
                  <select
                    value={selectedExToAdd}
                    onChange={(e) => setSelectedExToAdd(e.target.value)}
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-200 focus:outline-hidden"
                  >
                    <option value="">Choose an exercise to add...</option>
                    {exercises.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.primaryMuscle.replace('_', ' ')})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddExerciseToNewRoutine}
                    className="px-3 py-2 text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors"
                  >
                    + Add
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pt-1">
                  {newConfigs.map((cfg, idx) => {
                    const ex = exercises.find((e) => e.id === cfg.exerciseId);
                    return (
                      <div
                        key={`${cfg.exerciseId}-${idx}`}
                        className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-800 text-xs"
                      >
                        <span className="font-medium text-neutral-200 truncate max-w-[150px]">
                          {ex?.name}
                        </span>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-neutral-500">Sets:</span>
                            <input
                              type="number"
                              min="1"
                              value={cfg.targetSets}
                              onChange={(e) => {
                                const updated = [...newConfigs];
                                updated[idx].targetSets = parseInt(e.target.value, 10) || 1;
                                setNewConfigs(updated);
                              }}
                              className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-center text-xs"
                            />
                          </div>

                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-neutral-500">Reps:</span>
                            <input
                              type="text"
                              value={cfg.targetReps}
                              onChange={(e) => {
                                const updated = [...newConfigs];
                                updated[idx].targetReps = e.target.value;
                                setNewConfigs(updated);
                              }}
                              className="w-16 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-center text-xs"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseFromNewRoutine(idx)}
                            className="text-neutral-500 hover:text-rose-400 p-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newName.trim() || newConfigs.length === 0}
                className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded transition-colors"
              >
                Save Routine
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
