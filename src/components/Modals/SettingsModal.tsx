import React, { useState } from 'react';
import { X, Key, Cpu, Sparkles, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { AISettings, UserProfile } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  user?: UserProfile;
  onSave: (settings: AISettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  user,
  onSave
}) => {
  const [formData, setFormData] = useState<AISettings>({ ...settings });
  const [savedNotification, setSavedNotification] = useState(false);
  const [activeTab, setActiveTab] = useState<'free-models' | 'keys' | 'subscriptions'>('free-models');
  const [showCustomOverrides, setShowCustomOverrides] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedNotification(true);
    setTimeout(() => {
      setSavedNotification(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-lg bg-ide-sidebar border border-ide-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-ide-border bg-ide-panel shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-ide-accent" />
            <span className="text-sm font-semibold text-white">AI Engine & Model Configuration</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ide-hover rounded text-ide-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-ide-border bg-ide-darkest px-4 pt-2 gap-4 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('free-models')}
            className={`pb-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'free-models'
                ? 'border-ide-accent text-white'
                : 'border-transparent text-ide-muted hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
            Free AI Models (No Sub Needed)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`pb-2 font-medium border-b-2 transition-colors ${
              activeTab === 'keys'
                ? 'border-ide-accent text-white'
                : 'border-transparent text-ide-muted hover:text-white'
            }`}
          >
            API Keys & Providers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'subscriptions'
                ? 'border-ide-accent text-white'
                : 'border-transparent text-ide-muted hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-ide-amber" />
            Paid Subscriptions
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 text-xs font-sans max-h-[70vh] overflow-y-auto">
          {activeTab === 'free-models' && (
            <div className="space-y-4">
              {/* Highlight Banner */}
              <div className="p-3.5 rounded-xl bg-[#091524] border border-[#00f0ff]/30 text-[#cccccc] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Sparkles className="w-4 h-4 text-[#00f0ff]" />
                  <span>Free AI Models Active (No Subscription Required)</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94a3b8]">
                  Even if you do not have an active AI subscription or do not wish to sign in, BlackHat provides free access to high-performance open coding models.
                </p>
              </div>

              {/* Free Models List */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-semibold text-white uppercase tracking-wider">
                  Available Free Tier Models
                </span>

                {/* Google Gemini 2.5 Flash Free Tier */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Google Gemini 2.5 Flash</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#4285F4]/15 text-[#4285F4] font-mono border border-[#4285F4]/30">FREE TIER</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">Official Google Gemini free tier for sub-second responses & multi-modal reasoning</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Included</span>
                </div>

                {/* OpenAI Codex / GPT-4o mini Free Tier */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>OpenAI Codex / GPT-4o mini</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#10a37f]/15 text-[#10a37f] font-mono border border-[#10a37f]/30">FREE TIER</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">Official OpenAI free tier coding model for fast completions & scripts</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Included</span>
                </div>

                {/* Anthropic Claude 3.5 Haiku Free Tier */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Anthropic Claude 3.5 Haiku</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#d97706]/15 text-[#d97706] font-mono border border-[#d97706]/30">FREE TIER</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">Official Anthropic Claude lightweight free tier model with low latency</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Included</span>
                </div>

                {/* DeepSeek R1 */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>DeepSeek R1</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00f0ff]/15 text-[#00f0ff] font-mono border border-[#00f0ff]/30">FREE</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">Specialized in System Architecture, logic decomposition & planning</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Included</span>
                </div>

                {/* Qwen 2.5 Coder */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Qwen 2.5 Coder 32B</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00f0ff]/15 text-[#00f0ff] font-mono border border-[#00f0ff]/30">FREE</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">State-of-the-art coding, code refactoring & bug fixing</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Included</span>
                </div>

                {/* Llama 3.3 70B */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Llama 3.3 70B</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#00f0ff]/15 text-[#00f0ff] font-mono border border-[#00f0ff]/30">FREE</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">Testing assertions, edge cases & regression verification</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Included</span>
                </div>

                {/* Local Ollama */}
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>Local Ollama</span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#3fb950]/15 text-[#3fb950] font-mono border border-[#3fb950]/30">OFFLINE</span>
                    </div>
                    <div className="text-[10px] text-ide-muted">100% private on your machine (localhost:11434)</div>
                  </div>
                  <span className="text-[10px] text-[#3fb950] font-medium">Ready</span>
                </div>
              </div>

              {/* Default Free Model */}
              <div className="space-y-1 pt-2 border-t border-ide-border">
                <label className="font-medium text-ide-text">Default Model for New Agents</label>
                <select
                  value={formData.defaultModel}
                  onChange={(e) => setFormData({ ...formData, defaultProvider: 'free', defaultModel: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent text-xs font-mono"
                >
                  <option value="gemini-flash">Google Gemini 2.5 Flash [Free Tier]</option>
                  <option value="codex-mini">OpenAI Codex / GPT-4o mini [Free Tier]</option>
                  <option value="claude-haiku">Anthropic Claude 3.5 Haiku [Free Tier]</option>
                  <option value="deepseek-r1">DeepSeek R1 [Free]</option>
                  <option value="qwen-coder">Qwen 2.5 Coder [Free]</option>
                  <option value="llama-3.3">Llama 3.3 70B [Free]</option>
                  <option value="mistral">Mistral Small [Free]</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <>
              {/* Google Account Auto-Auth & Zero-Local-Storage Banner */}
              {user?.isLoggedIn && (user?.provider === 'google' || user?.autoAuthEnabled) ? (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#0078d4]/15 via-[#1a73e8]/10 to-transparent border border-[#0078d4]/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#388bfd]" />
                      <span className="font-semibold text-white text-xs">
                        Connected via Google Account
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#238636]/20 border border-[#238636]/40 text-[#3fb950] text-[10px] font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
                      Auto-Authenticated
                    </span>
                  </div>

                  <p className="text-[11px] text-[#cccccc] leading-relaxed">
                    Signed in as <span className="text-white font-mono font-medium">{user.email}</span>.
                    Following the <strong className="text-white">Antigravity & VS Code security protocol</strong>, your models (Gemini, Claude, Codex) authenticate dynamically via transient cloud sessions.
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded bg-[#111111] border border-[#2b2b2b] flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#858585]">Google Gemini</span>
                      <span className="text-[11px] text-[#3fb950] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-Linked
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#111111] border border-[#2b2b2b] flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#858585]">Anthropic Claude</span>
                      <span className="text-[11px] text-[#3fb950] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-Linked
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#111111] border border-[#2b2b2b] flex flex-col gap-0.5">
                      <span className="text-[10px] text-[#858585]">OpenAI Codex</span>
                      <span className="text-[11px] text-[#3fb950] font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-Linked
                      </span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-[10px] text-[#858585] border-t border-[#2b2b2b]/60">
                    <span className="text-[#3fb950] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Zero API keys stored on local disk
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCustomOverrides(!showCustomOverrides)}
                      className="text-[#58a6ff] hover:underline cursor-pointer"
                    >
                      {showCustomOverrides ? 'Hide manual key override' : 'Custom BYOK override (Optional)'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-ide-panel border border-ide-border text-xs text-ide-muted space-y-1">
                  <div className="font-semibold text-white">Manual API Key Configuration</div>
                  <div>Sign in with a Google Account to enable automatic zero-storage cloud authentication across models.</div>
                </div>
              )}

              {/* Show Inputs if not Google-authenticated or if user explicitly toggled BYOK override */}
              {(!user?.isLoggedIn || user?.provider !== 'google' || showCustomOverrides) && (
                <>
                  {/* Gemini API Key */}
                  <div className="space-y-1">
                    <label className="font-medium text-ide-text flex items-center justify-between">
                      <span>Google Gemini API Key</span>
                      <span className="text-[10px] text-ide-muted font-normal">Optional (Simulation fallback if blank)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="AIzaSy..."
                        value={formData.geminiApiKey}
                        onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                        className="w-full pl-8 pr-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent font-mono text-xs"
                      />
                      <Key className="w-3.5 h-3.5 text-ide-muted absolute left-2.5 top-2" />
                    </div>
                  </div>

                  {/* Anthropic Claude API Key */}
                  <div className="space-y-1">
                    <label className="font-medium text-ide-text flex items-center justify-between">
                      <span>Anthropic Claude API Key</span>
                      <span className="text-[10px] text-ide-muted font-normal">sk-ant-...</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="sk-ant-api03-..."
                        value={formData.anthropicApiKey}
                        onChange={(e) => setFormData({ ...formData, anthropicApiKey: e.target.value })}
                        className="w-full pl-8 pr-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent font-mono text-xs"
                      />
                      <Key className="w-3.5 h-3.5 text-ide-muted absolute left-2.5 top-2" />
                    </div>
                  </div>

                  {/* OpenAI API Key */}
                  <div className="space-y-1">
                    <label className="font-medium text-ide-text flex items-center justify-between">
                      <span>OpenAI / Codex API Key</span>
                      <span className="text-[10px] text-ide-muted font-normal">sk-...</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="sk-proj-..."
                        value={formData.openaiApiKey}
                        onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                        className="w-full pl-8 pr-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent font-mono text-xs"
                      />
                      <Key className="w-3.5 h-3.5 text-ide-muted absolute left-2.5 top-2" />
                    </div>
                  </div>
                </>
              )}

              {/* Ollama Local URL */}
              <div className="space-y-1">
                <label className="font-medium text-ide-text flex items-center justify-between">
                  <span>Ollama Local URL</span>
                  <span className="text-[10px] text-ide-emerald font-normal">No API Key Needed</span>
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={formData.ollamaUrl}
                  onChange={(e) => setFormData({ ...formData, ollamaUrl: e.target.value })}
                  className="w-full px-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent font-mono text-xs"
                />
              </div>
            </>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-ide-accent/10 border border-ide-accent/20 text-ide-text text-[11px] leading-relaxed">
                Connect your existing subscription plans to unlock enterprise reasoning, higher rate limits, and multi-agent coordination without metered API costs.
              </div>

              {/* Google Gemini Subscription */}
              <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Google Gemini Advanced</div>
                  <div className="text-[10px] text-ide-muted">Included with Google One AI Premium & AI Studio</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.subscriptions.gemini.isActive;
                    setFormData({
                      ...formData,
                      subscriptions: {
                        ...formData.subscriptions,
                        gemini: {
                          ...formData.subscriptions.gemini,
                          isActive: !current,
                          planName: 'Gemini Advanced (Google One)'
                        }
                      }
                    });
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    formData.subscriptions.gemini.isActive
                      ? 'bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30'
                      : 'bg-ide-card hover:bg-ide-hover text-ide-muted hover:text-white border border-ide-border'
                  }`}
                >
                  {formData.subscriptions.gemini.isActive ? 'Active (Linked)' : 'Enable Subscription'}
                </button>
              </div>

              {/* Claude Pro / Code */}
              <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Anthropic Claude Code & Pro</div>
                  <div className="text-[10px] text-ide-muted">Included with Claude Pro & Claude Code subscription</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.subscriptions.claude.isActive;
                    setFormData({
                      ...formData,
                      subscriptions: {
                        ...formData.subscriptions,
                        claude: {
                          ...formData.subscriptions.claude,
                          isActive: !current,
                          planName: 'Claude Pro / Claude Code'
                        }
                      }
                    });
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    formData.subscriptions.claude.isActive
                      ? 'bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30'
                      : 'bg-ide-card hover:bg-ide-hover text-ide-muted hover:text-white border border-ide-border'
                  }`}
                >
                  {formData.subscriptions.claude.isActive ? 'Active (Linked)' : 'Enable Subscription'}
                </button>
              </div>

              {/* OpenAI Codex & ChatGPT Plus */}
              <div className="p-3 rounded-lg bg-ide-panel border border-ide-border flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">OpenAI Codex / ChatGPT Plus</div>
                  <div className="text-[10px] text-ide-muted">Included with ChatGPT Plus, Team, or Codex subscription</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.subscriptions.codex.isActive;
                    setFormData({
                      ...formData,
                      subscriptions: {
                        ...formData.subscriptions,
                        codex: {
                          ...formData.subscriptions.codex,
                          isActive: !current,
                          planName: 'ChatGPT Plus / Codex'
                        }
                      }
                    });
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
                    formData.subscriptions.codex.isActive
                      ? 'bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30'
                      : 'bg-ide-card hover:bg-ide-hover text-ide-muted hover:text-white border border-ide-border'
                  }`}
                >
                  {formData.subscriptions.codex.isActive ? 'Active (Linked)' : 'Enable Subscription'}
                </button>
              </div>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-ide-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-ide-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-ide-accent hover:bg-ide-accentHover text-white rounded font-medium flex items-center gap-1.5 transition-colors shadow-sm"
            >
              {savedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" /> Saved!
                </>
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
