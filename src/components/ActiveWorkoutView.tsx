import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Info,
  Clock,
  Sparkles,
  Dumbbell,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  Exercise,
  UnitSystem,
  PersonalRecord,
  SetType,
} from '../types/fitness';
import { soundController } from '../utils/audio';
import { calculate1RM, formatWeight } from '../utils/storage';

interface ActiveWorkoutViewProps {
  session: WorkoutSession | null;
  exercises: Exercise[];
  prs: PersonalRecord[];
  unit: UnitSystem;
  onUpdateSession: (session: WorkoutSession) => void;
  onFinishWorkout: (completedSession: WorkoutSession, newPrs: PersonalRecord[]) => void;
  onDiscardWorkout: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  session,
  exercises,
  prs,
  unit,
  onUpdateSession,
  onFinishWorkout,
  onDiscardWorkout,
}) => {
  // Session stopwatch state
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Rest timer state
  const [restRemaining, setRestRemaining] = useState<number>(0);
  const [restInitial, setRestInitial] = useState<number>(90);
  const [isRestActive, setIsRestActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals & UI states
  const [showAddExerciseModal, setShowAddExerciseModal] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [expandedExerciseTips, setExpandedExerciseTips] = useState<Record<string, boolean>>({});

  // Detect and track PRs broken during this session
  const [brokenPrs, setBrokenPrs] = useState<PersonalRecord[]>([]);

  // Timer interval references
  const stopwatchRef = useRef<number | null>(null);
  const restTimerRef = useRef<number | null>(null);

  // Initialize elapsed time based on session start time
  useEffect(() => {
    if (!session) return;
    const startMs = new Date(session.startTime).getTime();
    const currentMs = Date.now();
    const initialElapsed = Math.max(0, Math.floor((currentMs - startMs) / 1000));
    setElapsedSeconds(initialElapsed);
    setSessionNotes(session.notes || '');
  }, [session?.id]);

  // Stopwatch ticker
  useEffect(() => {
    if (isRunning && session) {
      stopwatchRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else if (stopwatchRef.current) {
      clearInterval(stopwatchRef.current);
    }
    return () => {
      if (stopwatchRef.current) clearInterval(stopwatchRef.current);
    };
  }, [isRunning, session]);

  // Rest timer ticker
  useEffect(() => {
    if (isRestActive && restRemaining > 0) {
      restTimerRef.current = window.setInterval(() => {
        setRestRemaining((prev) => {
          if (prev <= 1) {
            setIsRestActive(false);
            if (soundEnabled) {
              soundController.playRestCompleteChime();
            }
            return 0;
          }
          if (soundEnabled && prev <= 4 && prev > 1) {
            soundController.playCountdownTick();
          }
          return prev - 1;
        });
      }, 1000);
    } else if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
    }
    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isRestActive, restRemaining, soundEnabled]);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-neutral-900/40 border border-neutral-800 rounded min-h-[400px]">
        <div className="flex h-12 w-12 items-center justify-center rounded bg-neutral-800 text-neutral-400 mb-4">
          <Dumbbell className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-neutral-100 mb-1">
          No Active Workout in Progress
        </h3>
        <p className="text-sm text-neutral-400 max-w-sm mb-6">
          Pick a routine from your Weekly Planner or select a template to launch a live tracking session with rest timers and PR detection.
        </p>
      </div>
    );
  }

  // Format stopwatch seconds MM:SS or HH:MM:SS
  const formatStopwatch = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Trigger rest timer
  const startRestTimer = (seconds: number = 90) => {
    setRestInitial(seconds);
    setRestRemaining(seconds);
    setIsRestActive(true);
  };

  // Adjust rest timer
  const adjustRestTime = (deltaSeconds: number) => {
    setRestRemaining((prev) => Math.max(0, prev + deltaSeconds));
  };

  // Compute live session stats
  const totalCompletedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSessionSets = session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);

  const currentVolume = session.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets
        .filter((s) => s.completed && s.type !== 'warmup')
        .reduce((sum, s) => sum + s.weight * s.reps, 0)
    );
  }, 0);

  // Set toggle completion
  const handleToggleSetComplete = (
    exerciseIndex: number,
    setIndex: number,
    completed: boolean
  ) => {
    const updated = { ...session };
    const targetSet = updated.exercises[exerciseIndex].sets[setIndex];
    targetSet.completed = completed;

    // Check for PR on completion
    if (completed && targetSet.type !== 'warmup' && targetSet.weight > 0 && targetSet.reps > 0) {
      const exerciseId = updated.exercises[exerciseIndex].exerciseId;
      const exerciseName = updated.exercises[exerciseIndex].exerciseName;
      const current1RM = calculate1RM(targetSet.weight, targetSet.reps);

      const existingPr = prs.find((p) => p.exerciseId === exerciseId);
      const isNewPr = !existingPr || current1RM > existingPr.estimated1RM;

      if (isNewPr) {
        const newRecord: PersonalRecord = {
          exerciseId,
          exerciseName,
          weight: targetSet.weight,
          reps: targetSet.reps,
          estimated1RM: current1RM,
          date: session.date,
        };

        setBrokenPrs((prev) => {
          const filtered = prev.filter((p) => p.exerciseId !== exerciseId);
          return [...filtered, newRecord];
        });

        if (soundEnabled) {
          soundController.playPrFanfare();
        }
      }

      // Automatically trigger rest timer on set completion!
      startRestTimer(restInitial);
    }

    updated.totalVolume = currentVolume;
    updated.totalSets = totalCompletedSets;
    onUpdateSession(updated);
  };

  // Update set values
  const handleUpdateSetValue = (
    exerciseIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    val: unknown
  ) => {
    const updated = { ...session };
    const targetSet = updated.exercises[exerciseIndex].sets[setIndex];
    // @ts-expect-error dynamic property update
    targetSet[field] = val;
    onUpdateSession(updated);
  };

  // Add set to an exercise
  const handleAddSet = (exerciseIndex: number) => {
    const updated = { ...session };
    const ex = updated.exercises[exerciseIndex];
    const prevSet = ex.sets[ex.sets.length - 1];
    const newSet: WorkoutSet = {
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      setNumber: ex.sets.length + 1,
      type: 'working',
      weight: prevSet ? prevSet.weight : 0,
      reps: prevSet ? prevSet.reps : 10,
      completed: false,
      previousGhost: prevSet ? { weight: prevSet.weight, reps: prevSet.reps } : undefined,
    };
    ex.sets.push(newSet);
    onUpdateSession(updated);
  };

  // Delete set
  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    const updated = { ...session };
    const ex = updated.exercises[exerciseIndex];
    ex.sets.splice(setIndex, 1);
    ex.sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });
    onUpdateSession(updated);
  };

  // Remove exercise from active session
  const handleRemoveExercise = (exerciseIndex: number) => {
    const updated = { ...session };
    updated.exercises.splice(exerciseIndex, 1);
    onUpdateSession(updated);
  };

  // Add exercise to active session
  const handleAddExerciseToSession = (ex: Exercise) => {
    const updated = { ...session };
    const existingPr = prs.find((p) => p.exerciseId === ex.id);

    const initialSets: WorkoutSet[] = [
      {
        id: `s-${Date.now()}-1`,
        setNumber: 1,
        type: 'working',
        weight: existingPr ? existingPr.weight : 135,
        reps: ex.defaultReps || 10,
        completed: false,
        previousGhost: existingPr
          ? { weight: existingPr.weight, reps: existingPr.reps }
          : undefined,
      },
      {
        id: `s-${Date.now()}-2`,
        setNumber: 2,
        type: 'working',
        weight: existingPr ? existingPr.weight : 135,
        reps: ex.defaultReps || 10,
        completed: false,
      },
      {
        id: `s-${Date.now()}-3`,
        setNumber: 3,
        type: 'working',
        weight: existingPr ? existingPr.weight : 135,
        reps: ex.defaultReps || 10,
        completed: false,
      },
    ];

    const newWorkoutEx: WorkoutExercise = {
      exerciseId: ex.id,
      exerciseName: ex.name,
      primaryMuscle: ex.primaryMuscle,
      sets: initialSets,
    };

    updated.exercises.push(newWorkoutEx);
    onUpdateSession(updated);
    setShowAddExerciseModal(false);
  };

  // Complete workout button click
  const handleOpenFinishModal = () => {
    setShowFinishModal(true);
    // Trigger celebratory confetti burst!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleConfirmFinish = () => {
    const durationMins = Math.max(1, Math.round(elapsedSeconds / 60));
    const finalSession: WorkoutSession = {
      ...session,
      durationMinutes: durationMins,
      endTime: new Date().toISOString(),
      completed: true,
      totalVolume: currentVolume,
      totalSets: totalCompletedSets,
      notes: sessionNotes,
      prsBroken: brokenPrs.map((p) => p.exerciseName),
    };

    onFinishWorkout(finalSession, brokenPrs);
    setShowFinishModal(false);
  };

  const filteredExercisesToAdd = exercises.filter(
    (e) =>
      e.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      e.primaryMuscle.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Session Cockpit Bar */}
      <div className="p-4 bg-neutral-900 border border-neutral-800 rounded flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-14 z-30 shadow-md">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-0.5">
              <span className="font-mono text-amber-400 font-bold uppercase tracking-wider">
                Active Workout
              </span>
              <span aria-hidden="true">·</span>
              <span>{session.date}</span>
            </div>
            <input
              type="text"
              value={session.title}
              onChange={(e) => onUpdateSession({ ...session, title: e.target.value })}
              className="text-lg font-bold text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-amber-400 focus:outline-hidden transition-colors"
            />
          </div>
        </div>

        {/* Stopwatch & Rest Timer Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Main Stopwatch */}
          <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 font-mono">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-base font-bold text-neutral-100 tabular-nums">
              {formatStopwatch(elapsedSeconds)}
            </span>
            <button
              onClick={() => setIsRunning(!isRunning)}
              title={isRunning ? 'Pause Timer' : 'Resume Timer'}
              className="p-1 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-neutral-950 rounded border border-neutral-800 text-xs font-mono">
            <div>
              <span className="text-neutral-500">Volume: </span>
              <span className="text-neutral-100 font-bold tabular-nums">
                {currentVolume.toLocaleString()} {unit}
              </span>
            </div>
            <span className="text-neutral-700">|</span>
            <div>
              <span className="text-neutral-500">Sets: </span>
              <span className="text-neutral-100 font-bold tabular-nums">
                {totalCompletedSets}/{totalSessionSets}
              </span>
            </div>
            {brokenPrs.length > 0 && (
              <>
                <span className="text-neutral-700">|</span>
                <div className="flex items-center gap-1 text-amber-400 font-bold">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>{brokenPrs.length} PR</span>
                </div>
              </>
            )}
          </div>

          {/* Rest Timer Widget */}
          <div className="flex items-center gap-1.5 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800">
            <span className="text-xs text-neutral-400 font-mono">Rest:</span>
            <span
              className={`text-sm font-mono font-bold tabular-nums ${
                isRestActive ? 'text-amber-400' : 'text-neutral-400'
              }`}
            >
              {formatRestTime(restRemaining)}
            </span>

            {isRestActive ? (
              <div className="flex items-center gap-1 ml-1">
                <button
                  onClick={() => adjustRestTime(30)}
                  className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded"
                >
                  +30s
                </button>
                <button
                  onClick={() => setIsRestActive(false)}
                  className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded"
                >
                  Skip
                </button>
              </div>
            ) : (
              <button
                onClick={() => startRestTimer(90)}
                className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-300 hover:bg-neutral-700 rounded"
              >
                Start 90s
              </button>
            )}

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
              className="p-1 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="h-3.5 w-3.5 text-neutral-300" />
              ) : (
                <VolumeX className="h-3.5 w-3.5 text-neutral-600" />
              )}
            </button>
          </div>

          {/* Complete / Discard Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenFinishModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors whitespace-nowrap"
            >
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>Finish Workout</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to discard this workout?')) {
                  onDiscardWorkout();
                }
              }}
              title="Discard Workout"
              className="p-1.5 text-neutral-500 hover:text-rose-400 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* PR Celebration Alert Banner if any broken in this session */}
      {brokenPrs.length > 0 && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Trophy className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>New Personal Records achieved:</strong>{' '}
              {brokenPrs.map((p) => `${p.exerciseName} (${p.weight} ${unit} × ${p.reps})`).join(', ')}
            </span>
          </div>
          <span className="text-xs font-mono text-amber-400/80 uppercase font-semibold">
            Progressive Overload
          </span>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        {session.exercises.map((workoutEx, exIdx) => {
          const libraryEx = exercises.find((e) => e.id === workoutEx.exerciseId);
          const showTips = !!expandedExerciseTips[workoutEx.exerciseId];
          const historicalPr = prs.find((p) => p.exerciseId === workoutEx.exerciseId);

          return (
            <div
              key={`${workoutEx.exerciseId}-${exIdx}`}
              className="p-4 bg-neutral-900/60 border border-neutral-800 rounded space-y-3"
            >
              {/* Exercise Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-100">
                      {workoutEx.exerciseName}
                    </h3>
                    {historicalPr && (
                      <span className="text-[11px] font-mono text-amber-400/80">
                        PR: {historicalPr.weight} {unit} × {historicalPr.reps} (1RM ~{historicalPr.estimated1RM} {unit})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400">
                    <span className="capitalize">{workoutEx.primaryMuscle.replace('_', ' ')}</span>
                    {libraryEx && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{libraryEx.equipment}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {libraryEx?.tips && (
                    <button
                      onClick={() =>
                        setExpandedExerciseTips((prev) => ({
                          ...prev,
                          [workoutEx.exerciseId]: !prev[workoutEx.exerciseId],
                        }))
                      }
                      className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
                    >
                      <Info className="h-3 w-3" />
                      <span>Form Tips</span>
                      {showTips ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoveExercise(exIdx)}
                    title="Remove Exercise"
                    className="p-1 text-neutral-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Form Tips Collapsible */}
              {showTips && libraryEx?.tips && (
                <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded text-xs text-neutral-300 space-y-1">
                  <div className="font-semibold text-amber-400">Execution Tip:</div>
                  <p>{libraryEx.tips}</p>
                </div>
              )}

              {/* Set-by-Set Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-mono">
                      <th className="py-2 px-2 w-12 text-center">Set</th>
                      <th className="py-2 px-2 w-28">Previous</th>
                      <th className="py-2 px-2 w-28">Type</th>
                      <th className="py-2 px-2 w-24">Weight ({unit})</th>
                      <th className="py-2 px-2 w-20">Reps</th>
                      <th className="py-2 px-2 w-20">RPE</th>
                      <th className="py-2 px-2 w-12 text-center">Done</th>
                      <th className="py-2 px-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {workoutEx.sets.map((set, setIdx) => {
                      return (
                        <tr
                          key={set.id}
                          className={`transition-colors ${
                            set.completed ? 'bg-neutral-950/40 text-neutral-400' : 'hover:bg-neutral-800/30'
                          }`}
                        >
                          {/* Set Number */}
                          <td className="py-2 px-2 text-center font-mono font-medium text-neutral-300">
                            {set.setNumber}
                          </td>

                          {/* Previous ghost record */}
                          <td className="py-2 px-2 font-mono text-neutral-500 tabular-nums">
                            {set.previousGhost ? (
                              `${set.previousGhost.weight} × ${set.previousGhost.reps}`
                            ) : (
                              <span className="text-neutral-700">—</span>
                            )}
                          </td>

                          {/* Set Type */}
                          <td className="py-2 px-2">
                            <select
                              value={set.type}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  exIdx,
                                  setIdx,
                                  'type',
                                  e.target.value as SetType
                                )
                              }
                              className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 text-xs text-neutral-200 focus:outline-hidden focus:border-amber-400"
                            >
                              <option value="warmup">Warmup</option>
                              <option value="working">Working</option>
                              <option value="dropset">Drop Set</option>
                              <option value="failure">To Failure</option>
                            </select>
                          </td>

                          {/* Weight input */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              step="2.5"
                              min="0"
                              value={set.weight || ''}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  exIdx,
                                  setIdx,
                                  'weight',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              placeholder="0"
                              className="w-20 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-100 tabular-nums focus:outline-hidden focus:border-amber-400"
                            />
                          </td>

                          {/* Reps input */}
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              min="0"
                              value={set.reps || ''}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  exIdx,
                                  setIdx,
                                  'reps',
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              placeholder="0"
                              className="w-16 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 font-mono text-neutral-100 tabular-nums focus:outline-hidden focus:border-amber-400"
                            />
                          </td>

                          {/* RPE input */}
                          <td className="py-2 px-2">
                            <select
                              value={set.rpe || ''}
                              onChange={(e) =>
                                handleUpdateSetValue(
                                  exIdx,
                                  setIdx,
                                  'rpe',
                                  e.target.value ? parseFloat(e.target.value) : undefined
                                )
                              }
                              className="bg-neutral-900 border border-neutral-800 rounded px-1.5 py-1 font-mono text-neutral-300 focus:outline-hidden"
                            >
                              <option value="">—</option>
                              <option value="6">6</option>
                              <option value="7">7</option>
                              <option value="8">8</option>
                              <option value="8.5">8.5</option>
                              <option value="9">9</option>
                              <option value="9.5">9.5</option>
                              <option value="10">10</option>
                            </select>
                          </td>

                          {/* Done Checkbox */}
                          <td className="py-2 px-2 text-center">
                            <button
                              onClick={() =>
                                handleToggleSetComplete(exIdx, setIdx, !set.completed)
                              }
                              className={`flex h-6 w-6 items-center justify-center rounded border transition-colors mx-auto ${
                                set.completed
                                  ? 'bg-emerald-500 border-emerald-400 text-neutral-950'
                                  : 'bg-neutral-900 border-neutral-700 hover:border-amber-400 text-transparent'
                              }`}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3]" />
                            </button>
                          </td>

                          {/* Delete Set */}
                          <td className="py-2 px-1 text-right">
                            <button
                              onClick={() => handleDeleteSet(exIdx, setIdx)}
                              className="text-neutral-600 hover:text-rose-400 transition-colors p-1"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add Set Button */}
              <div className="pt-1">
                <button
                  onClick={() => handleAddSet(exIdx)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/50 rounded transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Set</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Exercise Trigger Button */}
        <button
          onClick={() => setShowAddExerciseModal(true)}
          className="w-full flex items-center justify-center gap-2 p-3.5 border border-dashed border-neutral-700 hover:border-amber-400 rounded text-xs font-semibold text-neutral-300 hover:text-amber-400 bg-neutral-900/30 hover:bg-neutral-900/60 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Exercise to Session</span>
        </button>
      </div>

      {/* Add Exercise Modal */}
      {showAddExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100">
                Add Exercise to Workout
              </h3>
              <button
                onClick={() => setShowAddExerciseModal(false)}
                className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search exercise name or muscle..."
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
            />

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredExercisesToAdd.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => handleAddExerciseToSession(ex)}
                  className="w-full flex items-center justify-between p-3 text-left bg-neutral-800/40 hover:bg-neutral-800 rounded border border-neutral-700/50 transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-neutral-100">
                      {ex.name}
                    </div>
                    <div className="text-xs text-neutral-400 capitalize">
                      {ex.primaryMuscle.replace('_', ' ')} · {ex.equipment}
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-mono font-medium">
                    + Add
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowAddExerciseModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Workout Summary Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                <Trophy className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-100">Workout Completed!</h3>
              <p className="text-xs text-neutral-400">
                Outstanding effort. Here is your session recap:
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-950 rounded border border-neutral-800 text-center font-mono">
              <div>
                <span className="text-[10px] uppercase text-neutral-500">Duration</span>
                <div className="text-base font-bold text-neutral-100 tabular-nums">
                  {Math.max(1, Math.round(elapsedSeconds / 60))}m
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-neutral-500">Volume</span>
                <div className="text-base font-bold text-neutral-100 tabular-nums">
                  {currentVolume.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-neutral-500">Completed Sets</span>
                <div className="text-base font-bold text-neutral-100 tabular-nums">
                  {totalCompletedSets}
                </div>
              </div>
            </div>

            {brokenPrs.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded space-y-1">
                <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Personal Records Smashed:</span>
                </div>
                <ul className="text-xs text-amber-200/90 list-disc list-inside">
                  {brokenPrs.map((pr) => (
                    <li key={pr.exerciseId}>
                      {pr.exerciseName}: {pr.weight} {unit} × {pr.reps} reps (1RM: {pr.estimated1RM} {unit})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">
                Session Notes & Reflection
              </label>
              <textarea
                rows={3}
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="How did recovery, grip, or bar speed feel? Any tweaks for next time?"
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
              >
                Back to Workout
              </button>
              <button
                onClick={handleConfirmFinish}
                className="px-5 py-2 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
              >
                Save & Update Goals
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
