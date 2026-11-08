import React, { useState } from 'react';
import {
  Sparkles,
  Dumbbell,
  Target,
  Calendar,
  Clock,
  Check,
  ChevronRight,
  ChevronLeft,
  Flame,
  Award,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  UserAccount,
  UserOnboardingProfile,
  UnitSystem,
  WeeklyGoal,
  RoutineTemplate,
  DayPlan,
} from '../types/fitness';
import { generateOnboardingPlan, formatWeight } from '../utils/storage';

interface OnboardingModalProps {
  user: UserAccount;
  onCompleteOnboarding: (
    profile: UserOnboardingProfile,
    generatedGoal: WeeklyGoal,
    generatedRoutines: RoutineTemplate[],
    generatedSchedule: DayPlan[]
  ) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  user,
  onCompleteOnboarding,
}) => {
  const [step, setStep] = useState<number>(1);

  // Form states
  const [fitnessGoal, setFitnessGoal] = useState<UserOnboardingProfile['fitnessGoal']>('hypertrophy');
  const [experienceLevel, setExperienceLevel] = useState<UserOnboardingProfile['experienceLevel']>('intermediate');
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [equipment, setEquipment] = useState<UserOnboardingProfile['equipment']>('gym');
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(60);
  const [unit, setUnit] = useState<UnitSystem>('lbs');

  // Preview generated plan at the final step
  const preview = generateOnboardingPlan({
    fitnessGoal,
    experienceLevel,
    daysPerWeek,
    equipment,
    targetDurationMinutes,
    unit,
  });

  const handleFinish = () => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
    });

    onCompleteOnboarding(
      {
        fitnessGoal,
        experienceLevel,
        daysPerWeek,
        equipment,
        targetDurationMinutes,
        unit,
      },
      preview.weeklyGoal,
      preview.routines,
      preview.schedule
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-400 text-neutral-950 font-bold text-xs font-mono">
              {step}/4
            </span>
            <div>
              <h2 className="text-base font-bold text-neutral-100">
                Welcome to Kratos, {user.name.split(' ')[0]}
              </h2>
              <span className="text-[11px] text-neutral-400">
                Fresh account setup · Baseline 0 metrics
              </span>
            </div>
          </div>
          <span className="text-xs font-mono text-amber-400 font-medium">
            Personalized Plan
          </span>
        </div>

        {/* Wizard Steps */}
        <div className="overflow-y-auto space-y-5 flex-1 pr-1">
          {/* STEP 1: FITNESS GOAL */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 mb-1">
                  Step 1: What is your primary fitness goal?
                </h3>
                <p className="text-xs text-neutral-400">
                  Your workout plan volume and rep periodization will be engineered around this target.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  {
                    id: 'hypertrophy',
                    title: 'Hypertrophy & Muscle Growth',
                    desc: 'Maximize lean muscle tissue via mechanical tension and 8–12 rep schemes.',
                  },
                  {
                    id: 'strength',
                    title: 'Strength & Power',
                    desc: 'Heavy compound barbell overload (Squat, Bench, Deadlift) in 4–6 rep ranges.',
                  },
                  {
                    id: 'fat_loss',
                    title: 'Fat Loss & Conditioning',
                    desc: 'High-density supersets, cardiovascular endurance, and elevated metabolic rate.',
                  },
                  {
                    id: 'mobility',
                    title: 'Athleticism & Longevity',
                    desc: 'Functional joint mobility, posture correction, and full-body resilience.',
                  },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setFitnessGoal(g.id as any)}
                    className={`p-3.5 text-left rounded border transition-colors ${
                      fitnessGoal === g.id
                        ? 'bg-amber-500/10 border-amber-400 text-neutral-100'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-neutral-100 mb-1 flex items-center justify-between">
                      <span>{g.title}</span>
                      {fitnessGoal === g.id && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {g.desc}
                    </p>
                  </button>
                ))}
              </div>

              {/* Experience level selector */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Training Experience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'beginner', label: 'Beginner (<1 yr)' },
                    { id: 'intermediate', label: 'Intermediate (1–3 yrs)' },
                    { id: 'advanced', label: 'Advanced (3+ yrs)' },
                  ].map((exp) => (
                    <button
                      key={exp.id}
                      type="button"
                      onClick={() => setExperienceLevel(exp.id as any)}
                      className={`p-2 text-xs font-medium rounded border transition-colors text-center ${
                        experienceLevel === exp.id
                          ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-semibold'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE & FREQUENCY */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 mb-1">
                  Step 2: How many days per week can you train?
                </h3>
                <p className="text-xs text-neutral-400">
                  We will structure your weekly calendar matrix and optimal rest days.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { days: 2, label: '2 Days / Week', split: 'Full Body A / B', note: 'Time-efficient, perfect for busy schedules' },
                  { days: 3, label: '3 Days / Week', split: 'Push / Pull / Legs', note: 'Classic balance of recovery and intensity' },
                  { days: 4, label: '4 Days / Week', split: 'Upper / Lower Split', note: 'Optimal frequency for progressive overload' },
                  { days: 5, label: '5 Days / Week', split: 'PPL + Upper/Lower', note: 'High volume for rapid muscle gains' },
                  { days: 6, label: '6 Days / Week', split: 'PPL Double Frequency', note: 'Advanced high-frequency hypertrophy' },
                ].map((item) => (
                  <button
                    key={item.days}
                    type="button"
                    onClick={() => setDaysPerWeek(item.days)}
                    className={`p-3 text-left rounded border transition-colors ${
                      daysPerWeek === item.days
                        ? 'bg-amber-500/10 border-amber-400 text-neutral-100'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-neutral-100 mb-0.5 flex items-center justify-between">
                      <span>{item.label}</span>
                      {daysPerWeek === item.days && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[11px] font-mono text-amber-400/90 mb-1">
                      {item.split}
                    </div>
                    <div className="text-[10px] text-neutral-400">
                      {item.note}
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Target Session Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[45, 60, 75].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTargetDurationMinutes(mins)}
                      className={`p-2 text-xs font-medium rounded border transition-colors text-center ${
                        targetDurationMinutes === mins
                          ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-semibold'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {mins} Minutes
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EQUIPMENT & UNIT */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 mb-1">
                  Step 3: What equipment do you have access to?
                </h3>
                <p className="text-xs text-neutral-400">
                  Exercises will be mapped to the tools you actually have available.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'gym',
                    title: 'Full Commercial Gym',
                    desc: 'Barbells, squat racks, dumbbells, cable machines, and isolation machines.',
                  },
                  {
                    id: 'dumbbells',
                    title: 'Dumbbells & Adjustable Bench Only',
                    desc: 'Free weight training ideal for garage and home gym setups.',
                  },
                  {
                    id: 'bodyweight',
                    title: 'Bodyweight & Calisthenics Only',
                    desc: 'Pull-up bar, dip bars, push-ups, and core bodyweight progressions.',
                  },
                ].map((eq) => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => setEquipment(eq.id as any)}
                    className={`w-full p-3.5 text-left rounded border transition-colors ${
                      equipment === eq.id
                        ? 'bg-amber-500/10 border-amber-400 text-neutral-100'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-neutral-100 mb-1 flex items-center justify-between">
                      <span>{eq.title}</span>
                      {equipment === eq.id && <Check className="h-3.5 w-3.5 text-amber-400" />}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {eq.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Weight Measurement System
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setUnit('lbs')}
                    className={`p-2.5 text-xs font-mono font-medium rounded border transition-colors ${
                      unit === 'lbs'
                        ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-bold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Pounds (lbs)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('kg')}
                    className={`p-2.5 text-xs font-mono font-medium rounded border transition-colors ${
                      unit === 'kg'
                        ? 'bg-neutral-100 text-neutral-950 border-neutral-100 font-bold'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                    }`}
                  >
                    Kilograms (kg)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATED PLAN PREVIEW & ACTIVATION */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-neutral-100 mb-1">
                  Step 4: Your Customized Workout Plan
                </h3>
                <p className="text-xs text-neutral-400">
                  Generated specifically for your {fitnessGoal.replace('_', ' ')} goal and {daysPerWeek}-day frequency. Everything starts at 0!
                </p>
              </div>

              {/* Target Summary Strip */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-neutral-950 rounded border border-neutral-800 text-center font-mono text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase">Target Workouts</span>
                  <div className="text-base font-bold text-neutral-100">
                    {preview.weeklyGoal.targetWorkouts} / week
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase">Target Active Time</span>
                  <div className="text-base font-bold text-neutral-100">
                    {preview.weeklyGoal.targetActiveMinutes}m
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase">Weekly Target Volume</span>
                  <div className="text-base font-bold text-amber-400">
                    {preview.weeklyGoal.targetVolume.toLocaleString()} {unit}
                  </div>
                </div>
              </div>

              {/* Scheduled Days Preview */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                  Weekly Training Schedule:
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {preview.schedule.map((day) => {
                    const d = new Date(day.date + 'T12:00:00');
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
                    return (
                      <div
                        key={day.date}
                        className="flex items-center justify-between p-2.5 bg-neutral-950 rounded border border-neutral-800 text-xs"
                      >
                        <span className="font-mono font-medium text-neutral-400 w-24">
                          {dayName}
                        </span>
                        <span
                          className={`font-semibold ${
                            day.isRestDay ? 'text-neutral-500' : 'text-neutral-200'
                          }`}
                        >
                          {day.routineName}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {day.isRestDay ? 'Rest' : 'Workout'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notice that everything starts at zero */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex items-center gap-2.5 text-xs text-amber-300">
                <Flame className="h-4 w-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Clean Slate:</strong> All your session logs, volume, and PR records will begin at 0. Log your first workout to start your streak!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 mt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors"
            >
              <span>Next Step</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-neutral-950 bg-emerald-400 hover:bg-emerald-300 rounded shadow-sm transition-colors"
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>Activate Plan & Start Training</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
