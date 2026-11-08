/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  WorkoutSession,
  WeeklyGoal,
  DayPlan,
  RoutineTemplate,
  Exercise,
  PersonalRecord,
  UnitSystem,
  UserAccount,
  UserOnboardingProfile,
} from './types/fitness';
import {
  getSavedAccounts,
  getCurrentUser,
  setCurrentUserId,
  createNewUserAccount,
  saveAccounts,
  getUserSessions,
  saveUserSessions,
  getUserWeeklyGoal,
  saveUserWeeklyGoal,
  getUserSchedule,
  saveUserSchedule,
  getUserRoutines,
  saveUserRoutines,
  getUserPRs,
  saveUserPRs,
  getUserUnit,
  saveUserUnit,
  getUserActiveSession,
  saveUserActiveSession,
  getExercises,
  saveExercises,
  convertAllUserData,
  formatDateToISO,
  logoutUser,
  loadDemoAccount,
} from './utils/storage';
import { Navigation, NavTab } from './components/Navigation';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { ActiveWorkoutView } from './components/ActiveWorkoutView';
import { ProgressAnalytics } from './components/ProgressAnalytics';
import { RoutinesManager } from './components/RoutinesManager';
import { ExerciseLibraryView } from './components/ExerciseLibraryView';
import { WeeklyGoalsModal } from './components/WeeklyGoalsModal';
import { SmartRoutineGenerator } from './components/SmartRoutineGenerator';
import { AuthModal } from './components/AuthModal';
import { OnboardingModal } from './components/OnboardingModal';
import { LandingHomePage } from './components/LandingHomePage';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('planner');

  // Multi-user Account State
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // User-scoped persistent data
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState<WeeklyGoal>({
    targetWorkouts: 0,
    targetActiveMinutes: 0,
    targetTotalSets: 0,
    targetVolume: 0,
    targetCardioMinutes: 0,
    targetMuscleSets: {},
    milestones: [],
  });
  const [schedule, setSchedule] = useState<DayPlan[]>([]);
  const [routines, setRoutines] = useState<RoutineTemplate[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [prs, setPrs] = useState<PersonalRecord[]>([]);
  const [unit, setUnit] = useState<UnitSystem>('lbs');

  // Modals state
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showGoalsModal, setShowGoalsModal] = useState<boolean>(false);
  const [showSmartGenerator, setShowSmartGenerator] = useState<boolean>(false);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);

  // Load user data into React state
  const loadUserData = useCallback((user: UserAccount) => {
    const uId = user.id;
    setSessions(getUserSessions(uId));
    setActiveSession(getUserActiveSession(uId));
    setWeeklyGoal(getUserWeeklyGoal(uId));
    setSchedule(getUserSchedule(uId));
    setRoutines(getUserRoutines(uId));
    setPrs(getUserPRs(uId));
    setUnit(getUserUnit(uId));
  }, []);

  // Initial load
  useEffect(() => {
    const savedAccounts = getSavedAccounts();
    setAccounts(savedAccounts);
    const active = getCurrentUser();
    setCurrentUser(active);
    setExercises(getExercises());

    if (active) {
      loadUserData(active);
    }
  }, [loadUserData]);

  // Switch / Select User
  const handleSelectUser = (user: UserAccount) => {
    setCurrentUserId(user.id);
    setCurrentUser(user);
    loadUserData(user);
  };

  // Create New Account (Starts at 0!)
  const handleCreateAccount = (name: string, email: string) => {
    const newAcc = createNewUserAccount(name, email);
    const updatedAccounts = getSavedAccounts();
    setAccounts(updatedAccounts);
    setCurrentUser(newAcc);
    loadUserData(newAcc);
    setShowAuthModal(false);
  };

  // Log out back to Home / Login Page
  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setActiveSession(null);
    setActiveTab('planner');
  };

  // Explicit demo mode (only loads if user explicitly clicks demo mode)
  const handleExploreDemo = () => {
    const demoAcc = loadDemoAccount();
    const updated = getSavedAccounts();
    setAccounts(updated);
    setCurrentUser(demoAcc);
    loadUserData(demoAcc);
  };

  // Complete Onboarding & Activate Generated Plan
  const handleCompleteOnboarding = (
    profile: UserOnboardingProfile,
    generatedGoal: WeeklyGoal,
    generatedRoutines: RoutineTemplate[],
    generatedSchedule: DayPlan[]
  ) => {
    if (!currentUser) return;

    // Update user account flag
    const updatedUser: UserAccount = {
      ...currentUser,
      hasCompletedOnboarding: true,
    };
    setCurrentUser(updatedUser);

    const updatedAccounts = accounts.map((a) => (a.id === updatedUser.id ? updatedUser : a));
    setAccounts(updatedAccounts);
    saveAccounts(updatedAccounts);

    // Save generated workout plan and goals starting from 0
    setWeeklyGoal(generatedGoal);
    saveUserWeeklyGoal(updatedUser.id, generatedGoal);

    setRoutines(generatedRoutines);
    saveUserRoutines(updatedUser.id, generatedRoutines);

    setSchedule(generatedSchedule);
    saveUserSchedule(updatedUser.id, generatedSchedule);

    setUnit(profile.unit);
    saveUserUnit(updatedUser.id, profile.unit);

    // Ensure sessions and PRs start cleanly at 0
    setSessions([]);
    saveUserSessions(updatedUser.id, []);

    setPrs([]);
    saveUserPRs(updatedUser.id, []);

    setActiveTab('planner');
  };

  // Unit conversion toggle (lbs <-> kg) with proper mathematical conversion of numbers
  const handleToggleUnit = () => {
    if (!currentUser) return;
    const nextUnit: UnitSystem = unit === 'lbs' ? 'kg' : 'lbs';

    // Convert all user state numbers
    const converted = convertAllUserData(sessions, activeSession, prs, weeklyGoal, unit, nextUnit);

    // Update React states
    setUnit(nextUnit);
    setSessions(converted.sessions);
    setActiveSession(converted.activeSession);
    setPrs(converted.prs);
    setWeeklyGoal(converted.weeklyGoal);

    // Save to user storage
    saveUserUnit(currentUser.id, nextUnit);
    saveUserSessions(currentUser.id, converted.sessions);
    saveUserActiveSession(currentUser.id, converted.activeSession);
    saveUserPRs(currentUser.id, converted.prs);
    saveUserWeeklyGoal(currentUser.id, converted.weeklyGoal);
  };

  // Sync active session whenever it changes
  const handleUpdateActiveSession = (session: WorkoutSession) => {
    setActiveSession(session);
    if (currentUser) {
      saveUserActiveSession(currentUser.id, session);
    }
  };

  // Launch a new workout
  const handleStartWorkout = (routine?: RoutineTemplate) => {
    if (activeSession) {
      setActiveTab('active');
      return;
    }

    const todayIso = formatDateToISO(new Date(2026, 10, 7));

    let workoutExercises: import('./types/fitness').WorkoutExercise[] = [];
    if (routine) {
      workoutExercises = routine.exercises.map((cfg, idx) => {
        const ex = exercises.find((e) => e.id === cfg.exerciseId);
        const existingPr = prs.find((p) => p.exerciseId === cfg.exerciseId);
        const defaultWeight = unit === 'kg' ? 60 : 135;
        const initialWeight = existingPr ? existingPr.weight : defaultWeight;

        const sets = Array.from({ length: cfg.targetSets }, (_, setIdx) => ({
          id: `s-${Date.now()}-${idx}-${setIdx}`,
          setNumber: setIdx + 1,
          type: 'working' as const,
          weight: initialWeight,
          reps: parseInt(cfg.targetReps, 10) || 8,
          completed: false,
          previousGhost: existingPr
            ? { weight: existingPr.weight, reps: existingPr.reps }
            : undefined,
        }));

        return {
          exerciseId: cfg.exerciseId,
          exerciseName: ex?.name || 'Exercise',
          primaryMuscle: ex?.primaryMuscle || 'chest',
          sets,
        };
      });
    }

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      date: todayIso,
      startTime: new Date().toISOString(),
      durationMinutes: 0,
      title: routine ? routine.name : 'Custom Training Session',
      routineId: routine?.id,
      exercises: workoutExercises,
      totalVolume: 0,
      totalSets: 0,
      completed: false,
    };

    setActiveSession(newSession);
    if (currentUser) {
      saveUserActiveSession(currentUser.id, newSession);
    }
    setActiveTab('active');
  };

  // Finish active workout
  const handleFinishWorkout = (
    completedSession: WorkoutSession,
    newPrs: PersonalRecord[]
  ) => {
    if (!currentUser) return;

    // 1. Add session to history
    const updatedSessions = [completedSession, ...sessions.filter((s) => s.id !== completedSession.id)];
    setSessions(updatedSessions);
    saveUserSessions(currentUser.id, updatedSessions);

    // 2. Clear active session
    setActiveSession(null);
    saveUserActiveSession(currentUser.id, null);

    // 3. Update personal records if any new ones broken
    if (newPrs.length > 0) {
      let updatedPrs = [...prs];
      newPrs.forEach((pr) => {
        const exists = updatedPrs.findIndex((p) => p.exerciseId === pr.exerciseId);
        if (exists >= 0) {
          updatedPrs[exists] = pr;
        } else {
          updatedPrs.push(pr);
        }
      });
      setPrs(updatedPrs);
      saveUserPRs(currentUser.id, updatedPrs);
    }

    // 4. Update schedule for today
    const updatedSchedule = [...schedule];
    const todayPlanIndex = updatedSchedule.findIndex((d) => d.date === completedSession.date);
    if (todayPlanIndex >= 0) {
      updatedSchedule[todayPlanIndex].completedWorkoutId = completedSession.id;
    } else {
      updatedSchedule.push({
        date: completedSession.date,
        routineName: completedSession.title,
        isRestDay: false,
        completedWorkoutId: completedSession.id,
      });
    }
    setSchedule(updatedSchedule);
    saveUserSchedule(currentUser.id, updatedSchedule);

    // 5. Navigate to Weekly Planner to view goal progress
    setActiveTab('planner');
  };

  // Discard workout
  const handleDiscardWorkout = () => {
    setActiveSession(null);
    if (currentUser) {
      saveUserActiveSession(currentUser.id, null);
    }
    setActiveTab('planner');
  };

  // Delete workout session from history
  const handleDeleteSession = (sessionId: string) => {
    if (!currentUser) return;
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    saveUserSessions(currentUser.id, updated);
  };

  // Update schedule
  const handleUpdateSchedule = (newSchedule: DayPlan[]) => {
    if (!currentUser) return;
    setSchedule(newSchedule);
    saveUserSchedule(currentUser.id, newSchedule);
  };

  // Routine management
  const handleSaveRoutine = (newRoutine: RoutineTemplate) => {
    if (!currentUser) return;
    const exists = routines.findIndex((r) => r.id === newRoutine.id);
    let updated: RoutineTemplate[];
    if (exists >= 0) {
      updated = [...routines];
      updated[exists] = newRoutine;
    } else {
      updated = [newRoutine, ...routines];
    }
    setRoutines(updated);
    saveUserRoutines(currentUser.id, updated);
  };

  const handleDeleteRoutine = (routineId: string) => {
    if (!currentUser) return;
    const updated = routines.filter((r) => r.id !== routineId);
    setRoutines(updated);
    saveUserRoutines(currentUser.id, updated);
  };

  const handleScheduleRoutine = (
    dateIso: string,
    routineId: string,
    routineName: string
  ) => {
    if (!currentUser) return;
    const updated = [...schedule];
    const existingIndex = updated.findIndex((d) => d.date === dateIso);
    const plan: DayPlan = {
      date: dateIso,
      routineId,
      routineName,
      isRestDay: false,
    };
    if (existingIndex >= 0) {
      updated[existingIndex] = { ...updated[existingIndex], ...plan };
    } else {
      updated.push(plan);
    }
    setSchedule(updated);
    saveUserSchedule(currentUser.id, updated);
  };

  // Exercise library management
  const handleAddCustomExercise = (newEx: Exercise) => {
    const updated = [newEx, ...exercises];
    setExercises(updated);
    saveExercises(updated);
  };

  // Weekly goals management with automatic plan adjustment
  const handleSaveWeeklyGoal = (
    newGoal: WeeklyGoal,
    adjustedRoutines?: RoutineTemplate[],
    adjustedSchedule?: DayPlan[]
  ) => {
    if (!currentUser) return;
    setWeeklyGoal(newGoal);
    saveUserWeeklyGoal(currentUser.id, newGoal);

    if (adjustedRoutines && adjustedRoutines.length > 0) {
      setRoutines(adjustedRoutines);
      saveUserRoutines(currentUser.id, adjustedRoutines);
    }

    if (adjustedSchedule && adjustedSchedule.length > 0) {
      setSchedule(adjustedSchedule);
      saveUserSchedule(currentUser.id, adjustedSchedule);
    }
  };

  // Reset current user data to zero
  const handleResetCurrentUserData = () => {
    if (!currentUser) return;
    setSessions([]);
    saveUserSessions(currentUser.id, []);
    setPrs([]);
    saveUserPRs(currentUser.id, []);
    setActiveSession(null);
    saveUserActiveSession(currentUser.id, null);
    setShowGoalsModal(false);
  };

  if (!currentUser) {
    return (
      <LandingHomePage
        savedAccounts={accounts}
        onLogin={handleSelectUser}
        onCreateAccount={handleCreateAccount}
        onExploreDemo={handleExploreDemo}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Navigation */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasActiveSession={!!activeSession}
        unit={unit}
        onToggleUnit={handleToggleUnit}
        onStartNewWorkout={() => handleStartWorkout()}
        onOpenGoalsModal={() => setShowGoalsModal(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'planner' && (
          <WeeklyPlanner
            sessions={sessions}
            weeklyGoal={weeklyGoal}
            schedule={schedule}
            routines={routines}
            unit={unit}
            onUpdateSchedule={handleUpdateSchedule}
            onStartWorkoutWithRoutine={handleStartWorkout}
            onOpenGoalsModal={() => setShowGoalsModal(true)}
            onOpenSmartGenerator={() => setShowSmartGenerator(true)}
            onViewSessionDetails={(session) => {
              setViewingSession(session);
            }}
          />
        )}

        {activeTab === 'active' && (
          <ActiveWorkoutView
            session={activeSession}
            exercises={exercises}
            prs={prs}
            unit={unit}
            onUpdateSession={handleUpdateActiveSession}
            onFinishWorkout={handleFinishWorkout}
            onDiscardWorkout={handleDiscardWorkout}
          />
        )}

        {activeTab === 'progress' && (
          <ProgressAnalytics
            sessions={sessions}
            prs={prs}
            unit={unit}
            onDeleteSession={handleDeleteSession}
            onViewSessionDetails={(session) => setViewingSession(session)}
          />
        )}

        {activeTab === 'routines' && (
          <RoutinesManager
            routines={routines}
            exercises={exercises}
            schedule={schedule}
            onSaveRoutine={handleSaveRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onStartRoutine={handleStartWorkout}
            onScheduleRoutine={handleScheduleRoutine}
            onOpenSmartGenerator={() => setShowSmartGenerator(true)}
          />
        )}

        {activeTab === 'exercises' && (
          <ExerciseLibraryView
            exercises={exercises}
            prs={prs}
            unit={unit}
            onAddCustomExercise={handleAddCustomExercise}
          />
        )}
      </main>

      {/* Onboarding Wizard (Triggers when user creates account for the first time) */}
      {currentUser && !currentUser.hasCompletedOnboarding && (
        <OnboardingModal
          user={currentUser}
          onCompleteOnboarding={handleCompleteOnboarding}
        />
      )}

      {/* Account Log In & Switcher Modal */}
      {showAuthModal && (
        <AuthModal
          currentUser={currentUser}
          accounts={accounts}
          onSelectUser={handleSelectUser}
          onCreateUser={handleCreateAccount}
          onLogout={handleLogout}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {/* Viewing Historical Workout Modal */}
      {viewingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-neutral-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-100">
                  {viewingSession.title}
                </h3>
                <div className="text-xs text-neutral-400 font-mono mt-0.5">
                  {viewingSession.date} · {viewingSession.durationMinutes} mins · {viewingSession.totalSets} sets
                </div>
              </div>
              <button
                onClick={() => setViewingSession(null)}
                className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-400">Total Volume Lifted:</span>
              <span className="text-sm font-bold text-neutral-100">
                {viewingSession.totalVolume.toLocaleString()} {unit}
              </span>
            </div>

            {viewingSession.notes && (
              <div className="p-2.5 bg-neutral-950/70 border border-neutral-800/80 rounded text-xs text-neutral-300 italic">
                "{viewingSession.notes}"
              </div>
            )}

            <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
              {viewingSession.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="p-2.5 bg-neutral-950 rounded border border-neutral-800/80 space-y-1.5">
                  <div className="text-xs font-semibold text-neutral-200">
                    {ex.exerciseName}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ex.sets.map((st) => (
                      <span
                        key={st.id}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-900 border border-neutral-800 text-neutral-300"
                      >
                        Set {st.setNumber}: {st.weight} {unit} × {st.reps}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-neutral-800">
              <button
                onClick={() => setViewingSession(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-300 bg-neutral-800 hover:bg-neutral-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Goals Settings Modal */}
      {showGoalsModal && (
        <WeeklyGoalsModal
          goal={weeklyGoal}
          unit={unit}
          currentSchedule={schedule}
          currentRoutines={routines}
          onSaveGoal={handleSaveWeeklyGoal}
          onClose={() => setShowGoalsModal(false)}
          onResetData={handleResetCurrentUserData}
        />
      )}

      {/* Smart Routine Generator Modal */}
      {showSmartGenerator && (
        <SmartRoutineGenerator
          exercises={exercises}
          onSaveRoutine={handleSaveRoutine}
          onClose={() => setShowSmartGenerator(false)}
        />
      )}

      {/* Clean Domain-Authentic Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-4 px-6 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">KRATOS</span>
            <span aria-hidden="true">·</span>
            <span>
              Signed in as {currentUser?.name || 'Guest'} ({unit.toUpperCase()})
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <button
              onClick={() => setShowAuthModal(true)}
              className="text-neutral-400 hover:text-amber-400 transition-colors"
            >
              Switch Account
            </button>
            <span aria-hidden="true">·</span>
            <span>1 lb = 0.4536 kg</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setShowGoalsModal(true)}
              className="text-neutral-400 hover:text-amber-400 transition-colors"
            >
              Goals & Backup
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
