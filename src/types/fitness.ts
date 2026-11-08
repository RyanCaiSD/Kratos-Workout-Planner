export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs_quads'
  | 'legs_hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'cardio';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'smith_machine'
  | 'cardio_machine';

export type SetType = 'warmup' | 'working' | 'dropset' | 'failure';

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  category: 'strength' | 'hypertrophy' | 'endurance' | 'mobility';
  instructions: string;
  tips?: string;
  defaultSets: number;
  defaultReps: number;
  isCustom?: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  type: SetType;
  weight: number; // in current unit (lbs or kg)
  reps: number;
  completed: boolean;
  rpe?: number; // 6-10 scale
  previousGhost?: { weight: number; reps: number };
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // ISO
  endTime?: string; // ISO
  durationMinutes: number;
  title: string;
  routineId?: string;
  exercises: WorkoutExercise[];
  totalVolume: number; // sum(weight * reps) for working sets
  totalSets: number;
  completed: boolean;
  notes?: string;
  prsBroken?: string[]; // Names of exercises with new PR
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimated1RM: number; // Epley: weight * (1 + reps/30)
  date: string;
}

export interface CustomMilestone {
  id: string;
  title: string;
  category: 'strength' | 'consistency' | 'body' | 'cardio';
  currentValue: number;
  targetValue: number;
  unit: string;
  completed: boolean;
  deadline?: string;
}

export interface WeeklyGoal {
  targetWorkouts: number; // e.g. 4
  targetActiveMinutes: number; // e.g. 240
  targetTotalSets: number; // e.g. 64
  targetVolume: number; // e.g. 45000
  targetCardioMinutes: number; // e.g. 60
  targetMuscleSets: Partial<Record<MuscleGroup, number>>;
  milestones: CustomMilestone[];
  fitnessGoal?: 'hypertrophy' | 'strength' | 'fat_loss' | 'mobility';
}

export interface RoutineExerciseConfig {
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g. "8-12" or "5"
  restSeconds: number;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'PPL' | 'Upper/Lower' | 'Full Body' | 'Conditioning' | 'Custom';
  daysPerWeek: number;
  exercises: RoutineExerciseConfig[];
  isCustom?: boolean;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  routineId?: string;
  routineName?: string;
  isRestDay: boolean;
  completedWorkoutId?: string;
  notes?: string;
}

export type UnitSystem = 'lbs' | 'kg';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
  avatarColor?: string;
  hasCompletedOnboarding?: boolean;
}

export interface UserOnboardingProfile {
  fitnessGoal: 'hypertrophy' | 'strength' | 'fat_loss' | 'mobility';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  equipment: 'gym' | 'dumbbells' | 'bodyweight';
  targetDurationMinutes: number;
  unit: UnitSystem;
}
