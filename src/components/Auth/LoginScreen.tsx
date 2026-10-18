import React, { useState } from 'react';
import { Bot, Sparkles, Layers, ShieldCheck, ArrowRight, ArrowLeft, Mail, User, Trash2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { AppLogo } from '../Common/AppLogo';

interface LoginScreenProps {
  onLogin: (provider: 'google' | 'github', manualData?: { email: string; name: string }) => void;
  onContinueAsGuest: () => void;
  isElectron: boolean;
  platform: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onContinueAsGuest,
  isElectron,
  platform
}) => {
  const [authMode, setAuthMode] = useState<'main' | 'google' | 'github'>('main');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [githubEmail, setGithubEmail] = useState('');
  const [githubName, setGithubName] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleManualGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    setLoadingProvider('google');
    setTimeout(() => {
      onLogin('google', { email: googleEmail.trim(), name: googleName.trim() || googleEmail.split('@')[0] });
      setLoadingProvider(null);
    }, 350);
  };

  const handleManualGithubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubEmail.trim()) return;
    setLoadingProvider('github');
    setTimeout(() => {
      onLogin('github', { email: githubEmail.trim(), name: githubName.trim() || githubEmail.split('@')[0] });
      setLoadingProvider(null);
    }, 350);
  };

  const handleClearCache = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ((window as any).electronAPI?.clearAppCache) {
        await (window as any).electronAPI.clearAppCache();
      }
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 2000);
    } catch (err) {
      console.error('Failed to clear cache:', err);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#141414] text-[#cccccc] select-none font-sans overflow-hidden">
      {/* Top Window Bar */}
      <div 
        style={{ WebkitAppRegion: 'drag' } as any}
        className={`h-[36px] px-3 flex items-center justify-between bg-[#181818] border-b border-[#2b2b2b] shrink-0 ${
          isElectron && platform === 'darwin' ? 'pl-[78px]' : ''
        }`}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <span className="text-[12px] font-medium text-white flex items-center gap-1.5">
            <AppLogo size={18} className="w-[18px] h-[18px] shrink-0 rounded" />
            <span>BlackHat</span>
          </span>
          <span className="text-[11px] text-[#555555]">/</span>
          <span className="text-[11px] text-[#858585]">
            {authMode === 'google' ? 'google-sign-in' : authMode === 'github' ? 'github-sign-in' : 'authentication'}
          </span>
        </div>

        {/* Windows Controls in Electron */}
        {isElectron && platform === 'win32' && (
          <div className="flex items-center ml-2 border-l border-[#2b2b2b] pl-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => (window as any).electronAPI.minimize()}
              className="w-8 h-7 flex items-center justify-center hover:bg-[#252525] text-[#858585] hover:text-white text-xs"
            >
              &#8212;
            </button>
            <button 
              onClick={() => (window as any).electronAPI.close()}
              className="w-8 h-7 flex items-center justify-center hover:bg-[#f85149] text-[#858585] hover:text-white text-xs"
            >
              &#10005;
            </button>
          </div>
        )}
      </div>

      {/* Main Authentication Center Screen */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-y-auto">
        {/* Subtle background ambient lighting */}
        <div className="absolute w-[450px] h-[450px] rounded-full bg-[#0078d4]/5 blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md bg-[#181818] border border-[#2b2b2b] rounded-xl shadow-2xl p-7 flex flex-col items-center text-center relative z-10 font-sans">
          
          {authMode === 'main' ? (
            <>
              {/* Logo Badge */}
              <div className="w-14 h-14 rounded-2xl bg-[#090d14] border border-[#223247] flex items-center justify-center p-2 mb-4 shadow-xl shadow-cyan-950/20">
                <AppLogo size={48} className="w-12 h-12" />
              </div>

              <h1 className="text-lg font-semibold text-white tracking-wide mb-1">
                Sign in to BlackHat
              </h1>
              <p className="text-xs text-[#858585] max-w-xs leading-relaxed mb-6">
                Autonomous multi-agent development environment. Sign in with your developer identity to continue.
              </p>

              {/* Social Auth Buttons */}
              <div className="w-full space-y-2.5 mb-4">
                {/* Google Login Button */}
                <button
                  onClick={() => setAuthMode('google')}
                  disabled={!!loadingProvider}
                  className="w-full h-11 px-4 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] hover:border-[#444444] text-white text-xs font-medium flex items-center justify-between transition-all cursor-pointer group disabled:opacity-50 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="font-normal">Continue with Google Account</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#858585] group-hover:text-white transition-colors" />
                </button>

                {/* GitHub Login Button */}
                <button
                  onClick={() => setAuthMode('github')}
                  disabled={!!loadingProvider}
                  className="w-full h-11 px-4 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] hover:border-[#444444] text-white text-xs font-medium flex items-center justify-between transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span className="font-normal">Continue with GitHub Account</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#858585] group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Value Props */}
              <div className="w-full pt-4 border-t border-[#262626] grid grid-cols-3 gap-2 text-[10px] text-[#858585] mb-4">
                <div className="flex flex-col items-center gap-1 p-2 rounded bg-[#1e1e1e]">
                  <Bot className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span className="text-[#cccccc] font-medium">3 Agents</span>
                  <span className="text-[9px]">Architect & Dev</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded bg-[#1e1e1e]">
                  <Layers className="w-3.5 h-3.5 text-[#3fb950]" />
                  <span className="text-[#cccccc] font-medium">Context Bus</span>
                  <span className="text-[9px]">Shared memory</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded bg-[#1e1e1e]">
                  <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                  <span className="text-[#cccccc] font-medium">Free AI Models</span>
                  <span className="text-[9px]">DeepSeek & Qwen</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full flex items-center gap-3 my-2">
                <div className="h-[1px] flex-1 bg-[#282828]" />
                <span className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold">Or use without sign-in</span>
                <div className="h-[1px] flex-1 bg-[#282828]" />
              </div>

              {/* Continue with Free Tier */}
              <button
                onClick={onContinueAsGuest}
                className="w-full h-11 px-4 rounded-lg bg-[#0e1724] hover:bg-[#132033] border border-[#00f0ff]/30 hover:border-[#00f0ff]/60 text-white text-xs font-medium flex items-center justify-between transition-all cursor-pointer group shadow-sm shadow-cyan-950/20 mb-3"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#00f0ff] group-hover:scale-110 transition-transform" />
                  <div className="text-left">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>Continue with Free Tier</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00f0ff]/15 text-[#00f0ff] font-mono border border-[#00f0ff]/30">FREE</span>
                    </div>
                    <div className="text-[10px] text-[#858585]">No sign-in or subscription required</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#00f0ff] opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Clear Cache Button */}
              <div className="pt-2 border-t border-[#222222] w-full flex items-center justify-between text-[11px] text-[#666666]">
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="flex items-center gap-1 hover:text-[#cccccc] transition-colors cursor-pointer text-[10px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{clearedNotice ? '✓ Cache cleared!' : 'Clear Cache & Reset Data'}</span>
                </button>
                <span>v1.0.0</span>
              </div>
            </>
          ) : authMode === 'google' ? (
            /* Manual Google Login Form */
            <form onSubmit={handleManualGoogleSubmit} className="w-full flex flex-col items-center">
              {/* Google Brand Header */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-2 mb-3 shadow-lg">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <h2 className="text-base font-semibold text-white mb-1">
                Sign in with Google Account
              </h2>
              <p className="text-xs text-[#858585] max-w-xs leading-relaxed mb-4">
                Enter your Google account email address to connect your workspace.
              </p>

              {/* Zero-Key Security Notice */}
              <div className="w-full p-2.5 rounded-lg bg-[#4285F4]/10 border border-[#4285F4]/20 text-[10px] text-[#cccccc] mb-4 text-left space-y-1">
                <div className="text-white font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#4285F4]" />
                  <span>Automated AI Federation (Zero Local Keys)</span>
                </div>
                <div>Your account session automatically enables Gemini, Claude, and Codex via ephemeral cloud tokens. No API keys are stored on this device.</div>
              </div>

              {/* Form Inputs */}
              <div className="w-full space-y-3.5 text-left mb-6">
                <div>
                  <label className="block text-[11px] font-medium text-[#cccccc] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>Google Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="e.g. developer@gmail.com or alex@company.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#333333] focus:border-[#4285F4] rounded-lg text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#cccccc] mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#34A853]" />
                    <span>Display Name (optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Chen"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#333333] focus:border-[#4285F4] rounded-lg text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="w-full flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAuthMode('main')}
                  className="flex-1 h-10 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] text-[#cccccc] hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={!googleEmail.trim() || !!loadingProvider}
                  className="flex-1 h-10 rounded-lg bg-[#4285F4] hover:bg-[#3367d6] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-blue-900/30 flex items-center justify-center gap-1.5"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* Manual GitHub Login Form */
            <form onSubmit={handleManualGithubSubmit} className="w-full flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#24292e] border border-[#444444] flex items-center justify-center p-2 mb-3 shadow-lg">
                <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>

              <h2 className="text-base font-semibold text-white mb-1">
                Sign in with GitHub
              </h2>
              <p className="text-xs text-[#858585] max-w-xs leading-relaxed mb-5">
                Enter your GitHub username or email to link your developer profile.
              </p>

              <div className="w-full space-y-3.5 text-left mb-6">
                <div>
                  <label className="block text-[11px] font-medium text-[#cccccc] mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-white" />
                    <span>GitHub Username or Email *</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. octocat or developer@github.com"
                    value={githubEmail}
                    onChange={(e) => setGithubEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#333333] focus:border-white rounded-lg text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#cccccc] mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Full Name (optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Chen"
                    value={githubName}
                    onChange={(e) => setGithubName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#333333] focus:border-white rounded-lg text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="w-full flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setAuthMode('main')}
                  className="flex-1 h-10 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] text-[#cccccc] hover:text-white text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={!githubEmail.trim() || !!loadingProvider}
                  className="flex-1 h-10 rounded-lg bg-[#2ea043] hover:bg-[#2c974b] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
