import React, { useState } from 'react';
import {
  Search,
  Plus,
  Dumbbell,
  Info,
  Trophy,
  Filter,
  Check,
} from 'lucide-react';
import {
  Exercise,
  MuscleGroup,
  Equipment,
  PersonalRecord,
  UnitSystem,
} from '../types/fitness';
import { MUSCLE_GROUP_LABELS } from '../utils/storage';

interface ExerciseLibraryViewProps {
  exercises: Exercise[];
  prs: PersonalRecord[];
  unit: UnitSystem;
  onAddCustomExercise: (exercise: Exercise) => void;
  onSelectExerciseToStart?: (exercise: Exercise) => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({
  exercises,
  prs,
  unit,
  onAddCustomExercise,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState<boolean>(false);

  // New Custom Exercise Form
  const [customName, setCustomName] = useState<string>('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('chest');
  const [customEquipment, setCustomEquipment] = useState<Equipment>('dumbbell');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [customTips, setCustomTips] = useState<string>('');

  const muscles: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Muscles' },
    { id: 'chest', label: 'Chest' },
    { id: 'back', label: 'Back' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'legs_quads', label: 'Quads' },
    { id: 'legs_hamstrings', label: 'Hamstrings' },
    { id: 'glutes', label: 'Glutes' },
    { id: 'biceps', label: 'Biceps' },
    { id: 'triceps', label: 'Triceps' },
    { id: 'core', label: 'Core' },
    { id: 'cardio', label: 'Cardio' },
  ];

  const equipments: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Equipment' },
    { id: 'barbell', label: 'Barbell' },
    { id: 'dumbbell', label: 'Dumbbell' },
    { id: 'cable', label: 'Cable' },
    { id: 'machine', label: 'Machine' },
    { id: 'bodyweight', label: 'Bodyweight' },
  ];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.instructions.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscle =
      selectedMuscle === 'all' ||
      ex.primaryMuscle === selectedMuscle ||
      ex.secondaryMuscles.includes(selectedMuscle as MuscleGroup);
    const matchesEquipment =
      selectedEquipment === 'all' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const handleSaveCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newEx: Exercise = {
      id: `ex-custom-${Date.now()}`,
      name: customName.trim(),
      primaryMuscle: customMuscle,
      secondaryMuscles: [],
      equipment: customEquipment,
      category: 'hypertrophy',
      instructions: customInstructions.trim() || 'Custom movement mechanics.',
      tips: customTips.trim() || undefined,
      defaultSets: 3,
      defaultReps: 10,
      isCustom: true,
    };

    onAddCustomExercise(newEx);
    setShowAddCustomModal(false);
    setCustomName('');
    setCustomInstructions('');
    setCustomTips('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
            <span>Movement Database</span>
            <span aria-hidden="true">·</span>
            <span>Form Cues & PR Tracking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Exercise Library
          </h1>
        </div>

        <button
          onClick={() => setShowAddCustomModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
          <span>Add Custom Exercise</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search exercises by name, cues, or target anatomy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-4 py-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Muscle Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            {muscles.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedMuscle(m.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap ${
                  selectedMuscle === m.id
                    ? 'bg-neutral-100 text-neutral-950 border-neutral-100'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Equipment Dropdown */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs text-neutral-500">Equipment:</span>
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-neutral-300 focus:outline-hidden"
            >
              {equipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exercise Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((ex) => {
          const pr = prs.find((p) => p.exerciseId === ex.id);

          return (
            <div
              key={ex.id}
              onClick={() => setSelectedExerciseForModal(ex)}
              className="flex flex-col justify-between p-4 bg-neutral-900/60 border border-neutral-800 rounded hover:border-neutral-700 cursor-pointer transition-colors space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-bold text-neutral-100 line-clamp-1">
                    {ex.name}
                  </h3>
                  {ex.isCustom && (
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2.5">
                  <span className="capitalize">{MUSCLE_GROUP_LABELS[ex.primaryMuscle]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{ex.equipment}</span>
                </div>

                <p className="text-xs text-neutral-400 line-clamp-2">
                  {ex.instructions}
                </p>
              </div>

              {/* Personal Record Tag */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                {pr ? (
                  <div className="flex items-center gap-1.5 font-mono text-amber-400">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>
                      PR: {pr.weight} {unit} × {pr.reps} (1RM ~{pr.estimated1RM} {unit})
                    </span>
                  </div>
                ) : (
                  <span className="text-neutral-500 font-mono text-[11px]">
                    No recorded sets yet
                  </span>
                )}
                <span className="text-neutral-500 text-[11px] hover:text-neutral-300">
                  Details →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Exercise Detail Modal */}
      {selectedExerciseForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-neutral-100">
                  {selectedExerciseForModal.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                  <span className="capitalize">
                    Primary: {MUSCLE_GROUP_LABELS[selectedExerciseForModal.primaryMuscle]}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">Equipment: {selectedExerciseForModal.equipment}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedExerciseForModal(null)}
                className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Historical PR info */}
            {(() => {
              const pr = prs.find((p) => p.exerciseId === selectedExerciseForModal.id);
              if (!pr) return null;
              return (
                <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-neutral-500">
                      Personal Record
                    </span>
                    <div className="text-sm font-bold font-mono text-amber-400">
                      {pr.weight} {unit} × {pr.reps} reps
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono text-neutral-500">
                      Estimated 1RM
                    </span>
                    <div className="text-sm font-bold font-mono text-neutral-100">
                      {pr.estimated1RM} {unit}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3 text-xs text-neutral-300">
              <div>
                <div className="font-semibold text-neutral-100 mb-1">
                  Step-by-Step Instructions:
                </div>
                <p className="leading-relaxed bg-neutral-950 p-3 rounded border border-neutral-800">
                  {selectedExerciseForModal.instructions}
                </p>
              </div>

              {selectedExerciseForModal.tips && (
                <div>
                  <div className="font-semibold text-amber-400 mb-1">
                    Coach Execution Tip:
                  </div>
                  <p className="leading-relaxed bg-amber-500/10 border border-amber-500/20 p-3 rounded text-amber-200">
                    {selectedExerciseForModal.tips}
                  </p>
                </div>
              )}

              {selectedExerciseForModal.secondaryMuscles.length > 0 && (
                <div>
                  <span className="text-neutral-400">Secondary Muscles: </span>
                  <span className="capitalize text-neutral-200">
                    {selectedExerciseForModal.secondaryMuscles
                      .map((m) => MUSCLE_GROUP_LABELS[m])
                      .join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <button
                onClick={() => setSelectedExerciseForModal(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Exercise Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSaveCustomExercise}
            className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Add Custom Exercise
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-xs text-neutral-400 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incline Cable Hex Press"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Primary Muscle
                  </label>
                  <select
                    value={customMuscle}
                    onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden"
                  >
                    <option value="chest">Chest</option>
                    <option value="back">Back</option>
                    <option value="shoulders">Shoulders</option>
                    <option value="legs_quads">Quads</option>
                    <option value="legs_hamstrings">Hamstrings</option>
                    <option value="glutes">Glutes</option>
                    <option value="biceps">Biceps</option>
                    <option value="triceps">Triceps</option>
                    <option value="core">Core</option>
                    <option value="cardio">Cardio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Equipment
                  </label>
                  <select
                    value={customEquipment}
                    onChange={(e) => setCustomEquipment(e.target.value as Equipment)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden"
                  >
                    <option value="barbell">Barbell</option>
                    <option value="dumbbell">Dumbbell</option>
                    <option value="cable">Cable</option>
                    <option value="machine">Machine</option>
                    <option value="bodyweight">Bodyweight</option>
                    <option value="kettlebell">Kettlebell</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Movement Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Setup, range of motion, and execution..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Coach / Form Tips (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pause 1 second at top squeeze"
                  value={customTips}
                  onChange={(e) => setCustomTips(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!customName.trim()}
                className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors disabled:opacity-50"
              >
                Save Exercise
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
