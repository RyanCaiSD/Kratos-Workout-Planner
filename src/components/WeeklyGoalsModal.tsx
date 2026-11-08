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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  WeeklyGoal,
  CustomMilestone,
  MuscleGroup,
  UnitSystem,
} from '../types/fitness';
import {
  MUSCLE_GROUP_LABELS,
  exportDataAsJSON,
  importDataFromJSON,
} from '../utils/storage';

interface WeeklyGoalsModalProps {
  goal: WeeklyGoal;
  unit: UnitSystem;
  onSaveGoal: (newGoal: WeeklyGoal) => void;
  onClose: () => void;
  onResetData: () => void;
}

export const WeeklyGoalsModal: React.FC<WeeklyGoalsModalProps> = ({
  goal,
  unit,
  onSaveGoal,
  onClose,
  onResetData,
}) => {
  const [formData, setFormData] = useState<WeeklyGoal>({ ...goal });
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneTarget, setNewMilestoneTarget] = useState<number>(100);
  const [newMilestoneCurrent, setNewMilestoneCurrent] = useState<number>(0);
  const [newMilestoneUnit, setNewMilestoneUnit] = useState<string>(unit);
  const [newMilestoneCat, setNewMilestoneCat] = useState<CustomMilestone['category']>('strength');

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
    onSaveGoal(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-neutral-100">
              Weekly Fitness Targets & Milestones
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto space-y-5 pr-1 flex-1">
          {/* Section 1: Weekly Volume & Frequency Targets */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              1. Weekly Frequency & Volume Targets
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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

          {/* Section 2: Muscle Group Specific Target Sets */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              2. Target Working Sets by Muscle Group (Per Week)
            </h3>
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
                  className="flex items-center justify-between p-2 bg-neutral-950 rounded border border-neutral-800 text-xs"
                >
                  <span className="text-neutral-300">{MUSCLE_GROUP_LABELS[m]}</span>
                  <input
                    type="number"
                    min="0"
                    max="30"
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

          {/* Section 3: Custom Personal Milestones */}
          <div className="space-y-3 pt-2 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                3. Personal Milestones & Strength Goals
              </h3>
              <span className="text-[11px] text-neutral-500 font-mono">
                {formData.milestones.filter((m) => m.completed).length} /{' '}
                {formData.milestones.length} Achieved
              </span>
            </div>

            {/* Existing Milestones List */}
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
                  placeholder="e.g. Overhead Press bodyweight (175 lbs)"
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
                  Add Milestone
                </button>
              </div>
            </form>
          </div>

          {/* Section 4: Data Management & Backup */}
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
                      'Clear all workout session history and reset metrics back to 0?'
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
        <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
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
            className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors"
          >
            Save Weekly Targets
          </button>
        </div>
      </div>
    </div>
  );
};
