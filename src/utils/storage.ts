import {
  WorkoutSession,
  WeeklyGoal,
  DayPlan,
  RoutineTemplate,
  Exercise,
  PersonalRecord,
  UnitSystem,
  MuscleGroup,
  UserAccount,
  UserOnboardingProfile,
} from '../types/fitness';
import { INITIAL_EXERCISES } from '../data/exerciseLibrary';
import { DEFAULT_ROUTINES } from '../data/defaultRoutines';
import {
  DEFAULT_WEEKLY_GOAL,
  SEED_WORKOUT_SESSIONS,
  SEED_SCHEDULE,
  INITIAL_PRS,
} from '../data/seedData';

const BASE_KEYS = {
  ACCOUNTS: 'kratos_accounts_v2',
  CURRENT_USER_ID: 'kratos_current_user_id_v2',
  EXERCISES: 'kratos_exercises_v2',
};

export const BLANK_WEEKLY_GOAL: WeeklyGoal = {
  targetWorkouts: 0,
  targetActiveMinutes: 0,
  targetTotalSets: 0,
  targetVolume: 0,
  targetCardioMinutes: 0,
  targetMuscleSets: {},
  milestones: [],
};

// Export / Import all data as JSON
export function exportDataAsJSON(): string {
  const currentUserId = getCurrentUserId() || 'guest';
  const payload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    accounts: getSavedAccounts(),
    currentUserId,
    sessions: getUserSessions(currentUserId),
    weeklyGoal: getUserWeeklyGoal(currentUserId),
    schedule: getUserSchedule(currentUserId),
    routines: getUserRoutines(currentUserId),
    prs: getUserPRs(currentUserId),
    unit: getUserUnit(currentUserId),
  };
  return JSON.stringify(payload, null, 2);
}

export function importDataFromJSON(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') return false;
    const currentUserId = data.currentUserId || getCurrentUserId() || 'guest';
    if (Array.isArray(data.accounts)) saveAccounts(data.accounts);
    if (Array.isArray(data.sessions)) saveUserSessions(currentUserId, data.sessions);
    if (data.weeklyGoal) saveUserWeeklyGoal(currentUserId, data.weeklyGoal);
    if (Array.isArray(data.schedule)) saveUserSchedule(currentUserId, data.schedule);
    if (Array.isArray(data.routines)) saveUserRoutines(currentUserId, data.routines);
    if (Array.isArray(data.prs)) saveUserPRs(currentUserId, data.prs);
    if (data.unit === 'lbs' || data.unit === 'kg') saveUserUnit(currentUserId, data.unit);
    return true;
  } catch {
    return false;
  }
}

// Demo user account pre-populated with realistic history
export const DEMO_USER_ACCOUNT: UserAccount = {
  id: 'usr-demo-ryan',
  name: 'Ryan (Athlete)',
  email: 'ryan@kratosathletics.com',
  createdAt: '2026-10-15T08:00:00.000Z',
  avatarColor: '#f59e0b',
  hasCompletedOnboarding: true,
};

// Helper to get user-scoped storage key
function getUserKey(userId: string | null, keyName: string): string {
  if (!userId) return `kratos_guest_${keyName}`;
  return `kratos_u_${userId}_${keyName}`;
}

// 1RM calculator via standard Epley formula
export function calculate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return Math.round(weight);
  return Math.round(weight * (1 + reps / 30));
}

export function formatWeight(val: number, unit: UnitSystem): string {
  return `${val} ${unit}`;
}

// Precise gym unit conversion with plate-friendly rounding
export function convertWeight(weight: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to || weight === 0) return weight;
  if (from === 'lbs' && to === 'kg') {
    // 1 lb = 0.45359237 kg; round to nearest 0.5 kg
    return Math.round(weight * 0.45359237 * 2) / 2;
  }
  // kg to lbs: 1 kg = 2.20462262 lbs; round to nearest 0.5 lb or 1 lb
  return Math.round(weight * 2.20462262 * 2) / 2;
}

export function convertVolume(volume: number, from: UnitSystem, to: UnitSystem): number {
  if (from === to || volume === 0) return volume;
  if (from === 'lbs' && to === 'kg') {
    return Math.round(volume * 0.45359237);
  }
  return Math.round(volume * 2.20462262);
}

