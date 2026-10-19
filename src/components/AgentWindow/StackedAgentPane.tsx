import React, { useRef, useEffect, useState } from 'react';
import { 
  Bot, 
  Send, 
  Square, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  Wrench, 
  BrainCircuit, 
  CheckCircle2, 
  Copy, 
  FileCode, 
  Share2,
  Check,
  ArrowUp,
  ChevronRight,
  ChevronDown,
  X,
  ArrowRightCircle,
  Sparkles,
  Terminal,
  Zap,
  Clock,
  Layers,
  ChevronUp
} from 'lucide-react';
import { AgentInstance, AISettings, AgentRole, ToolCall } from '../../types';

interface StackedAgentPaneProps {
  agent: AgentInstance;
  settings: AISettings;
  activeFilePath?: string;
  isMaximized: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onToggleMaximize: () => void;
  onClose?: () => void;
  onUpdateInput: (val: string) => void;
  onSendMessage: (prompt?: string) => void;
  onStop: () => void;
  onClear: () => void;
  onSelectModel: (model: string, provider: any) => void;
  onApplyCodeToEditor?: (code: string) => void;
  onShareToContextBus?: (title: string, content: string, type: 'plan' | 'code' | 'test' | 'summary') => void;
  onHandoffToDeveloper?: (planContent: string) => void;
}

