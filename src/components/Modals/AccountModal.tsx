import React, { useState } from 'react';
import { 
  X, 
  User, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Code2, 
  CheckCircle2, 
  AlertCircle,
  Link2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { UserProfile, AISettings } from '../../types';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  settings: AISettings;
  onLogin: (provider: 'google' | 'github') => void;
  onLogout: () => void;
  onUpdateSubscription: (provider: 'gemini' | 'claude' | 'codex', updates: any) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  onLogin,
  onLogout,
  onUpdateSubscription
}) => {
  const [activeTab, setActiveTab] = useState<'account' | 'subscriptions'>('account');
  const [editingTokenProvider, setEditingTokenProvider] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-lg bg-ide-sidebar border border-ide-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-ide-border bg-ide-panel shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-ide-accent" />
            <span className="text-sm font-semibold text-white">Accounts & AI Subscriptions</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ide-hover rounded text-ide-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-ide-border bg-ide-darkest px-4 pt-2 gap-4 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('account')}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              activeTab === 'account'
                ? 'border-ide-accent text-white'
                : 'border-transparent text-ide-muted hover:text-white'
            }`}
          >
            User Profile & Auth
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'subscriptions'
                ? 'border-ide-accent text-white'
                : 'border-transparent text-ide-muted hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-ide-amber" />
            AI Subscriptions (Gemini / Claude / Codex)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4 text-xs">
          {activeTab === 'account' ? (
            <div className="space-y-4">
              {user.isLoggedIn ? (
                /* Logged In Card */
                <div className="p-4 rounded-xl bg-ide-panel border border-ide-border flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-12 h-12 rounded-full border border-ide-accent/40 shadow-sm"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#182335] border border-[#00f0ff]/40 flex items-center justify-center text-[#00f0ff] shadow-sm">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{user.name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 font-semibold">
                            {user.subscriptionTier || 'Free'}
                          </span>
                        </div>
                        <span className="text-ide-muted text-[11px]">{user.email}</span>
                      </div>
                    </div>

                    <button
                      onClick={onLogout}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-ide-rose hover:bg-ide-rose/10 border border-ide-rose/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>

                  {/* Connected Accounts List */}
                  <div className="border-t border-ide-border/60 pt-3 space-y-2">
                    <span className="text-[11px] font-semibold text-ide-text uppercase tracking-wider">
                      Connected Identity Providers
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {/* Google Connection */}
                      <div className="p-2.5 rounded-lg bg-ide-darkest border border-ide-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                          </svg>
                          <span className="font-medium text-white">Google</span>
                        </div>
                        {user.linkedAccounts.google ? (
                          <span className="text-[10px] text-ide-emerald flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Linked
                          </span>
                        ) : (
                          <button
                            onClick={() => onLogin('google')}
                            className="text-[10px] text-ide-accent hover:underline"
                          >
                            Connect
                          </button>
                        )}
                      </div>

                      {/* GitHub Connection */}
                      <div className="p-2.5 rounded-lg bg-ide-darkest border border-ide-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 shrink-0 fill-current text-white" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                          </svg>
                          <span className="font-medium text-white">GitHub</span>
                        </div>
                        {user.linkedAccounts.github ? (
                          <span className="text-[10px] text-ide-emerald flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            Linked
                          </span>
                        ) : (
                          <button
                            onClick={() => onLogin('github')}
                            className="text-[10px] text-ide-accent hover:underline"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Logged Out View - Sign In Options */
                <div className="p-6 rounded-xl bg-ide-panel border border-ide-border flex flex-col items-center text-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-ide-accent/20 border border-ide-accent/40 flex items-center justify-center text-ide-accent">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sign In to BlackHat IDE</h3>
                    <p className="text-xs text-ide-muted mt-1 max-w-xs">
                      Sync your multi-agent workspaces, custom extensions, and link external AI subscriptions across your devices.
                    </p>
                  </div>

                  {/* OAuth Buttons */}
                  <div className="w-full max-w-xs space-y-2 mt-2">
                    <button
                      onClick={() => onLogin('google')}
                      className="w-full py-2 px-4 rounded-lg bg-white text-gray-900 font-medium hover:bg-gray-100 flex items-center justify-center gap-2.5 transition-all shadow-md text-xs"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Continue with Google
                    </button>

                    <button
                      onClick={() => onLogin('github')}
                      className="w-full py-2 px-4 rounded-lg bg-[#24292e] text-white font-medium hover:bg-[#2f363d] flex items-center justify-center gap-2.5 transition-all shadow-md text-xs border border-white/10"
                    >
                      <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                      Continue with GitHub
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* AI Subscriptions Tab */
            <div className="space-y-4">
              {/* Google Account Federation Banner */}
              {user.isLoggedIn && (user.provider === 'google' || user.autoAuthEnabled) ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0078d4]/15 via-[#1a73e8]/10 to-transparent border border-[#0078d4]/30 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#388bfd]" />
                      <span className="font-semibold text-white text-xs">
                        Google Account Federation Active
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#238636]/20 border border-[#238636]/40 text-[#3fb950] text-[10px] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
                      Zero Local Storage
                    </span>
                  </div>
                  <p className="text-[11px] text-[#cccccc] leading-relaxed">
                    Account: <strong className="text-white font-mono">{user.email}</strong>. 
                    In accordance with <strong>Antigravity IDE & VS Code architecture</strong>, your active Google account automatically authenticates <strong>Gemini</strong>, <strong>Claude</strong>, and <strong>Codex</strong> via transient cloud sessions. Zero plaintext API keys are saved on your computer.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-ide-accent/10 border border-ide-accent/20 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-ide-accent shrink-0 mt-0.5" />
                  <p className="text-[11px] text-ide-text leading-relaxed">
                    Have an existing subscription to <strong>Google Gemini Advanced</strong>, <strong>Claude Pro / Claude Code</strong>, or <strong>OpenAI Codex / ChatGPT Plus</strong>? 
                    Sign in with your Google account to automatically link and activate models without manual key management.
                  </p>
                </div>
              )}

              {/* 1. Google Gemini Subscription */}
              <div className="p-3.5 rounded-xl bg-ide-panel border border-ide-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">Google Gemini Subscription</span>
                        {settings.subscriptions.gemini.isActive ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-ide-card text-ide-muted border border-ide-border">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ide-muted">
                        Gemini 2.5 Pro, Flash, Google One AI Premium & AI Studio
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateSubscription('gemini', {
                        isActive: !settings.subscriptions.gemini.isActive,
                        accountEmail: user.email || 'developer@google.com',
                        tier: 'Pro'
                      });
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                      settings.subscriptions.gemini.isActive
                        ? 'bg-ide-rose/20 text-ide-rose border border-ide-rose/30 hover:bg-ide-rose/30'
                        : 'bg-ide-accent hover:bg-ide-accentHover text-white'
                    }`}
                  >
                    {settings.subscriptions.gemini.isActive ? 'Disconnect' : 'Connect Account'}
                  </button>
                </div>

                {settings.subscriptions.gemini.isActive && (
                  <div className="p-2 rounded bg-ide-darkest border border-ide-border/60 text-[10px] text-ide-muted flex items-center justify-between">
                    <span>Account: <strong className="text-white">{settings.subscriptions.gemini.accountEmail}</strong> ({settings.subscriptions.gemini.tier})</span>
                    <span className="text-ide-emerald flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Architect & Agents
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Anthropic Claude Subscription */}
              <div className="p-3.5 rounded-xl bg-ide-panel border border-ide-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">Claude Code & Pro Subscription</span>
                        {settings.subscriptions.claude.isActive ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-ide-card text-ide-muted border border-ide-border">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ide-muted">
                        Claude 3.7 Sonnet, Claude Code CLI subscription & Reasoning
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateSubscription('claude', {
                        isActive: !settings.subscriptions.claude.isActive,
                        accountEmail: user.email || 'developer@anthropic.com',
                        tier: 'Pro'
                      });
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                      settings.subscriptions.claude.isActive
                        ? 'bg-ide-rose/20 text-ide-rose border border-ide-rose/30 hover:bg-ide-rose/30'
                        : 'bg-ide-accent hover:bg-ide-accentHover text-white'
                    }`}
                  >
                    {settings.subscriptions.claude.isActive ? 'Disconnect' : 'Connect Account'}
                  </button>
                </div>

                {settings.subscriptions.claude.isActive && (
                  <div className="p-2 rounded bg-ide-darkest border border-ide-border/60 text-[10px] text-ide-muted flex items-center justify-between">
                    <span>Account: <strong className="text-white">{settings.subscriptions.claude.accountEmail}</strong> ({settings.subscriptions.claude.tier})</span>
                    <span className="text-ide-emerald flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Developer & Agents
                    </span>
                  </div>
                )}
              </div>

              {/* 3. OpenAI Codex & ChatGPT Plus Subscription */}
              <div className="p-3.5 rounded-xl bg-ide-panel border border-ide-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-white">OpenAI Codex / Plus Subscription</span>
                        {settings.subscriptions.codex.isActive ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-ide-card text-ide-muted border border-ide-border">
                            Not Linked
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-ide-muted">
                        Codex, ChatGPT Plus / Team, GPT-4o, o1, o3-mini models
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateSubscription('codex', {
                        isActive: !settings.subscriptions.codex.isActive,
                        accountEmail: user.email || 'developer@openai.com',
                        tier: 'Pro'
                      });
                    }}
                    className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                      settings.subscriptions.codex.isActive
                        ? 'bg-ide-rose/20 text-ide-rose border border-ide-rose/30 hover:bg-ide-rose/30'
                        : 'bg-ide-accent hover:bg-ide-accentHover text-white'
                    }`}
                  >
                    {settings.subscriptions.codex.isActive ? 'Disconnect' : 'Connect Account'}
                  </button>
                </div>

                {settings.subscriptions.codex.isActive && (
                  <div className="p-2 rounded bg-ide-darkest border border-ide-border/60 text-[10px] text-ide-muted flex items-center justify-between">
                    <span>Account: <strong className="text-white">{settings.subscriptions.codex.accountEmail}</strong> ({settings.subscriptions.codex.tier})</span>
                    <span className="text-ide-emerald flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Tester & Agents
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
