import React, { useState } from 'react';
import {
  Dumbbell,
  Target,
  Flame,
  TrendingUp,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { UserAccount } from '../types/fitness';
import { getUserSessions } from '../utils/storage';

interface LandingHomePageProps {
  savedAccounts: UserAccount[];
  onLogin: (account: UserAccount) => void;
  onCreateAccount: (name: string, email: string) => void;
  onExploreDemo: () => void;
}

export const LandingHomePage: React.FC<LandingHomePageProps> = ({
  savedAccounts,
  onLogin,
  onCreateAccount,
  onExploreDemo,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(
    savedAccounts.length > 0 ? 'login' : 'signup'
  );

  // Form states
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState<string>(
    savedAccounts[0]?.email || ''
  );
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please provide your name and email.');
      return;
    }
    setErrorMessage('');
    onCreateAccount(name.trim(), email.trim());
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setErrorMessage('Please enter your email.');
      return;
    }

    const matched = savedAccounts.find(
      (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (matched) {
      setErrorMessage('');
      onLogin(matched);
    } else {
      // If not found in saved list, create or log in seamlessly
      setErrorMessage('');
      onCreateAccount(loginEmail.split('@')[0], loginEmail.trim());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
          {/* Brand Wordmark */}
          <div className="flex items-center gap-2 text-left text-lg font-bold tracking-tight text-neutral-100 whitespace-nowrap shrink-0">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Dumbbell className="h-4 w-4" />
            </span>
            <span>KRATOS</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onExploreDemo}
              className="text-xs font-mono text-neutral-400 hover:text-neutral-100 transition-colors hidden sm:inline"
            >
              Explore Demo Mode
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors whitespace-nowrap shrink-0"
            >
              Create Account
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Auth Split */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:py-16 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 tracking-wider uppercase">
              <span>Scientific Progressive Overload</span>
              <span aria-hidden="true">·</span>
              <span>Clean Slate Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-100 text-balance leading-tight">
              Track your strength progression. Set weekly targets. Never plateau.
            </h1>

            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl">
              Kratos is a dedicated workout planner and volume tracker built for serious lifters. Track set-by-set weights with ghost memory, automated rest times, and scientific Epley 1RM progression analytics.
            </p>

            {/* Proof Points Strip (Unboxed metadata) */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-300 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Starts Clean at 0</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Instant lbs ↔ kg Conversion</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Automated Routine Synthesis</span>
              </div>
            </div>

            {/* Quote / Philosophy Callout */}
            <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded space-y-1 text-xs text-neutral-400 max-w-lg">
              <div className="font-semibold text-neutral-200">
                "What gets measured gets improved."
              </div>
              <p>
                When you create your account, you will configure your weekly training frequency and goals. A complete split routine will be engineered and placed on your calendar instantly.
              </p>
            </div>
          </div>

          {/* Right Column: Embedded Login & Sign-Up Card */}
          <div id="auth-card" className="lg:col-span-5">
            <div className="p-6 sm:p-7 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl space-y-5">
              {/* Segmented Auth Tabs */}
              <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded border border-neutral-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 font-medium rounded transition-colors ${
                    authMode === 'login'
                      ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 font-medium rounded transition-colors ${
                    authMode === 'signup'
                      ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {errorMessage && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/60 rounded text-xs text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* LOG IN FORM */}
              {authMode === 'login' && (
                <div className="space-y-4">
                  {/* If user previously created accounts on this device */}
                  {savedAccounts.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs text-neutral-400 font-medium">
                        Select an Account on this Device:
                      </span>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {savedAccounts.map((acc) => {
                          const count = getUserSessions(acc.id).length;
                          return (
                            <button
                              key={acc.id}
                              type="button"
                              onClick={() => onLogin(acc)}
                              className="w-full flex items-center justify-between p-3 bg-neutral-950 hover:bg-neutral-800/80 border border-neutral-800 hover:border-amber-400/50 rounded transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-neutral-950 uppercase"
                                  style={{ backgroundColor: acc.avatarColor || '#f59e0b' }}
                                >
                                  {acc.name.slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-neutral-100">
                                    {acc.name}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 font-mono">
                                    {acc.email}
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs font-mono text-amber-400 font-semibold">
                                {count} logs →
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-2 text-center">
                        <span className="text-[11px] text-neutral-500">or sign in with credentials</span>
                      </div>
                    </div>
                  ) : null}

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="athlete@kratos.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      <span>Log In to Account</span>
                    </button>
                  </form>
                </div>
              )}

              {/* CREATE ACCOUNT FORM (Starts cleanly at 0) */}
              {authMode === 'signup' && (
                <form onSubmit={handleCreateSubmit} className="space-y-3.5">
                  <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                      <Flame className="h-4 w-4" />
                      <span>Zero Baseline Guarantee</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Your account starts cleanly at 0. You will set your goals in the onboarding wizard, and a customized training plan will be generated based on your answers.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Marcus Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. marcus@fitness.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1">
                      Create Password (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-neutral-100 focus:outline-hidden focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Account & Setup Goals</span>
                  </button>
                </form>
              )}

              {/* Demo Mode Fallback link */}
              <div className="pt-2 border-t border-neutral-800 text-center">
                <button
                  type="button"
                  onClick={onExploreDemo}
                  className="text-xs text-neutral-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1"
                >
                  <span>Or preview with pre-populated demo data</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Core System Architecture Pillars */}
        <section id="features" className="space-y-6 pt-8 border-t border-neutral-800">
          <div>
            <span className="text-xs font-mono uppercase text-amber-400 tracking-wider">
              System Capabilities
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-100 mt-1">
              Built for Consistent Progression
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-100">
                01. 7-Day Training Calendar
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Schedule your training split across the week. Monitor weekly completed sets against recommended hypertrophy benchmarks (10–20 sets per muscle group).
              </p>
            </div>

            <div className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-100">
                02. Active Stopwatch & Ghost Sets
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Live workout session cockpit with ghost values showing your last workout's weight and reps so you know exactly what to beat. Integrated audio rest timers keep intensity locked.
              </p>
            </div>

            <div className="p-5 bg-neutral-900/50 border border-neutral-800 rounded-lg space-y-3">
              <div className="flex h-9 w-9 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-100">
                03. Epley 1RM & Volume Analytics
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Automatic personal record detection using the scientific Epley equation. Volume accumulation charts and Push/Pull/Legs balance meters ensure symmetry.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-6 px-6 mt-auto">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-400">KRATOS ATHLETICS</span>
            <span aria-hidden="true">·</span>
            <span>Progressive Overload & Periodization Architecture</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span>Private Storage</span>
            <span aria-hidden="true">·</span>
            <span>Accurate Plate Conversions</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