// Convert all user state when toggling between lbs and kg
export function convertAllUserData(
  sessions: WorkoutSession[],
  activeSession: WorkoutSession | null,
  prs: PersonalRecord[],
  weeklyGoal: WeeklyGoal,
  fromUnit: UnitSystem,
  toUnit: UnitSystem
): {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  prs: PersonalRecord[];
  weeklyGoal: WeeklyGoal;
} {
  if (fromUnit === toUnit) {
    return { sessions, activeSession, prs, weeklyGoal };
  }

  // 1. Convert sessions
  const convertedSessions = sessions.map((s) => ({
    ...s,
    totalVolume: convertVolume(s.totalVolume, fromUnit, toUnit),
    exercises: s.exercises.map((ex) => ({
      ...ex,
      sets: ex.sets.map((st) => ({
        ...st,
        weight: convertWeight(st.weight, fromUnit, toUnit),
        previousGhost: st.previousGhost
          ? {
              weight: convertWeight(st.previousGhost.weight, fromUnit, toUnit),
              reps: st.previousGhost.reps,
            }
          : undefined,
      })),
    })),
  }));

  // 2. Convert active session
  let convertedActive: WorkoutSession | null = null;
  if (activeSession) {
    convertedActive = {
      ...activeSession,
      totalVolume: convertVolume(activeSession.totalVolume, fromUnit, toUnit),
      exercises: activeSession.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((st) => ({
          ...st,
          weight: convertWeight(st.weight, fromUnit, toUnit),
          previousGhost: st.previousGhost
            ? {
                weight: convertWeight(st.previousGhost.weight, fromUnit, toUnit),
                reps: st.previousGhost.reps,
              }
            : undefined,
        })),
      })),
    };
  }

  // 3. Convert PRs
  const convertedPrs = prs.map((p) => ({
    ...p,
    weight: convertWeight(p.weight, fromUnit, toUnit),
    estimated1RM: convertWeight(p.estimated1RM, fromUnit, toUnit),
  }));

  // 4. Convert weekly goal
  const convertedGoal: WeeklyGoal = {
    ...weeklyGoal,
    targetVolume: convertVolume(weeklyGoal.targetVolume, fromUnit, toUnit),
    milestones: weeklyGoal.milestones.map((m) => {
      const isWeightMilestone =
        m.unit.toLowerCase() === fromUnit.toLowerCase() || m.category === 'strength';
      if (!isWeightMilestone) return m;

      return {
        ...m,
        currentValue: convertWeight(m.currentValue, fromUnit, toUnit),
        targetValue: convertWeight(m.targetValue, fromUnit, toUnit),
        unit: toUnit,
        title: m.title.replace(new RegExp(`\\b${fromUnit}\\b`, 'gi'), toUnit),
      };
    }),
  };

  return {
    sessions: convertedSessions,
    activeSession: convertedActive,
    prs: convertedPrs,
    weeklyGoal: convertedGoal,
  };
}

// ----------------- USER ACCOUNT MANAGERS -----------------

