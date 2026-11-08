import { WorkoutSession, WeeklyGoal, DayPlan, PersonalRecord } from '../types/fitness';

export const DEFAULT_WEEKLY_GOAL: WeeklyGoal = {
  targetWorkouts: 4,
  targetActiveMinutes: 240,
  targetTotalSets: 60,
  targetVolume: 45000,
  targetCardioMinutes: 45,
  targetMuscleSets: {
    chest: 12,
    back: 14,
    legs_quads: 12,
    legs_hamstrings: 10,
    shoulders: 10,
    biceps: 8,
    triceps: 8,
    core: 6,
  },
  milestones: [
    {
      id: 'ms-1',
      title: 'Barbell Bench Press: 225 lbs for 5 reps',
      category: 'strength',
      currentValue: 205,
      targetValue: 225,
      unit: 'lbs',
      completed: false,
    },
    {
      id: 'ms-2',
      title: 'Squat 315 lbs with full depth',
      category: 'strength',
      currentValue: 295,
      targetValue: 315,
      unit: 'lbs',
      completed: false,
    },
    {
      id: 'ms-3',
      title: 'Complete 4 workouts/week for 4 straight weeks',
      category: 'consistency',
      currentValue: 3,
      targetValue: 4,
      unit: 'weeks',
      completed: false,
    },
    {
      id: 'ms-4',
      title: 'Sub-7 minute 2,000m Rowing erg sprint',
      category: 'cardio',
      currentValue: 442,
      targetValue: 420,
      unit: 'sec',
      completed: false,
    },
  ],
};

