import React, { useState } from 'react';
import {
  User,
  LogIn,
  UserPlus,
  Check,
  ShieldCheck,
  Flame,
  Dumbbell,
} from 'lucide-react';
import { UserAccount } from '../types/fitness';
import { getUserSessions } from '../utils/storage';

interface AuthModalProps {
  currentUser: UserAccount | null;
  accounts: UserAccount[];
  onSelectUser: (user: UserAccount) => void;
  onCreateUser: (name: string, email: string) => void;
  onLogout?: () => void;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentUser,
  accounts,
  onSelectUser,
  onCreateUser,
  onLogout,
  onClose,
}) => {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [newName, setNewName] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    onCreateUser(newName.trim(), newEmail.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <User className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-neutral-100">
              Athlete Accounts & Sync
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-100 px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Segmented Tab Controls (Zero-Pill discipline) */}
        <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => setTab('signin')}
            className={`flex-1 py-1.5 font-medium rounded transition-colors ${
              tab === 'signin'
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Log In / Switch User
          </button>
          <button
            type="button"
            onClick={() => setTab('signup')}
            className={`flex-1 py-1.5 font-medium rounded transition-colors ${
              tab === 'signup'
                ? 'bg-neutral-800 text-neutral-100 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            + Create New Account
          </button>
        </div>

        {/* TAB 1: SIGN IN / SWITCH USER */}
        {tab === 'signin' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Saved Accounts on this Device:</span>
              <span className="font-mono">{accounts.length} Profiles</span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {accounts.map((acc) => {
                const isCurrent = currentUser?.id === acc.id;
                const userWorkouts = getUserSessions(acc.id);

                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      onSelectUser(acc);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded border text-left transition-colors ${
                      isCurrent
                        ? 'bg-amber-500/10 border-amber-400 text-neutral-100'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-neutral-950 uppercase"
                        style={{ backgroundColor: acc.avatarColor || '#f59e0b' }}
                      >
                        {acc.name.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                          <span>{acc.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono text-amber-400 font-normal">
                              (Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono text-[11px] text-neutral-400">
                      <div>{userWorkouts.length} Workouts</div>
                      {isCurrent ? (
                        <span className="text-amber-400 text-xs">● Loaded</span>
                      ) : (
                        <span className="text-neutral-500 hover:text-neutral-300">
                          Log In →
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="text-[11px] text-neutral-500 text-center pt-1">
              Your workouts, personal records, and goals are saved under each account.
            </p>
          </div>
        )}

        {/* TAB 2: CREATE NEW ACCOUNT (STARTS AT ZERO) */}
        {tab === 'signup' && (
          <form onSubmit={handleCreateSubmit} className="space-y-3.5 pt-1">
            <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                <Flame className="h-4 w-4" />
                <span>Zero Baseline Guarantee</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                When you create your account, everything starts cleanly at 0. You will set your fitness goals, and a tailored workout plan will be automatically generated.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Hayes"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. jordan@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Password (Optional)
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={!newName.trim() || !newEmail.trim()}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded shadow-sm transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account & Setup Goals</span>
              </button>
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
          {currentUser && onLogout ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Log Out of Account
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-100 bg-neutral-800 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