export function getSavedAccounts(): UserAccount[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(BASE_KEYS.ACCOUNTS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveAccounts(accounts: UserAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BASE_KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export function getCurrentUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(BASE_KEYS.CURRENT_USER_ID) || null;
}

export function setCurrentUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (!userId) {
    localStorage.removeItem(BASE_KEYS.CURRENT_USER_ID);
  } else {
    localStorage.setItem(BASE_KEYS.CURRENT_USER_ID, userId);
  }
}

export function getCurrentUser(): UserAccount | null {
  const currentId = getCurrentUserId();
  if (!currentId) return null;
  const accounts = getSavedAccounts();
  return accounts.find((a) => a.id === currentId) || null;
}

export function logoutUser(): void {
  setCurrentUserId(null);
}

// Explicit demo account generator (only created if user clicks "Explore Demo Mode")
export function loadDemoAccount(): UserAccount {
  const accounts = getSavedAccounts();
  let demoAcc = accounts.find((a) => a.id === DEMO_USER_ACCOUNT.id);
  if (!demoAcc) {
    demoAcc = DEMO_USER_ACCOUNT;
    const updated = [demoAcc, ...accounts];
    saveAccounts(updated);
    saveUserSessions(demoAcc.id, SEED_WORKOUT_SESSIONS);
    saveUserWeeklyGoal(demoAcc.id, DEFAULT_WEEKLY_GOAL);
    saveUserSchedule(demoAcc.id, SEED_SCHEDULE);
    saveUserRoutines(demoAcc.id, DEFAULT_ROUTINES);
    saveUserPRs(demoAcc.id, INITIAL_PRS);
    saveUserUnit(demoAcc.id, 'lbs');
  }
  setCurrentUserId(demoAcc.id);
  return demoAcc;
}

// Create new account starting completely at 0
export function createNewUserAccount(name: string, email: string): UserAccount {
  const accounts = getSavedAccounts();
  const id = `usr-${Date.now()}`;
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
  const avatarColor = colors[accounts.length % colors.length];

  const newAccount: UserAccount = {
    id,
    name: name.trim() || 'New Athlete',
    email: email.trim().toLowerCase(),
    createdAt: new Date().toISOString(),
    avatarColor,
    hasCompletedOnboarding: false,
  };

  const updatedAccounts = [...accounts, newAccount];
  saveAccounts(updatedAccounts);
  setCurrentUserId(id);

  // Initialize ALL state cleanly at ZERO for this new account
  saveUserSessions(id, []);
  saveUserWeeklyGoal(id, BLANK_WEEKLY_GOAL);
  saveUserSchedule(id, []);
  saveUserRoutines(id, DEFAULT_ROUTINES);
  saveUserPRs(id, []);
  saveUserUnit(id, 'lbs');
  saveUserActiveSession(id, null);

  return newAccount;
}

// ----------------- USER SCOPED DATA ACCESSORS -----------------

export function getUserSessions(userId: string): WorkoutSession[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getUserKey(userId, 'sessions'));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserSessions(userId: string, sessions: WorkoutSession[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserKey(userId, 'sessions'), JSON.stringify(sessions));
}

export function getUserWeeklyGoal(userId: string): WeeklyGoal {
  if (typeof window === 'undefined') return BLANK_WEEKLY_GOAL;
  const raw = localStorage.getItem(getUserKey(userId, 'weekly_goal'));
  if (!raw) return BLANK_WEEKLY_GOAL;
  try {
    return JSON.parse(raw);
  } catch {
    return BLANK_WEEKLY_GOAL;
  }
}

export function saveUserWeeklyGoal(userId: string, goal: WeeklyGoal): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserKey(userId, 'weekly_goal'), JSON.stringify(goal));
}

export function getUserSchedule(userId: string): DayPlan[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getUserKey(userId, 'schedule'));
  if (!raw) return [];
  try {
    const list: DayPlan[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    // If demo account or short schedule (< 14 days), merge future items from SEED_SCHEDULE
    if (userId === DEMO_USER_ACCOUNT.id && list.length < SEED_SCHEDULE.length) {
      const merged = [...list];
      SEED_SCHEDULE.forEach((seedDay) => {
        if (!merged.some((d) => d.date === seedDay.date)) {
          merged.push(seedDay);
        }
      });
      saveUserSchedule(userId, merged);
      return merged;
    }
    return list;
  } catch {
    return [];
  }
}

export function saveUserSchedule(userId: string, schedule: DayPlan[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserKey(userId, 'schedule'), JSON.stringify(schedule));
}

export function getUserRoutines(userId: string): RoutineTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_ROUTINES;
  const raw = localStorage.getItem(getUserKey(userId, 'routines'));
  if (!raw) return DEFAULT_ROUTINES;
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROUTINES;
  }
}

export function saveUserRoutines(userId: string, routines: RoutineTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserKey(userId, 'routines'), JSON.stringify(routines));
}

export function getUserPRs(userId: string): PersonalRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(getUserKey(userId, 'prs'));
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveUserPRs(userId: string, prs: PersonalRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserKey(userId, 'prs'), JSON.stringify(prs));
}

export function getUserUnit(userId: string): UnitSystem {
  if (typeof window === 'undefined') return 'lbs';
  return (localStorage.getItem(getUserKey(userId, 'unit')) as UnitSystem) || 'lbs';
}

export function saveUserUnit(userId: string, unit: UnitSystem): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getUserKey(userId, 'unit'), unit);
}

