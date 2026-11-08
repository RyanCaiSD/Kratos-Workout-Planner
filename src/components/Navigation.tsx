import React from 'react';
import { Play, RotateCcw, Target, Dumbbell, User, LogOut } from 'lucide-react';
import { UnitSystem, UserAccount } from '../types/fitness';

export type NavTab = 'planner' | 'active' | 'progress' | 'routines' | 'exercises';

interface NavigationProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hasActiveSession: boolean;
  unit: UnitSystem;
  onToggleUnit: () => void;
  onStartNewWorkout: () => void;
  onOpenGoalsModal: () => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  hasActiveSession,
  unit,
  onToggleUnit,
  onStartNewWorkout,
  onOpenGoalsModal,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3 sm:px-6">
        {/* Zone 1: Single text element Brand wordmark */}
        <button
          onClick={() => onTabChange('planner')}
          className="flex items-center gap-2 text-left text-lg font-bold tracking-tight text-neutral-100 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Dumbbell className="h-4 w-4" />
          </span>
          <span>KRATOS</span>
        </button>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
          <button
            onClick={() => onTabChange('planner')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-100 ${
              activeTab === 'planner' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Weekly Planner
          </button>

          <button
            onClick={() => onTabChange('active')}
            className={`flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors hover:text-neutral-100 ${
              activeTab === 'active' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            <span>Active Workout</span>
            {hasActiveSession && (
              <span className="inline-flex items-center text-[10px] uppercase font-mono font-bold tracking-wide text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                LIVE
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('progress')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-100 ${
              activeTab === 'progress' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Progress & PRs
          </button>

          <button
            onClick={() => onTabChange('routines')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-100 ${
              activeTab === 'routines' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Routines
          </button>

          <button
            onClick={() => onTabChange('exercises')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-neutral-100 ${
              activeTab === 'exercises' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
            }`}
          >
            Exercise Library
          </button>
        </nav>

        {/* Zone 3: 1 primary action + unit & user account management */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* User Account Switcher */}
          <button
            onClick={onOpenAuthModal}
            title="Switch Account or Create New User"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 transition-colors whitespace-nowrap shrink-0"
          >
            <div
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-neutral-950 uppercase"
              style={{ backgroundColor: currentUser?.avatarColor || '#f59e0b' }}
            >
              {currentUser ? currentUser.name.slice(0, 2) : <User className="h-3 w-3" />}
            </div>
            <span className="hidden sm:inline max-w-[85px] truncate font-medium">
              {currentUser?.name.split(' ')[0] || 'Account'}
            </span>
          </button>

          {/* Log Out button */}
          <button
            onClick={onLogout}
            title="Log Out to Home"
            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-900 rounded border border-neutral-800 hover:border-neutral-700 transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>

          {/* Unit Toggle with full conversion */}
          <button
            onClick={onToggleUnit}
            title={`Convert all metrics to ${unit === 'lbs' ? 'kg' : 'lbs'}`}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="h-3 w-3 opacity-60" />
            <span className="uppercase font-bold">{unit}</span>
          </button>

          <button
            onClick={onOpenGoalsModal}
            title="Weekly Goals Settings"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Target className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Goals</span>
          </button>

          {hasActiveSession ? (
            <button
              onClick={() => onTabChange('active')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Resume Session</span>
            </button>
          ) : (
            <button
              onClick={onStartNewWorkout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Workout</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="flex md:hidden border-t border-neutral-800/80 bg-neutral-950 px-2 py-1.5 overflow-x-auto gap-2">
        <button
          onClick={() => onTabChange('planner')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
            activeTab === 'planner' ? 'bg-neutral-800 text-amber-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Planner
        </button>
        <button
          onClick={() => onTabChange('active')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
            activeTab === 'active' ? 'bg-neutral-800 text-amber-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Active {hasActiveSession ? '●' : ''}
        </button>
        <button
          onClick={() => onTabChange('progress')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
            activeTab === 'progress' ? 'bg-neutral-800 text-amber-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Progress
        </button>
        <button
          onClick={() => onTabChange('routines')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
            activeTab === 'routines' ? 'bg-neutral-800 text-amber-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Routines
        </button>
        <button
          onClick={() => onTabChange('exercises')}
          className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
            activeTab === 'exercises' ? 'bg-neutral-800 text-amber-400 font-medium' : 'text-neutral-400'
          }`}
        >
          Library
        </button>
      </div>
    </header>
  );
};