// Seed realistic workout history leading up to 2026-11-07
export const SEED_WORKOUT_SESSIONS: WorkoutSession[] = [
  // 2 weeks ago (Push) - 2026-10-26
  {
    id: 'session-2026-10-26',
    date: '2026-10-26',
    startTime: '2026-10-26T07:15:00.000Z',
    endTime: '2026-10-26T08:18:00.000Z',
    durationMinutes: 63,
    title: 'Push: Chest, Shoulders & Triceps',
    routineId: 'routine-push-hypertrophy',
    exercises: [
      {
        exerciseId: 'ex-bench-press',
        exerciseName: 'Barbell Bench Press',
        primaryMuscle: 'chest',
        sets: [
          { id: 's-1', setNumber: 1, type: 'warmup', weight: 135, reps: 10, completed: true },
          { id: 's-2', setNumber: 2, type: 'working', weight: 185, reps: 8, completed: true, rpe: 8 },
          { id: 's-3', setNumber: 3, type: 'working', weight: 195, reps: 7, completed: true, rpe: 8.5 },
          { id: 's-4', setNumber: 4, type: 'working', weight: 195, reps: 6, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-incline-db-press',
        exerciseName: 'Incline Dumbbell Press',
        primaryMuscle: 'chest',
        sets: [
          { id: 's-5', setNumber: 1, type: 'working', weight: 65, reps: 10, completed: true, rpe: 8 },
          { id: 's-6', setNumber: 2, type: 'working', weight: 70, reps: 8, completed: true, rpe: 8.5 },
          { id: 's-7', setNumber: 3, type: 'working', weight: 70, reps: 8, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-db-lateral-raise',
        exerciseName: 'Dumbbell Lateral Raise',
        primaryMuscle: 'shoulders',
        sets: [
          { id: 's-8', setNumber: 1, type: 'working', weight: 25, reps: 15, completed: true, rpe: 8 },
          { id: 's-9', setNumber: 2, type: 'working', weight: 25, reps: 13, completed: true, rpe: 8.5 },
          { id: 's-10', setNumber: 3, type: 'working', weight: 25, reps: 12, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-tricep-pushdown',
        exerciseName: 'Cable Tricep Rope Pushdown',
        primaryMuscle: 'triceps',
        sets: [
          { id: 's-11', setNumber: 1, type: 'working', weight: 55, reps: 12, completed: true, rpe: 8 },
          { id: 's-12', setNumber: 2, type: 'working', weight: 60, reps: 10, completed: true, rpe: 8.5 },
          { id: 's-13', setNumber: 3, type: 'working', weight: 60, reps: 10, completed: true, rpe: 9 },
        ],
      },
    ],
    totalVolume: 10875,
    totalSets: 13,
    completed: true,
    notes: 'Solid chest pump. Bench felt smooth with good bar speed.',
  },

  // 2 weeks ago (Pull) - 2026-10-28
  {
    id: 'session-2026-10-28',
    date: '2026-10-28',
    startTime: '2026-10-28T17:30:00.000Z',
    endTime: '2026-10-28T18:35:00.000Z',
    durationMinutes: 65,
    title: 'Pull: Back, Rear Delts & Biceps',
    routineId: 'routine-pull-hypertrophy',
    exercises: [
      {
        exerciseId: 'ex-deadlift',
        exerciseName: 'Conventional Barbell Deadlift',
        primaryMuscle: 'back',
        sets: [
          { id: 's-14', setNumber: 1, type: 'warmup', weight: 225, reps: 5, completed: true },
          { id: 's-15', setNumber: 2, type: 'working', weight: 315, reps: 5, completed: true, rpe: 8 },
          { id: 's-16', setNumber: 3, type: 'working', weight: 335, reps: 5, completed: true, rpe: 8.5 },
          { id: 's-17', setNumber: 4, type: 'working', weight: 345, reps: 4, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-pullups',
        exerciseName: 'Pull-ups',
        primaryMuscle: 'back',
        sets: [
          { id: 's-18', setNumber: 1, type: 'working', weight: 0, reps: 10, completed: true, rpe: 8 },
          { id: 's-19', setNumber: 2, type: 'working', weight: 0, reps: 9, completed: true, rpe: 8.5 },
          { id: 's-20', setNumber: 3, type: 'working', weight: 0, reps: 8, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-barbell-row',
        exerciseName: 'Bent-Over Barbell Row',
        primaryMuscle: 'back',
        sets: [
          { id: 's-21', setNumber: 1, type: 'working', weight: 165, reps: 8, completed: true, rpe: 8 },
          { id: 's-22', setNumber: 2, type: 'working', weight: 175, reps: 8, completed: true, rpe: 8.5 },
          { id: 's-23', setNumber: 3, type: 'working', weight: 175, reps: 7, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-barbell-curl',
        exerciseName: 'Standing Barbell Bicep Curl',
        primaryMuscle: 'biceps',
        sets: [
          { id: 's-24', setNumber: 1, type: 'working', weight: 75, reps: 10, completed: true, rpe: 8 },
          { id: 's-25', setNumber: 2, type: 'working', weight: 80, reps: 8, completed: true, rpe: 8.5 },
          { id: 's-26', setNumber: 3, type: 'working', weight: 80, reps: 8, completed: true, rpe: 9 },
        ],
      },
    ],
    totalVolume: 12450,
    totalSets: 13,
    completed: true,
  },

  // 1 week ago (Push Overload) - 2026-11-02
  {
    id: 'session-2026-11-02',
    date: '2026-11-02',
    startTime: '2026-11-02T07:00:00.000Z',
    endTime: '2026-11-02T08:05:00.000Z',
    durationMinutes: 65,
    title: 'Push: Chest, Shoulders & Triceps',
    routineId: 'routine-push-hypertrophy',
    exercises: [
      {
        exerciseId: 'ex-bench-press',
        exerciseName: 'Barbell Bench Press',
        primaryMuscle: 'chest',
        sets: [
          { id: 's-27', setNumber: 1, type: 'warmup', weight: 135, reps: 10, completed: true },
          { id: 's-28', setNumber: 2, type: 'working', weight: 195, reps: 8, completed: true, rpe: 8 },
          { id: 's-29', setNumber: 3, type: 'working', weight: 205, reps: 6, completed: true, rpe: 8.5 },
          { id: 's-30', setNumber: 4, type: 'working', weight: 205, reps: 6, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-incline-db-press',
        exerciseName: 'Incline Dumbbell Press',
        primaryMuscle: 'chest',
        sets: [
          { id: 's-31', setNumber: 1, type: 'working', weight: 70, reps: 10, completed: true, rpe: 8 },
          { id: 's-32', setNumber: 2, type: 'working', weight: 75, reps: 8, completed: true, rpe: 8.5 },
          { id: 's-33', setNumber: 3, type: 'working', weight: 75, reps: 7, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-db-lateral-raise',
        exerciseName: 'Dumbbell Lateral Raise',
        primaryMuscle: 'shoulders',
        sets: [
          { id: 's-34', setNumber: 1, type: 'working', weight: 27.5, reps: 14, completed: true, rpe: 8 },
          { id: 's-35', setNumber: 2, type: 'working', weight: 27.5, reps: 13, completed: true, rpe: 8.5 },
          { id: 's-36', setNumber: 3, type: 'working', weight: 27.5, reps: 12, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-tricep-pushdown',
        exerciseName: 'Cable Tricep Rope Pushdown',
        primaryMuscle: 'triceps',
        sets: [
          { id: 's-37', setNumber: 1, type: 'working', weight: 60, reps: 12, completed: true, rpe: 8 },
          { id: 's-38', setNumber: 2, type: 'working', weight: 65, reps: 10, completed: true, rpe: 8.5 },
          { id: 's-39', setNumber: 3, type: 'working', weight: 65, reps: 9, completed: true, rpe: 9 },
        ],
      },
    ],
    totalVolume: 12215,
    totalSets: 13,
    completed: true,
    prsBroken: ['Barbell Bench Press'],
  },

  // 1 week ago (Legs) - 2026-11-04
  {
    id: 'session-2026-11-04',
    date: '2026-11-04',
    startTime: '2026-11-04T17:00:00.000Z',
    endTime: '2026-11-04T18:12:00.000Z',
    durationMinutes: 72,
    title: 'Legs: Quads, Hamstrings & Glutes',
    routineId: 'routine-legs-hypertrophy',
    exercises: [
      {
        exerciseId: 'ex-barbell-squat',
        exerciseName: 'Barbell Back Squat',
        primaryMuscle: 'legs_quads',
        sets: [
          { id: 's-40', setNumber: 1, type: 'warmup', weight: 185, reps: 8, completed: true },
          { id: 's-41', setNumber: 2, type: 'working', weight: 255, reps: 6, completed: true, rpe: 8 },
          { id: 's-42', setNumber: 3, type: 'working', weight: 275, reps: 6, completed: true, rpe: 8.5 },
          { id: 's-43', setNumber: 4, type: 'working', weight: 295, reps: 5, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-rdl',
        exerciseName: 'Romanian Deadlift (RDL)',
        primaryMuscle: 'legs_hamstrings',
        sets: [
          { id: 's-44', setNumber: 1, type: 'working', weight: 205, reps: 8, completed: true, rpe: 8 },
          { id: 's-45', setNumber: 2, type: 'working', weight: 225, reps: 8, completed: true, rpe: 8.5 },
          { id: 's-46', setNumber: 3, type: 'working', weight: 225, reps: 8, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-standing-calf-raise',
        exerciseName: 'Standing Calf Raise',
        primaryMuscle: 'calves',
        sets: [
          { id: 's-47', setNumber: 1, type: 'working', weight: 140, reps: 15, completed: true, rpe: 8 },
          { id: 's-48', setNumber: 2, type: 'working', weight: 150, reps: 14, completed: true, rpe: 8.5 },
          { id: 's-49', setNumber: 3, type: 'working', weight: 150, reps: 12, completed: true, rpe: 9 },
        ],
      },
    ],
    totalVolume: 14610,
    totalSets: 10,
    completed: true,
    prsBroken: ['Barbell Back Squat'],
  },

  // Yesterday - 2026-11-06 (Pull Overload)
  {
    id: 'session-2026-11-06',
    date: '2026-11-06',
    startTime: '2026-11-06T18:00:00.000Z',
    endTime: '2026-11-06T19:08:00.000Z',
    durationMinutes: 68,
    title: 'Pull: Back, Rear Delts & Biceps',
    routineId: 'routine-pull-hypertrophy',
    exercises: [
      {
        exerciseId: 'ex-deadlift',
        exerciseName: 'Conventional Barbell Deadlift',
        primaryMuscle: 'back',
        sets: [
          { id: 's-50', setNumber: 1, type: 'warmup', weight: 225, reps: 5, completed: true },
          { id: 's-51', setNumber: 2, type: 'working', weight: 325, reps: 5, completed: true, rpe: 8 },
          { id: 's-52', setNumber: 3, type: 'working', weight: 355, reps: 5, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-pullups',
        exerciseName: 'Pull-ups',
        primaryMuscle: 'back',
        sets: [
          { id: 's-53', setNumber: 1, type: 'working', weight: 0, reps: 11, completed: true, rpe: 8 },
          { id: 's-54', setNumber: 2, type: 'working', weight: 0, reps: 10, completed: true, rpe: 8.5 },
          { id: 's-55', setNumber: 3, type: 'working', weight: 0, reps: 9, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-face-pull',
        exerciseName: 'Cable Face Pull',
        primaryMuscle: 'back',
        sets: [
          { id: 's-56', setNumber: 1, type: 'working', weight: 45, reps: 15, completed: true, rpe: 8 },
          { id: 's-57', setNumber: 2, type: 'working', weight: 50, reps: 15, completed: true, rpe: 8.5 },
          { id: 's-58', setNumber: 3, type: 'working', weight: 50, reps: 14, completed: true, rpe: 9 },
        ],
      },
      {
        exerciseId: 'ex-barbell-curl',
        exerciseName: 'Standing Barbell Bicep Curl',
        primaryMuscle: 'biceps',
        sets: [
          { id: 's-59', setNumber: 1, type: 'working', weight: 80, reps: 10, completed: true, rpe: 8 },
          { id: 's-60', setNumber: 2, type: 'working', weight: 85, reps: 8, completed: true, rpe: 9 },
          { id: 's-61', setNumber: 3, type: 'working', weight: 85, reps: 8, completed: true, rpe: 9.5 },
        ],
      },
    ],
    totalVolume: 12985,
    totalSets: 12,
    completed: true,
    prsBroken: ['Conventional Barbell Deadlift'],
  },
];

// Seed weekly day schedule for current week (Nov 2 - Nov 8, 2026) and upcoming weeks (Nov 9 - Dec 6, 2026)
export const SEED_SCHEDULE: DayPlan[] = [
  // Current Week (Nov 02 - Nov 08, 2026)
  { date: '2026-11-02', routineId: 'routine-push-hypertrophy', routineName: 'Push: Chest, Shoulders & Triceps', isRestDay: false, completedWorkoutId: 'session-2026-11-02' },
  { date: '2026-11-03', isRestDay: true, routineName: 'Rest & Active Recovery', notes: 'Foam roll & 30 min walk' },
  { date: '2026-11-04', routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Quads, Hamstrings & Glutes', isRestDay: false, completedWorkoutId: 'session-2026-11-04' },
  { date: '2026-11-05', isRestDay: true, routineName: 'Rest Day' },
  { date: '2026-11-06', routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Back, Rear Delts & Biceps', isRestDay: false, completedWorkoutId: 'session-2026-11-06' },
  { date: '2026-11-07', routineId: 'routine-upper-strength', routineName: 'Upper Body Power & Hypertrophy', isRestDay: false },
  { date: '2026-11-08', isRestDay: true, routineName: 'Rest & Mobility' },

  // Next Week (Nov 09 - Nov 15, 2026)
  { date: '2026-11-09', routineId: 'routine-push-hypertrophy', routineName: 'Push: Chest, Shoulders & Triceps', isRestDay: false },
  { date: '2026-11-10', isRestDay: true, routineName: 'Rest & Active Recovery' },
  { date: '2026-11-11', routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Quads, Hamstrings & Glutes', isRestDay: false },
  { date: '2026-11-12', isRestDay: true, routineName: 'Rest & Mobility' },
  { date: '2026-11-13', routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Back, Rear Delts & Biceps', isRestDay: false },
  { date: '2026-11-14', routineId: 'routine-upper-strength', routineName: 'Upper Body Power & Hypertrophy', isRestDay: false },
  { date: '2026-11-15', isRestDay: true, routineName: 'Rest & Recovery' },

  // Week 3 (Nov 16 - Nov 22, 2026)
  { date: '2026-11-16', routineId: 'routine-push-hypertrophy', routineName: 'Push: Chest, Shoulders & Triceps', isRestDay: false },
  { date: '2026-11-17', isRestDay: true, routineName: 'Rest & Active Recovery' },
  { date: '2026-11-18', routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Quads, Hamstrings & Glutes', isRestDay: false },
  { date: '2026-11-19', isRestDay: true, routineName: 'Rest Day' },
  { date: '2026-11-20', routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Back, Rear Delts & Biceps', isRestDay: false },
  { date: '2026-11-21', routineId: 'routine-upper-strength', routineName: 'Upper Body Power & Hypertrophy', isRestDay: false },
  { date: '2026-11-22', isRestDay: true, routineName: 'Rest & Mobility' },

  // Week 4 (Nov 23 - Nov 29, 2026)
  { date: '2026-11-23', routineId: 'routine-push-hypertrophy', routineName: 'Push: Chest, Shoulders & Triceps', isRestDay: false },
  { date: '2026-11-24', isRestDay: true, routineName: 'Rest & Active Recovery' },
  { date: '2026-11-25', routineId: 'routine-legs-hypertrophy', routineName: 'Legs: Quads, Hamstrings & Glutes', isRestDay: false },
  { date: '2026-11-26', isRestDay: true, routineName: 'Rest Day' },
  { date: '2026-11-27', routineId: 'routine-pull-hypertrophy', routineName: 'Pull: Back, Rear Delts & Biceps', isRestDay: false },
  { date: '2026-11-28', routineId: 'routine-upper-strength', routineName: 'Upper Body Power & Hypertrophy', isRestDay: false },
  { date: '2026-11-29', isRestDay: true, routineName: 'Rest & Recovery' },
];

export const INITIAL_PRS: PersonalRecord[] = [
  { exerciseId: 'ex-bench-press', exerciseName: 'Barbell Bench Press', weight: 205, reps: 6, estimated1RM: 246, date: '2026-11-02' },
  { exerciseId: 'ex-deadlift', exerciseName: 'Conventional Barbell Deadlift', weight: 355, reps: 5, estimated1RM: 414, date: '2026-11-06' },
  { exerciseId: 'ex-barbell-squat', exerciseName: 'Barbell Back Squat', weight: 295, reps: 5, estimated1RM: 344, date: '2026-11-04' },
  { exerciseId: 'ex-overhead-press', exerciseName: 'Overhead Barbell Press', weight: 135, reps: 6, estimated1RM: 162, date: '2026-10-22' },
  { exerciseId: 'ex-barbell-row', exerciseName: 'Bent-Over Barbell Row', weight: 175, reps: 8, estimated1RM: 221, date: '2026-10-28' },
];