export function getUserActiveSession(userId: string): WorkoutSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(getUserKey(userId, 'active_session'));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUserActiveSession(userId: string, session: WorkoutSession | null): void {
  if (typeof window === 'undefined') return;
  if (!session) {
    localStorage.removeItem(getUserKey(userId, 'active_session'));
  } else {
    localStorage.setItem(getUserKey(userId, 'active_session'), JSON.stringify(session));
  }
}

// Global Exercises
export function getExercises(): Exercise[] {
  if (typeof window === 'undefined') return INITIAL_EXERCISES;
  const raw = localStorage.getItem(BASE_KEYS.EXERCISES);
  if (!raw) {
    localStorage.setItem(BASE_KEYS.EXERCISES, JSON.stringify(INITIAL_EXERCISES));
    return INITIAL_EXERCISES;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXERCISES;
  }
}

export function saveExercises(exercises: Exercise[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BASE_KEYS.EXERCISES, JSON.stringify(exercises));
}

// ----------------- ONBOARDING WORKOUT PLAN GENERATOR -----------------

export function generateOnboardingPlan(
  profile: UserOnboardingProfile,
  anchorDate: Date = new Date(2026, 10, 7)
): {
  weeklyGoal: WeeklyGoal;
  routines: RoutineTemplate[];
  schedule: DayPlan[];
} {
  const weekDates = getWeekDates(anchorDate);
  const { fitnessGoal, daysPerWeek, equipment, targetDurationMinutes, unit } = profile;

  // 1. Target volume and sets calculation based on goal and days
  const targetWorkouts = daysPerWeek;
  const targetActiveMinutes = daysPerWeek * targetDurationMinutes;
  const targetTotalSets = daysPerWeek * (fitnessGoal === 'strength' ? 12 : 15);
  const baseVolumeLbs = daysPerWeek * 8000;
  const targetVolume = unit === 'kg' ? convertVolume(baseVolumeLbs, 'lbs', 'kg') : baseVolumeLbs;

  // Custom milestones to motivate the user from zero
  const milestones = [
    {
      id: `ms-init-1`,
      title: `Complete ${daysPerWeek} planned workouts in week 1`,
      category: 'consistency' as const,
      currentValue: 0,
      targetValue: daysPerWeek,
      unit: 'sessions',
      completed: false,
    },
    {
      id: `ms-init-2`,
      title: `Accumulate ${targetVolume.toLocaleString()} ${unit} total lifted volume`,
      category: 'strength' as const,
      currentValue: 0,
      targetValue: targetVolume,
      unit: unit,
      completed: false,
    },
    {
      id: `ms-init-3`,
      title: `Log first 5 personal records (PRs)`,
      category: 'strength' as const,
      currentValue: 0,
      targetValue: 5,
      unit: 'PRs',
      completed: false,
    },
  ];

  const weeklyGoal: WeeklyGoal = {
    targetWorkouts,
    targetActiveMinutes,
    targetTotalSets,
    targetVolume,
    targetCardioMinutes: fitnessGoal === 'fat_loss' ? 60 : 30,
    targetMuscleSets: {
      chest: Math.round(targetTotalSets * 0.2),
      back: Math.round(targetTotalSets * 0.22),
      legs_quads: Math.round(targetTotalSets * 0.2),
      legs_hamstrings: Math.round(targetTotalSets * 0.15),
      shoulders: Math.round(targetTotalSets * 0.15),
      core: Math.round(targetTotalSets * 0.08),
    },
    milestones,
  };

  // 2. Select appropriate routines and generate schedule for the next 8 weeks
  let generatedRoutines: RoutineTemplate[] = [];
  const schedule: DayPlan[] = [];

  // Define routine template split based on user frequency
  if (daysPerWeek === 2) {
    generatedRoutines = [
      {
        id: 'routine-full-a',
        name: 'Full Body Compound Protocol A',
        description: 'Multi-joint foundational strength prioritizing squats, presses, and rows.',
        category: 'Full Body',
        daysPerWeek: 2,
        exercises: [
          { exerciseId: 'ex-barbell-squat', targetSets: 4, targetReps: '6-8', restSeconds: 150 },
          { exerciseId: 'ex-bench-press', targetSets: 4, targetReps: '8', restSeconds: 120 },
          { exerciseId: 'ex-barbell-row', targetSets: 4, targetReps: '8-10', restSeconds: 120 },
          { exerciseId: 'ex-overhead-press', targetSets: 3, targetReps: '8-10', restSeconds: 90 },
          { exerciseId: 'ex-hanging-leg-raise', targetSets: 3, targetReps: '12', restSeconds: 60 },
        ],
      },
      {
        id: 'routine-full-b',
        name: 'Full Body Hypertrophy Protocol B',
        description: 'Posterior chain density with deadlifts, incline pressing, and arm work.',
        category: 'Full Body',
        daysPerWeek: 2,
        exercises: [
          { exerciseId: 'ex-deadlift', targetSets: 3, targetReps: '5', restSeconds: 180 },
          { exerciseId: 'ex-incline-db-press', targetSets: 4, targetReps: '10', restSeconds: 90 },
          { exerciseId: 'ex-lat-pulldown', targetSets: 4, targetReps: '10-12', restSeconds: 90 },
          { exerciseId: 'ex-bulgarian-split-squat', targetSets: 3, targetReps: '10', restSeconds: 90 },
          { exerciseId: 'ex-tricep-pushdown', targetSets: 3, targetReps: '12', restSeconds: 75 },
        ],
      },
    ];
  } else if (daysPerWeek === 3) {
    generatedRoutines = DEFAULT_ROUTINES.filter((r) => r.category === 'PPL');
  } else if (daysPerWeek === 4) {
    generatedRoutines = DEFAULT_ROUTINES.filter((r) => r.category === 'Upper/Lower');
  } else {
    // 5 or 6 days
    generatedRoutines = DEFAULT_ROUTINES.filter((r) => r.category === 'PPL');
  }

  // Populate schedule for 8 upcoming weeks (56 days) so next week and beyond always show up
  const WEEKS_TO_SCHEDULE = 8;
  for (let w = 0; w < WEEKS_TO_SCHEDULE; w++) {
    const weekAnchor = new Date(anchorDate);
    weekAnchor.setDate(weekAnchor.getDate() + w * 7);
    const currentWeekDates = getWeekDates(weekAnchor);

    if (daysPerWeek === 2) {
      currentWeekDates.forEach((date, idx) => {
        const iso = formatDateToISO(date);
        if (idx === 1) {
          schedule.push({ date: iso, routineId: 'routine-full-a', routineName: 'Full Body Compound Protocol A', isRestDay: false });
        } else if (idx === 4) {
          schedule.push({ date: iso, routineId: 'routine-full-b', routineName: 'Full Body Hypertrophy Protocol B', isRestDay: false });
        } else {
          schedule.push({ date: iso, isRestDay: true, routineName: 'Rest & Active Recovery' });
        }
      });
    } else if (daysPerWeek === 3) {
      currentWeekDates.forEach((date, idx) => {
        const iso = formatDateToISO(date);
        if (idx === 0) {
          schedule.push({ date: iso, routineId: 'routine-push-hypertrophy', routineName: 'Push: Chest, Shoulders & Triceps', isRestDay: false });
        } else if (idx === 2) {
          schedule.push({ date: iso, routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Back, Rear Delts & Biceps', isRestDay: false });
        } else if (idx === 4) {
          schedule.push({ date: iso, routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Quads, Hamstrings & Glutes', isRestDay: false });
        } else {
          schedule.push({ date: iso, isRestDay: true, routineName: 'Rest & Recovery' });
        }
      });
    } else if (daysPerWeek === 4) {
      currentWeekDates.forEach((date, idx) => {
        const iso = formatDateToISO(date);
        if (idx === 0) {
          schedule.push({ date: iso, routineId: 'routine-upper-strength', routineName: 'Upper Body Power & Hypertrophy', isRestDay: false });
        } else if (idx === 1) {
          schedule.push({ date: iso, routineId: 'routine-lower-strength', routineName: 'Lower Body Strength & Posterior Chain', isRestDay: false });
        } else if (idx === 3) {
          schedule.push({ date: iso, routineId: 'routine-upper-strength', routineName: 'Upper Body Power & Hypertrophy', isRestDay: false });
        } else if (idx === 4) {
          schedule.push({ date: iso, routineId: 'routine-lower-strength', routineName: 'Lower Body Strength & Posterior Chain', isRestDay: false });
        } else {
          schedule.push({ date: iso, isRestDay: true, routineName: 'Rest & Recovery' });
        }
      });
    } else {
      currentWeekDates.forEach((date, idx) => {
        const iso = formatDateToISO(date);
        if (idx === 0) {
          schedule.push({ date: iso, routineId: 'routine-push-hypertrophy', routineName: 'Push: Chest, Shoulders & Triceps', isRestDay: false });
        } else if (idx === 1) {
          schedule.push({ date: iso, routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Back, Rear Delts & Biceps', isRestDay: false });
        } else if (idx === 2) {
          schedule.push({ date: iso, routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Quads, Hamstrings & Glutes', isRestDay: false });
        } else if (idx === 3) {
          schedule.push({ date: iso, routineId: 'routine-push-hypertrophy', routineName: 'Push: Hypertrophy Focus', isRestDay: false });
        } else if (idx === 4) {
          schedule.push({ date: iso, routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Hypertrophy Focus', isRestDay: false });
        } else if (idx === 5 && daysPerWeek >= 6) {
          schedule.push({ date: iso, routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Hypertrophy Focus', isRestDay: false });
        } else {
          schedule.push({ date: iso, isRestDay: true, routineName: 'Rest & Mobility' });
        }
      });
    }
  }

  return {
    weeklyGoal,
    routines: generatedRoutines.length > 0 ? generatedRoutines : DEFAULT_ROUTINES,
    schedule,
  };
}

// Fallback resolver to ensure any day in any future or past week resolves properly
export function resolveDayPlan(
  schedule: DayPlan[],
  dateIso: string,
  routines: RoutineTemplate[] = DEFAULT_ROUTINES
): DayPlan {
  // 1. Direct match in scheduled array
  const explicit = schedule.find((d) => d.date === dateIso);
  if (explicit) return explicit;

  // 2. Pattern match by day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const [year, month, day] = dateIso.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay();

  // Find any existing non-rest schedule entry for this weekday in the user's schedule
  const matchingDay = schedule.find((d) => {
    if (d.isRestDay || !d.routineId) return false;
    const [y, m, dNum] = d.date.split('-').map(Number);
    const dDate = new Date(y, m - 1, dNum);
    return dDate.getDay() === dayOfWeek;
  });

  if (matchingDay) {
    return {
      date: dateIso,
      routineId: matchingDay.routineId,
      routineName: matchingDay.routineName,
      isRestDay: false,
    };
  }

  // Find if this weekday was explicitly set as a rest day
  const matchingRest = schedule.find((d) => {
    if (!d.isRestDay) return false;
    const [y, m, dNum] = d.date.split('-').map(Number);
    const dDate = new Date(y, m - 1, dNum);
    return dDate.getDay() === dayOfWeek;
  });

  if (matchingRest) {
    return {
      date: dateIso,
      isRestDay: true,
      routineName: matchingRest.routineName || 'Rest & Recovery',
      notes: matchingRest.notes,
    };
  }

  // 3. Fallback based on available routines if schedule is completely empty
  if (routines.length > 0) {
    if (dayOfWeek === 1) {
      return { date: dateIso, routineId: routines[0].id, routineName: routines[0].name, isRestDay: false };
    } else if (dayOfWeek === 3 && routines.length > 1) {
      return { date: dateIso, routineId: routines[1].id, routineName: routines[1].name, isRestDay: false };
    } else if (dayOfWeek === 5 && routines.length > 2) {
      return { date: dateIso, routineId: routines[2].id, routineName: routines[2].name, isRestDay: false };
    }
  }

  return {
    date: dateIso,
    isRestDay: true,
    routineName: 'Rest & Recovery',
  };
}

// Date helpers for weekly navigation
export function getWeekDates(anchorDate: Date = new Date()): Date[] {
  const current = new Date(anchorDate);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const next = new Date(monday);
    next.setDate(monday.getDate() + i);
    dates.push(next);
  }
  return dates;
}

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back & Lats',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs_quads: 'Quads',
  legs_hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core & Abs',
  cardio: 'Cardiovascular',
};
