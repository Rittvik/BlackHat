import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Square, 
  Trash2, 
  Play, 
  Check, 
  Copy, 
  FileCode, 
  Code, 
  CheckCircle2, 
  Terminal, 
  ExternalLink,
  Shield, 
  FileCheck, 
  RefreshCw, 
  Bot, 
  Zap, 
  ChevronRight, 
  ChevronDown,
  Layers,
  Settings,
  X,
  FilePlus,
  HelpCircle
} from 'lucide-react';
import { AISettings, UserProfile, AgentMessage, ToolCall } from '../../types';

interface CodexSidebarProps {
  settings: AISettings;
  user: UserProfile;
  activeFilePath?: string;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onApplyCodeToEditor?: (code: string) => void;
  onLaunchCodexAgent?: (initialPrompt?: string) => void;
  onRunTerminalCommand?: (command: string) => void;
}

export const CodexSidebar: React.FC<CodexSidebarProps> = ({
  settings,
  user,
  activeFilePath,
  onOpenSettings,
  onOpenAccount,
  onApplyCodeToEditor,
  onLaunchCodexAgent,
  onRunTerminalCommand
}) => {
  const [activeTab, setActiveTab] = useState<'agent' | 'chat' | 'tools'>('agent');
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  const [messages, setMessages] = useState<AgentMessage[]>([
    {
      id: 'welcome-codex',
      role: 'assistant',
      content: `### Welcome to OpenAI Codex 👋\n\nI am your OpenAI Codex coding agent, integrated directly into BlackHat IDE.\n\n**Capabilities:**\n- ⚡ **Autonomous implementation**: Write code, resolve TODOs, and debug issues across your project.\n- 🧪 **Unit Test Generation**: Synthesize test suites for any active file.\n- 🛡️ **Security Audit**: Scan code for edge cases and vulnerabilities.\n- 🤝 **Agent Studio Synergy**: Hand off blueprints and sync with Architect, Developer, and Tester agents.\n\n*Select a quick action below or type your prompt to get started!*`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'streaming'>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const isPlusActive = settings.subscriptions.codex.isActive;
  const activeFileName = activeFilePath ? activeFilePath.split(/[/\\]/).pop() : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleApply = (id: string, code: string) => {
    if (onApplyCodeToEditor) {
      onApplyCodeToEditor(code);
      setAppliedId(id);
      setTimeout(() => setAppliedId(null), 1500);
    }
  };

  const extractCodeBlock = (content: string): string => {
    const match = content.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : content;
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || status !== 'idle') return;

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInput('');
    setStatus('thinking');

    // Context augmentation
    let promptWithContext = textToSend;
    if (activeFilePath) {
      promptWithContext += `\n\n[Active Editor File: ${activeFilePath}]`;
    }

    const assistantMsgId = `assistant-${Date.now()}`;
    const assistantMsg: AgentMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      thoughts: ['Connecting to OpenAI Codex engine...', `Model: ${selectedModel}`],
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, assistantMsg]);

    try {
      abortControllerRef.current = new AbortController();
      const API_BASE = typeof window !== 'undefined' && window.location.protocol === 'file:' 
        ? 'http://localhost:3001' 
        : '';

      const res = await fetch(`${API_BASE}/api/agent/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'openai.codex',
          agentRole: 'DEVELOPER',
          prompt: promptWithContext,
          systemPrompt: `You are OpenAI Codex, the industry-standard AI coding agent. You provide precise, production-grade code modifications, clean unit tests, architecture refactors, and bug fixes. Whenever you write code, enclose it in markdown code blocks with the exact language specified.`,
          provider: isPlusActive ? 'openai' : 'free',
          model: isPlusActive ? selectedModel : 'qwen-coder',
          apiKey: settings.openaiApiKey,
          subscriptions: settings.subscriptions,
          workspaceRoot: ''
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        throw new Error(`Codex stream failed (HTTP ${res.status})`);
      }

      setStatus('streaming');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let thoughts: string[] = ['Reasoning through code synthesis...'];

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent } : m));
                }
                if (parsed.thought) {
                  thoughts.push(parsed.thought);
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, thoughts: [...thoughts] } : m));
                }
                if (parsed.toolCalls) {
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, toolCalls: parsed.toolCalls } : m));
                }
              } catch {}
            }
          }
        }
      }

      if (!fullContent) {
        fullContent = `Codex completed analysis. Code synthesized according to specifications.`;
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent } : m));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { 
          ...m, 
          content: `⚠️ **Codex encountered an error**: ${err.message}\n\nPlease check your OpenAI API key or ChatGPT Plus connection in AI Settings.` 
        } : m));
      }
    } finally {
      setStatus('idle');
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStatus('idle');
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Codex chat cleared. Ready for your next coding task!`,
        timestamp: Date.now()
      }
    ]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0b0d13] text-white/90 select-none overflow-hidden font-sans border-r border-white/[0.08]">
      {/* 1. Sleek Antigravity Codex Header */}
      <div className="h-[44px] px-3 flex items-center justify-between border-b border-white/[0.08] bg-[#11141c]/90 backdrop-blur-xl shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#10a37f]/20 via-[#10a37f]/40 to-[#10a37f]/10 border border-[#10a37f]/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(16,163,127,0.25)]">
            <Sparkles className="w-3.5 h-3.5 text-[#10a37f]" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-semibold tracking-tight text-white/95">
                Codex
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#10a37f]/15 text-[#10a37f] border border-[#10a37f]/30 font-medium">
                v26.59
              </span>
            </div>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            title="Open in Multi-Agent Studio"
            onClick={() => onLaunchCodexAgent && onLaunchCodexAgent()}
            className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1.5 transition-all border border-white/[0.06] cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5 text-[#10a37f]" />
            <span className="hidden sm:inline">Launch Agent</span>
          </button>

          <button
            title="Clear Codex Chat"
            onClick={handleClear}
            className="p-1.5 rounded-md hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            title="Codex & AI Subscriptions"
            onClick={onOpenAccount}
            className="p-1.5 rounded-md hover:bg-white/[0.08] text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Mode Pills & Model Selector */}
      <div className="px-3 py-2 border-b border-white/[0.06] bg-[#0e1017] flex items-center justify-between gap-2 shrink-0">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.04] p-0.5 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'agent'
                ? 'bg-white/[0.14] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Agent
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
              activeTab === 'tools'
                ? 'bg-white/[0.14] text-white shadow-sm'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            Quick Tools
          </button>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-1 text-[11px]">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-[#141722] border border-white/[0.08] rounded-md px-2 py-1 text-white/80 text-[10px] font-medium outline-none cursor-pointer focus:border-[#10a37f]/50"
          >
            <option value="gpt-4o">GPT-4o (Codex)</option>
            <option value="o3-mini">o3-mini (Reasoning)</option>
            <option value="o1">o1 (Thinking)</option>
            <option value="gpt-4o-mini">GPT-4o mini (Free)</option>
          </select>
        </div>
      </div>

      {/* 3. Main Content: Tools Tab or Chat Stream */}
      {activeTab === 'tools' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <div className="text-[11px] text-white/50 uppercase tracking-wider font-semibold px-1">
            Codex Tool Actions
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => {
                setActiveTab('agent');
                handleSendMessage(`Inspect ${activeFileName || 'the active file'} and implement any remaining TODO or incomplete feature comments with robust production code.`);
              }}
              className="p-3 rounded-xl bg-[#131620] hover:bg-[#181c28] border border-white/[0.08] hover:border-[#10a37f]/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-[#10a37f]/15 text-[#10a37f] group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-[12px] font-semibold text-white/95">
                  Implement with Codex
                </span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-8">
                Scan {activeFileName ? `"${activeFileName}"` : 'the file'} for TODOs and automatically synthesize working code.
              </p>
            </button>

            <button
              onClick={() => {
                setActiveTab('agent');
                handleSendMessage(`Generate a comprehensive unit test suite with high branch coverage and edge cases for ${activeFileName || 'the active file'}.`);
              }}
              className="p-3 rounded-xl bg-[#131620] hover:bg-[#181c28] border border-white/[0.08] hover:border-[#0A84FF]/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-[#0A84FF]/15 text-[#0A84FF] group-hover:scale-105 transition-transform">
                  <FileCheck className="w-4 h-4" />
                </div>
                <span className="text-[12px] font-semibold text-white/95">
                  Generate Unit Tests
                </span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-8">
                Create a full test file covering edge cases, mocks, and boundary inputs.
              </p>
            </button>

            <button
              onClick={() => {
                setActiveTab('agent');
                handleSendMessage(`Refactor and clean ${activeFileName || 'the current code'} to improve readability, eliminate redundancies, and enforce strict type safety.`);
              }}
              className="p-3 rounded-xl bg-[#131620] hover:bg-[#181c28] border border-white/[0.08] hover:border-[#BF5AF2]/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-[#BF5AF2]/15 text-[#BF5AF2] group-hover:scale-105 transition-transform">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <span className="text-[12px] font-semibold text-white/95">
                  Refactor & Clean Code
                </span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-8">
                Optimize code structure, improve variable naming, and enforce design patterns.
              </p>
            </button>

            <button
              onClick={() => {
                setActiveTab('agent');
                handleSendMessage(`Perform a rigorous security audit on ${activeFileName || 'the project'} checking for injection, unvalidated inputs, data leaks, and race conditions.`);
              }}
              className="p-3 rounded-xl bg-[#131620] hover:bg-[#181c28] border border-white/[0.08] hover:border-[#FF9F0A]/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-[#FF9F0A]/15 text-[#FF9F0A] group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-[12px] font-semibold text-white/95">
                  Audit Security & Hardening
                </span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed pl-8">
                Identify potential exploits, unchecked assumptions, and auth vulnerabilities.
              </p>
            </button>
          </div>

          <div className="pt-2">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[11px] text-white/60 space-y-1.5">
              <div className="flex items-center justify-between text-white/80 font-medium">
                <span>Codex Account Status</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                  isPlusActive ? 'bg-[#30D158]/15 text-[#30D158]' : 'bg-[#0A84FF]/15 text-[#0A84FF]'
                }`}>
                  {isPlusActive ? 'ChatGPT Plus Active' : 'Free Tier'}
                </span>
              </div>
              <p className="text-[10px] text-white/45 leading-relaxed">
                {isPlusActive
                  ? `Connected: ${settings.subscriptions.codex.accountEmail || user.email || 'OpenAI Session'}`
                  : 'To link your existing ChatGPT Plus or Team subscription, click Configure Accounts.'}
              </p>
              <button
                onClick={onOpenAccount}
                className="w-full mt-2 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white text-[11px] font-medium transition-colors cursor-pointer"
              >
                Configure Accounts & Keys
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3.5">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[88%] bg-[#1a202c] border border-white/[0.1] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-white/95 text-[12px] leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-white/85 text-[12px]">
                  {/* Reasoning pill (Antigravity compact style) */}
                  {msg.thoughts && msg.thoughts.length > 0 && (
                    <details className="group bg-[#11141c] border border-white/[0.07] rounded-xl px-3 py-1.5 text-[11px] text-white/60 transition-all">
                      <summary className="cursor-pointer font-medium flex items-center justify-between select-none hover:text-white/90">
                        <span className="flex items-center gap-1.5 text-[#10a37f]">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Codex Reasoning ({msg.thoughts.length} steps)</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-white/40 group-open:rotate-90 transition-transform" />
                      </summary>
                      <div className="mt-2 space-y-1 pl-2 border-l border-[#10a37f]/30 font-mono text-[10px] text-white/60">
                        {msg.thoughts.map((t, idx) => (
                          <div key={idx} className="leading-relaxed">• {t}</div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Compact Tool Activity Badges (Antigravity clean aesthetic) */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-1">
                      {msg.toolCalls.map((tc) => (
                        <div 
                          key={tc.id} 
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#11141c] border border-white/[0.06] text-[11px] font-mono"
                        >
                          <span className="flex items-center gap-1.5 text-white/80">
                            <Terminal className="w-3 h-3 text-[#10a37f]" />
                            <span className="text-[#10a37f] font-semibold">{tc.name}</span>
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-[#30D158]">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assistant response body */}
                  {msg.content && (
                    <div className="bg-[#121520]/80 border border-white/[0.08] p-3.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap shadow-sm">
                      <div className="font-sans leading-relaxed">{msg.content}</div>

                      {/* Code extraction quick actions if code block present */}
                      {msg.content.includes('```') && (
                        <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => handleApply(msg.id, extractCodeBlock(msg.content))}
                            className="px-2.5 py-1 rounded-lg bg-[#10a37f]/20 hover:bg-[#10a37f]/30 text-[#10a37f] hover:text-white border border-[#10a37f]/30 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {appliedId === msg.id ? <Check className="w-3 h-3" /> : <FileCode className="w-3 h-3" />}
                            <span>{appliedId === msg.id ? 'Applied!' : 'Apply to Current File'}</span>
                          </button>

                          <button
                            onClick={() => handleCopy(msg.id, extractCodeBlock(msg.content))}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'Copied' : 'Copy Code'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {status === 'thinking' && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#11141c] border border-white/[0.06] text-[11px] text-white/60">
              <span className="w-2 h-2 rounded-full bg-[#10a37f] animate-pulse" />
              <span>Codex is synthesizing response...</span>
            </div>
          )}
        </div>
      )}

      {/* 4. Floating Antigravity Prompt Composer */}
      <div className="p-3 border-t border-white/[0.08] bg-[#0c0e15] shrink-0">
        <div className="relative rounded-2xl bg-[#131622] border border-white/[0.12] focus-within:border-[#10a37f]/60 focus-within:ring-1 focus-within:ring-[#10a37f]/20 p-2 transition-all shadow-lg">
          {/* Active Context Chip */}
          {activeFileName && (
            <div className="flex items-center gap-1 mb-1.5 px-1 text-[10px] text-white/50">
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[#10a37f] border border-white/[0.06]">
                <FileCode className="w-3 h-3" />
                <span>@{activeFileName}</span>
              </span>
              <span>included in context</span>
            </div>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Codex to write, refactor, or test code..."
            rows={2}
            className="w-full bg-transparent text-white text-[12px] outline-none resize-none placeholder-white/35 font-sans leading-relaxed px-1"
          />

          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/[0.05]">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span>Press</span>
              <kbd className="px-1 py-0.2 rounded bg-white/[0.08] text-white/70 font-mono text-[9px]">Enter</kbd>
              <span>to send</span>
            </div>

            <div className="flex items-center gap-1">
              {status !== 'idle' ? (
                <button
                  onClick={handleStop}
                  className="px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  disabled={!input.trim()}
                  onClick={() => handleSendMessage()}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#10a37f] to-[#0d8c6d] hover:brightness-110 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-md shadow-[#10a37f]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Synthesize</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