export const StackedAgentPane: React.FC<StackedAgentPaneProps> = ({
  agent,
  settings,
  activeFilePath,
  isMaximized,
  isCollapsed = false,
  onToggleCollapse,
  onToggleMaximize,
  onClose,
  onUpdateInput,
  onSendMessage,
  onStop,
  onClear,
  onSelectModel,
  onApplyCodeToEditor,
  onShareToContextBus,
  onHandoffToDeveloper
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedMsgId, setSharedMsgId] = useState<string | null>(null);
  const [appliedMsgId, setAppliedMsgId] = useState<string | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  useEffect(() => {
    if (!isCollapsed && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [agent.messages, agent.currentThought, agent.status, isCollapsed]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (agent.input.trim() && agent.status === 'idle') {
        onSendMessage();
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const handleShareContext = (msgId: string, content: string) => {
    if (!onShareToContextBus) return;
    const type = agent.role === 'ARCHITECT' ? 'plan' : agent.role === 'TESTER' ? 'test' : 'code';
    const title = `${agent.name} (${type.toUpperCase()})`;
    onShareToContextBus(title, content, type);
    setSharedMsgId(msgId);
    setTimeout(() => setSharedMsgId(null), 1500);
  };

  const extractCodeBlock = (content: string): string => {
    const match = content.match(/```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/);
    return match ? match[1].trim() : content;
  };

  const formatToolTarget = (tc: ToolCall) => {
    if (!tc.args) return tc.name;
    if (typeof tc.args === 'string') return tc.args.slice(0, 40);
    if (tc.args.path) return `${tc.name}: ${tc.args.path}`;
    if (tc.args.TargetFile) return `${tc.name}: ${tc.args.TargetFile.split('/').pop()}`;
    if (tc.args.CommandLine) return `$ ${tc.args.CommandLine.slice(0, 36)}`;
    if (tc.args.command) return `$ ${tc.args.command.slice(0, 36)}`;
    if (tc.args.query) return `"${tc.args.query.slice(0, 30)}"`;
    return tc.name;
  };

  const getRoleTheme = (role: AgentRole) => {
    switch (role) {
      case 'ARCHITECT':
        return {
          pill: 'bg-[#6366F1]/15 text-[#818cf8] border-[#6366F1]/30',
          dot: 'bg-[#6366F1] shadow-[0_0_8px_#6366F1]',
          tag: 'ARCHITECT'
        };
      case 'DEVELOPER':
        return {
          pill: 'bg-[#06B6D4]/15 text-[#22d3ee] border-[#06B6D4]/30',
          dot: 'bg-[#06B6D4] shadow-[0_0_8px_#06B6D4]',
          tag: 'DEVELOPER'
        };
      case 'TESTER':
        return {
          pill: 'bg-[#10B981]/15 text-[#34d399] border-[#10B981]/30',
          dot: 'bg-[#10B981] shadow-[0_0_8px_#10B981]',
          tag: 'TESTER'
        };
      case 'CODEX':
        return {
          pill: 'bg-[#10a37f]/15 text-[#10a37f] border-[#10a37f]/30',
          dot: 'bg-[#10a37f] shadow-[0_0_8px_#10a37f]',
          tag: 'CODEX'
        };
      default:
        return {
          pill: 'bg-[#8B5CF6]/15 text-[#a78bfa] border-[#8B5CF6]/30',
          dot: 'bg-[#8B5CF6] shadow-[0_0_8px_#8B5CF6]',
          tag: role
        };
    }
  };

  const roleTheme = getRoleTheme(agent.role);

  return (
    <div className={`w-full flex flex-col bg-[#090b10] select-text relative overflow-hidden transition-all ${
      isCollapsed ? 'h-[38px] shrink-0' : isMaximized ? 'h-full flex-1' : 'min-h-[280px] flex-1 shrink-0'
    }`}>
      {/* 1. Antigravity Agent Header */}
      <div 
        onClick={onToggleCollapse}
        className="h-[38px] px-3 flex items-center justify-between bg-[#0e1118]/90 hover:bg-[#121620] border-b border-white/[0.08] select-none shrink-0 cursor-pointer transition-colors gap-2 overflow-hidden"
      >
        <div className="flex items-center gap-2 min-w-0">
          {onToggleCollapse && (
            <span className="text-white/40 hover:text-white transition-colors shrink-0">
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${roleTheme.dot}`} />
            <span className="text-xs font-semibold tracking-tight text-white/95 truncate">
              {agent.name}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9px] font-medium border tracking-wide uppercase ${roleTheme.pill}`}>
              {roleTheme.tag}
            </span>
          </div>

          {/* Status Indicators */}
          {agent.status === 'thinking' && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] text-[#FFB020] bg-[#FFB020]/10 border border-[#FFB020]/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020] animate-pulse" />
              Thinking
            </span>
          )}
          {agent.status === 'executing_tool' && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] text-[#06B6D4] bg-[#06B6D4]/10 border border-[#06B6D4]/20 font-medium">
              <Wrench className="w-3 h-3 animate-spin" />
              Tool
            </span>
          )}
          {agent.status === 'streaming' && (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] text-[#30D158] bg-[#30D158]/10 border border-[#30D158]/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-ping" />
              Streaming
            </span>
          )}

          {isCollapsed && agent.messages.length > 0 && (
            <span className="text-[10px] text-white/40 font-mono shrink-0">
              ({agent.messages.length} msgs)
            </span>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!isCollapsed && (
            <>
              {/* Antigravity Model Selector Dropdown */}
              <select
                value={`${agent.provider}:${agent.model}`}
                onChange={(e) => {
                  const [prov, mod] = e.target.value.split(':');
                  onSelectModel(mod, prov);
                }}
                className="text-[10px] bg-[#141722] border border-white/[0.08] text-white/80 rounded-md px-1.5 py-0.5 focus:outline-none hover:border-white/20 cursor-pointer max-w-[110px] sm:max-w-[135px] truncate font-sans"
              >
                <optgroup label="✨ Free Models">
                  <option value="free:qwen-coder">Qwen 2.5 Coder [Free]</option>
                  <option value="free:deepseek-r1">DeepSeek R1 [Free]</option>
                  <option value="free:gemini-flash">Gemini 2.5 Flash [Free]</option>
                  <option value="free:codex-mini">OpenAI Codex mini [Free]</option>
                  <option value="free:llama-3.3">Llama 3.3 70B [Free]</option>
                </optgroup>
                <optgroup label="💎 Pro / Subscriptions">
                  <option value="openai:gpt-4o">OpenAI GPT-4o (Codex)</option>
                  <option value="gemini:gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="anthropic:claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                </optgroup>
              </select>

              {/* Stop / Clear */}
              {agent.status !== 'idle' ? (
                <button
                  title="Stop Agent"
                  onClick={onStop}
                  className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  title="Clear Chat"
                  onClick={onClear}
                  className="p-1 rounded-md hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Maximize */}
              <button
                title={isMaximized ? "Restore Split" : "Maximize"}
                onClick={onToggleMaximize}
                className="p-1 rounded-md hover:bg-white/[0.08] text-white/40 hover:text-white transition-colors"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          {/* Close Agent */}
          {onClose && (
            <button
              title="Close Agent"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Messages Stream & Antigravity Activity Chips */}
      {!isCollapsed && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 font-sans text-xs">
            {agent.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-white/40 select-none">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#0A84FF] flex items-center justify-center mb-2 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="font-semibold text-white/90 text-xs mb-1">
                  {agent.name}
                </div>
                <p className="text-[11px] max-w-xs text-white/50 leading-relaxed mb-3">
                  {agent.description}
                </p>

                {/* Quick Prompts */}
                <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
                  {agent.role === 'ARCHITECT' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Design high-level architecture and blueprint for this project`)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg text-[10px] text-white/80 transition-colors cursor-pointer"
                      >
                        Blueprint Architecture
                      </button>
                      <button
                        onClick={() => onSendMessage(`Create a task breakdown plan for Developer and Tester agents`)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg text-[10px] text-white/80 transition-colors cursor-pointer"
                      >
                        Task Breakdown Plan
                      </button>
                    </>
                  )}
                  {agent.role === 'DEVELOPER' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Implement required feature code and verify with tools`)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg text-[10px] text-white/80 transition-colors cursor-pointer"
                      >
                        Implement Features
                      </button>
                      <button
                        onClick={() => onSendMessage(`Inspect project files and refactor key modules for robustness`)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg text-[10px] text-white/80 transition-colors cursor-pointer"
                      >
                        Refactor Code
                      </button>
                    </>
                  )}
                  {agent.role === 'TESTER' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Generate test suite and audit boundary conditions`)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg text-[10px] text-white/80 transition-colors cursor-pointer"
                      >
                        Generate Tests
                      </button>
                    </>
                  )}
                  {agent.role === 'CODEX' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Implement remaining TODOs and write clean unit tests`)}
                        className="px-2.5 py-1 bg-white/[0.04] hover:bg-white/[0.09] border border-white/[0.08] rounded-lg text-[10px] text-white/80 transition-colors cursor-pointer"
                      >
                        Solve TODOs
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              agent.messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[88%] bg-[#171d2b] border border-white/[0.09] px-3.5 py-2.5 rounded-2xl rounded-tr-sm text-white/95 text-[12px] leading-relaxed shadow-sm">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-white/85">
                      {/* Antigravity Reasoning Pill (Compact & Non-intrusive) */}
                      {msg.thoughts && msg.thoughts.length > 0 && (
                        <details className="group bg-[#11141e]/90 border border-white/[0.07] rounded-xl px-3 py-1.5 text-[11px] text-white/60 transition-all">
                          <summary className="cursor-pointer font-medium flex items-center justify-between select-none hover:text-white/90">
                            <span className="flex items-center gap-1.5 text-[#FFB020]">
                              <Zap className="w-3.5 h-3.5" />
                              <span>Reasoning ({msg.thoughts.length} steps)</span>
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-white/40 group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l border-[#FFB020]/30 font-mono text-[10px] text-white/60">
                            {msg.thoughts.map((t, idx) => (
                              <div key={idx} className="leading-relaxed">• {t}</div>
                            ))}
                          </div>
                        </details>
                      )}

                      {/* Antigravity Sleek Tool Activity Chips (Replaces noisy JSON dumps!) */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="space-y-1">
                          {msg.toolCalls.map((tc) => {
                            const isExpanded = expandedToolId === tc.id;
                            return (
                              <div 
                                key={tc.id} 
                                className="rounded-xl bg-[#11141e]/70 border border-white/[0.07] overflow-hidden text-[11px]"
                              >
                                <div 
                                  onClick={() => setExpandedToolId(isExpanded ? null : tc.id)}
                                  className="px-2.5 py-1.5 flex items-center justify-between hover:bg-white/[0.04] cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <Terminal className="w-3 h-3 text-[#06B6D4] shrink-0" />
                                    <span className="font-mono text-white/80 font-medium truncate">
                                      {formatToolTarget(tc)}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {tc.result ? (
                                      <span className="flex items-center gap-1 text-[10px] text-[#30D158] font-medium">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Done</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-[#FFB020]">Running...</span>
                                    )}
                                    <span className="text-white/30 text-[9px] pl-1 font-mono">
                                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </span>
                                  </div>
                                </div>

                                {/* Collapsed Detailed Inspection Drawer */}
                                {isExpanded && (
                                  <div className="p-2.5 bg-[#0b0d13] border-t border-white/[0.06] space-y-2 text-[10px] font-mono">
                                    {tc.args && (
                                      <div>
                                        <div className="text-white/40 mb-0.5">Parameters:</div>
                                        <pre className="p-1.5 rounded-lg bg-black/40 text-white/70 overflow-x-auto">
                                          {JSON.stringify(tc.args, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    {tc.result && (
                                      <div>
                                        <div className="text-white/40 mb-0.5">Output:</div>
                                        <pre className="p-1.5 rounded-lg bg-black/40 text-[#30D158] overflow-x-auto max-h-36">
                                          {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Assistant Text Bubble */}
                      {msg.content && (
                        <div className="bg-[#121622]/85 border border-white/[0.08] p-3.5 rounded-2xl text-[12px] leading-relaxed shadow-sm space-y-2.5">
                          <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                          {/* Quick Actions Bar */}
                          <div className="flex flex-wrap items-center justify-between border-t border-white/[0.07] pt-2 text-[10px] text-white/50 gap-2">
                            <div className="flex items-center gap-1.5">
                              <button
                                title="Copy response text"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="px-2 py-0.5 rounded-md hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {copiedId === msg.id ? <Check className="w-3 h-3 text-[#30D158]" /> : <Copy className="w-3 h-3" />}
                                <span>Copy</span>
                              </button>

                              {/* Architect Hand-off to Developer */}
                              {agent.role === 'ARCHITECT' && onHandoffToDeveloper && (
                                <button
                                  title="Hand off this blueprint to the Developer agent"
                                  onClick={() => {
                                    handleShareContext(msg.id, msg.content);
                                    onHandoffToDeveloper(msg.content);
                                  }}
                                  className="px-2.5 py-0.5 rounded-md bg-[#6366F1]/20 hover:bg-[#6366F1]/30 text-[#818cf8] hover:text-white border border-[#6366F1]/30 transition-all flex items-center gap-1 font-medium cursor-pointer"
                                >
                                  <ArrowRightCircle className="w-3 h-3" />
                                  <span>Hand off Plan to Dev</span>
                                </button>
                              )}

                              {/* Apply Code to Editor (if code block exists) */}
                              {agent.role !== 'ARCHITECT' && onApplyCodeToEditor && msg.content.includes('```') && (
                                <button
                                  title="Apply code directly to editor"
                                  onClick={() => {
                                    const code = extractCodeBlock(msg.content);
                                    onApplyCodeToEditor(code);
                                    setAppliedMsgId(msg.id);
                                    setTimeout(() => setAppliedMsgId(null), 1500);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-[#0A84FF]/20 hover:bg-[#0A84FF]/30 text-[#0A84FF] hover:text-white border border-[#0A84FF]/30 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  {appliedMsgId === msg.id ? <Check className="w-3 h-3 text-[#30D158]" /> : <FileCode className="w-3 h-3" />}
                                  <span>{appliedMsgId === msg.id ? 'Applied!' : 'Apply to Editor'}</span>
                                </button>
                              )}
                            </div>

                            {/* Share Context Bus */}
                            {onShareToContextBus && (
                              <button
                                title="Share to Context Bus"
                                onClick={() => handleShareContext(msg.id, msg.content)}
                                className="px-2 py-0.5 rounded-md hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                {sharedMsgId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#30D158]" />
                                    <span className="text-[#30D158]">Shared!</span>
                                  </>
                                ) : (
                                  <>
                                    <Share2 className="w-3 h-3" />
                                    <span>Share Context</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Live Streaming Thought */}
            {agent.currentThought && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#11141e] border border-[#FFB020]/25 text-[11px] text-[#FFB020]">
                <BrainCircuit className="w-3.5 h-3.5 shrink-0 animate-spin" />
                <span className="truncate">{agent.currentThought}</span>
              </div>
            )}
          </div>

          {/* 3. Floating Antigravity Composer */}
          <div className="p-3 bg-[#0a0c12] border-t border-white/[0.08] select-none shrink-0">
            <div className="relative rounded-2xl bg-[#121520] border border-white/[0.12] focus-within:border-[#0A84FF]/60 focus-within:ring-1 focus-within:ring-[#0A84FF]/20 p-2 transition-all shadow-xl">
              {/* Active Context Chip */}
              {activeFilePath && (
                <div className="mb-1.5 flex items-center gap-1 px-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-[#0A84FF] border border-white/[0.06] text-[10px] flex items-center gap-1 font-mono">
                    <FileCode className="w-3 h-3" />
                    <span>@{activeFilePath.split(/[/\\]/).pop()}</span>
                  </span>
                </div>
              )}

              <textarea
                rows={2}
                placeholder={`Ask ${agent.name}...`}
                value={agent.input}
                disabled={agent.status !== 'idle'}
                onChange={(e) => onUpdateInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-[12px] text-white placeholder-white/35 focus:outline-none resize-none leading-relaxed font-sans px-1"
              />

              <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] mt-1 text-[11px]">
                <span className="text-[10px] text-white/40">
                  Enter to send, Shift+Enter for newline
                </span>

                <button
                  onClick={() => onSendMessage()}
                  disabled={!agent.input.trim() || agent.status !== 'idle'}
                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-gradient-to-r from-[#0A84FF] to-[#5E5CE6] hover:brightness-110 disabled:opacity-30 text-white transition-all shadow-md shadow-[#0A84FF]/20 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
