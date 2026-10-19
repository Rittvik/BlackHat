import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  User, 
  Trash2, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile } from '../../types';
import { AppLogo } from '../Common/AppLogo';

interface LoginScreenProps {
  onLogin: (userOrProvider: UserProfile | 'google' | 'github', manualData?: { email: string; name: string }) => void;
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
  const [authMode, setAuthMode] = useState<'main' | 'google-flow' | 'github-flow' | 'manual-fallback'>('main');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clearedNotice, setClearedNotice] = useState(false);

  // GitHub Device Flow State
  const [githubCodeData, setGithubCodeData] = useState<{
    userCode: string;
    verificationUri: string;
    deviceCode: string;
    interval: number;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Google OAuth State
  const [googleAuthState, setGoogleAuthState] = useState<{
    authUrl: string;
    state: string;
  } | null>(null);

  // Success Celebration State
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);

  // Manual fallback inputs
  const [manualProvider, setManualProvider] = useState<'google' | 'github'>('google');
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');

  const pollTimerRef = useRef<any>(null);

  const API_BASE = typeof window !== 'undefined' && window.location.protocol === 'file:' 
    ? 'http://localhost:3001' 
    : '';

  // Clean polling timers on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  const openUrl = (url: string) => {
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // --- START GOOGLE REAL OAUTH FLOW ---
  const handleStartGoogleAuth = async () => {
    setLoadingProvider('google');
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/google/start`);
      const data = await res.json();

      if (!res.ok || !data.authUrl || !data.state) {
        throw new Error(data.error || 'Failed to initiate Google authentication');
      }

      setGoogleAuthState({
        authUrl: data.authUrl,
        state: data.state
      });
      setAuthMode('google-flow');

      // Open Google OAuth consent page in the user's default browser
      openUrl(data.authUrl);

      // Start polling backend loopback state
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      
      pollTimerRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_BASE}/api/auth/google/poll?state=${encodeURIComponent(data.state)}`);
          const pollData = await pollRes.json();

          if (pollData.status === 'success' && pollData.user) {
            clearInterval(pollTimerRef.current);
            setAuthenticatedUser(pollData.user);
            setTimeout(() => {
              onLogin(pollData.user);
            }, 1200);
          } else if (pollData.status === 'expired') {
            clearInterval(pollTimerRef.current);
            setErrorMessage('Google authorization timed out. Please try again.');
          }
        } catch (pollErr) {
          console.error('Google poll error:', pollErr);
        }
      }, 1500);

    } catch (err: any) {
      console.error('Failed to start Google sign-in:', err);
      setErrorMessage(err.message || 'Unable to open Google sign-in.');
    } finally {
      setLoadingProvider(null);
    }
  };

  // --- START GITHUB REAL DEVICE CODE FLOW (RFC 8628) ---
  const handleStartGitHubAuth = async () => {
    setLoadingProvider('github');
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/github/device-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok || !data.device_code || !data.user_code) {
        throw new Error(data.error || 'Failed to initiate GitHub device flow');
      }

      setGithubCodeData({
        userCode: data.user_code,
        verificationUri: data.verification_uri || 'https://github.com/login/device',
        deviceCode: data.device_code,
        interval: data.interval || 5
      });
      setAuthMode('github-flow');

      // Automatically copy code to clipboard for instant pasting
      if (navigator.clipboard) {
        navigator.clipboard.writeText(data.user_code).then(() => {
          setCopiedCode(true);
          setTimeout(() => setCopiedCode(false), 3000);
        }).catch(() => {});
      }

      // Automatically open the GitHub Device Activation page in browser
      openUrl(data.verification_uri || 'https://github.com/login/device');

      // Start Polling GitHub for approval
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);

      const pollInterval = Math.max(3, data.interval || 5) * 1000;
      pollTimerRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`${API_BASE}/api/auth/github/poll`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_code: data.device_code })
          });
          const pollData = await pollRes.json();

          if (pollData.status === 'success' && pollData.user) {
            clearInterval(pollTimerRef.current);
            setAuthenticatedUser(pollData.user);
            setTimeout(() => {
              onLogin(pollData.user);
            }, 1200);
          } else if (pollData.status === 'expired' || pollData.status === 'denied' || pollData.status === 'error') {
            clearInterval(pollTimerRef.current);
            setErrorMessage(pollData.error || 'GitHub authorization was not completed. Please try again.');
          }
        } catch (pollErr) {
          console.error('GitHub poll error:', pollErr);
        }
      }, pollInterval);

    } catch (err: any) {
      console.error('Failed to start GitHub auth:', err);
      setErrorMessage(err.message || 'Unable to start GitHub authentication.');
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleCopyCode = () => {
    if (githubCodeData?.userCode && navigator.clipboard) {
      navigator.clipboard.writeText(githubCodeData.userCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleCancelFlow = () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
    }
    setAuthMode('main');
    setErrorMessage(null);
    setGithubCodeData(null);
    setGoogleAuthState(null);
    setLoadingProvider(null);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    onLogin(manualProvider, {
      email: manualEmail.trim(),
      name: manualName.trim() || manualEmail.split('@')[0]
    });
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
            {authMode === 'google-flow' ? 'google-oauth' : authMode === 'github-flow' ? 'github-oauth' : 'authentication'}
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
          
          {/* SUCCESS CELEBRATION SCREEN */}
          {authenticatedUser ? (
            <div className="w-full py-4 flex flex-col items-center animate-fade-in">
              <div className="relative mb-4">
                <img 
                  src={authenticatedUser.avatar} 
                  alt={authenticatedUser.name}
                  className="w-16 h-16 rounded-full border-2 border-[#00f0ff] object-cover shadow-lg shadow-cyan-950/40"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center border-2 border-[#181818]">
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </div>
              </div>

              <h2 className="text-base font-semibold text-white mb-1">
                Welcome back, {authenticatedUser.name}!
              </h2>
              <p className="text-xs text-[#858585] mb-4">
                {authenticatedUser.email}
              </p>

              <div className="w-full p-3 rounded-lg bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center gap-2 text-[#10b981] text-xs font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Authentication verified. Connecting workspace...</span>
              </div>
            </div>

          ) : authMode === 'main' ? (
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

              {errorMessage && (
                <div className="w-full mb-4 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Real OAuth Buttons */}
              <div className="w-full space-y-2.5 mb-4">
                {/* Real Google OAuth Button */}
                <button
                  onClick={handleStartGoogleAuth}
                  disabled={loadingProvider === 'google'}
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
                    <span className="font-normal">
                      {loadingProvider === 'google' ? 'Connecting to Google...' : 'Continue with Google Account'}
                    </span>
                  </div>
                  {loadingProvider === 'google' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-[#4285F4] animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-[#858585] group-hover:text-white transition-colors" />
                  )}
                </button>

                {/* Real GitHub OAuth Button */}
                <button
                  onClick={handleStartGitHubAuth}
                  disabled={loadingProvider === 'github'}
                  className="w-full h-11 px-4 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] hover:border-[#444444] text-white text-xs font-medium flex items-center justify-between transition-all cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    <span className="font-normal">
                      {loadingProvider === 'github' ? 'Connecting to GitHub...' : 'Continue with GitHub Account'}
                    </span>
                  </div>
                  {loadingProvider === 'github' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-[#858585] group-hover:text-white transition-colors" />
                  )}
                </button>
              </div>

              {/* Security & Zero Key Federation Notice */}
              <div className="w-full p-2.5 rounded-lg bg-[#0078d4]/10 border border-[#0078d4]/20 text-[10px] text-[#cccccc] mb-4 text-left flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0078d4] shrink-0 mt-0.5" />
                <div>
                  <span className="text-white font-medium">Standard Antigravity / VS Code Architecture: </span>
                  Authenticates via system browser. Ephemeral token exchange with zero stored API keys.
                </div>
              </div>

              {/* Value Props */}
              <div className="w-full pt-3 border-t border-[#262626] grid grid-cols-3 gap-2 text-[10px] text-[#858585] mb-4">
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

              {/* Secondary Options */}
              <div className="w-full flex items-center justify-between text-[11px] text-[#666666] pt-2 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={handleClearCache}
                  className="flex items-center gap-1 hover:text-[#cccccc] transition-colors cursor-pointer text-[10px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{clearedNotice ? '✓ Cache cleared!' : 'Clear Cache & Reset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMode('manual-fallback')}
                  className="text-[10px] hover:text-[#858585] underline transition-colors"
                >
                  Offline / Manual Login
                </button>
              </div>
            </>

          ) : authMode === 'google-flow' ? (
            /* ACTIVE GOOGLE OAUTH FLOW */
            <div className="w-full flex flex-col items-center">
              {/* Google Brand Header */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-2 mb-3 shadow-lg relative">
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
                Authorizing with Google
              </h2>
              <p className="text-xs text-[#858585] max-w-xs leading-relaxed mb-5">
                We launched Google sign-in in your default browser. Select your Google account and grant permissions to complete the link.
              </p>

              {errorMessage && (
                <div className="w-full mb-4 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Waiting Indicator Card */}
              <div className="w-full p-4 rounded-xl bg-[#111111] border border-[#2b2b2b] flex flex-col items-center gap-3 mb-5">
                <div className="flex items-center gap-2 text-xs text-[#4285F4] font-medium">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#4285F4]" />
                  <span>Waiting for Google authentication in browser...</span>
                </div>
                <div className="text-[11px] text-[#777777]">
                  Loopback listener active at 127.0.0.1:3001
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2">
                {googleAuthState?.authUrl && (
                  <button
                    type="button"
                    onClick={() => openUrl(googleAuthState.authUrl)}
                    className="w-full h-10 rounded-lg bg-[#4285F4] hover:bg-[#3367d6] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-blue-900/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Re-open Google Sign-In in Browser</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCancelFlow}
                  className="w-full h-9 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] text-[#cccccc] hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

          ) : authMode === 'github-flow' ? (
            /* ACTIVE GITHUB DEVICE CODE FLOW */
            <div className="w-full flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#24292e] border border-[#444444] flex items-center justify-center p-2 mb-3 shadow-lg">
                <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>

              <h2 className="text-base font-semibold text-white mb-1">
                Authorize BlackHat on GitHub
              </h2>
              <p className="text-xs text-[#858585] max-w-xs leading-relaxed mb-4">
                Confirm this one-time activation code on GitHub to authorize this device.
              </p>

              {errorMessage && (
                <div className="w-full mb-4 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Large Monospace User Code Display */}
              <div className="w-full p-4 rounded-xl bg-[#090d14] border-2 border-[#30363d] flex flex-col items-center gap-2 mb-4">
                <span className="text-[11px] text-[#858585] uppercase tracking-wider font-semibold">Your One-Time Code</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-mono font-bold tracking-widest text-[#58a6ff]">
                    {githubCodeData?.userCode || '---- ----'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded hover:bg-[#1f2937] text-[#858585] hover:text-white transition-colors cursor-pointer"
                    title="Copy code"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {copiedCode && (
                  <span className="text-[10px] text-[#10b981] font-medium">✓ Copied to clipboard!</span>
                )}
              </div>

              {/* Polling Indicator */}
              <div className="w-full flex items-center justify-center gap-2 text-xs text-[#858585] mb-5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#2ea043]" />
                <span>Waiting for authorization on GitHub...</span>
              </div>

              {/* GitHub Flow Actions */}
              <div className="w-full space-y-2">
                <button
                  type="button"
                  onClick={() => openUrl(githubCodeData?.verificationUri || 'https://github.com/login/device')}
                  className="w-full h-10 rounded-lg bg-[#2ea043] hover:bg-[#2c974b] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open github.com/login/device</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelFlow}
                  className="w-full h-9 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] text-[#cccccc] hover:text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

          ) : (
            /* MANUAL / OFFLINE FALLBACK FORM */
            <form onSubmit={handleManualSubmit} className="w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('main')}
                  className="text-xs text-[#858585] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to OAuth</span>
                </button>
                <span className="text-[11px] text-[#666666]">Developer Mode</span>
              </div>

              <h2 className="text-base font-semibold text-white mb-1">
                Developer Identity Login
              </h2>
              <p className="text-xs text-[#858585] max-w-xs leading-relaxed mb-4">
                For offline, sandboxed, or remote headless environments.
              </p>

              {/* Provider Selector */}
              <div className="w-full grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setManualProvider('google')}
                  className={`h-9 rounded-lg border text-xs font-medium transition-colors ${
                    manualProvider === 'google'
                      ? 'bg-[#4285F4]/20 border-[#4285F4] text-white'
                      : 'bg-[#222222] border-[#333333] text-[#858585]'
                  }`}
                >
                  Google Profile
                </button>
                <button
                  type="button"
                  onClick={() => setManualProvider('github')}
                  className={`h-9 rounded-lg border text-xs font-medium transition-colors ${
                    manualProvider === 'github'
                      ? 'bg-[#2ea043]/20 border-[#2ea043] text-white'
                      : 'bg-[#222222] border-[#333333] text-[#858585]'
                  }`}
                >
                  GitHub Profile
                </button>
              </div>

              {/* Inputs */}
              <div className="w-full space-y-3 text-left mb-5">
                <div>
                  <label className="text-[11px] font-medium text-[#cccccc] mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#0078d4]" />
                    <span>Email Address *</span>
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="developer@example.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#333333] focus:border-[#0078d4] rounded-lg text-white text-xs outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#cccccc] mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Chen"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full h-10 px-3 bg-[#111111] border border-[#333333] focus:border-[#0078d4] rounded-lg text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!manualEmail.trim()}
                className="w-full h-10 rounded-lg bg-[#0078d4] hover:bg-[#006cbd] text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                Sign In
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
