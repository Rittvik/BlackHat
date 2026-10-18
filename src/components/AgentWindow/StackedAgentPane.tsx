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
  Sparkles, 
  Share2,
  Check,
  CheckSquare,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AgentInstance, AISettings, AgentRole } from '../../types';

interface StackedAgentPaneProps {
  agent: AgentInstance;
  settings: AISettings;
  activeFilePath?: string;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onUpdateInput: (val: string) => void;
  onSendMessage: (prompt?: string) => void;
  onStop: () => void;
  onClear: () => void;
  onSelectModel: (model: string, provider: any) => void;
  onApplyCodeToEditor?: (code: string) => void;
  onShareToContextBus?: (title: string, content: string, type: 'plan' | 'code' | 'test' | 'summary') => void;
}

export const StackedAgentPane: React.FC<StackedAgentPaneProps> = ({
  agent,
  settings,
  activeFilePath,
  isMaximized,
  onToggleMaximize,
  onUpdateInput,
  onSendMessage,
  onStop,
  onClear,
  onSelectModel,
  onApplyCodeToEditor,
  onShareToContextBus
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedMsgId, setSharedMsgId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [agent.messages, agent.currentThought, agent.status]);

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
    const title = `${agent.name} Output (${type.toUpperCase()})`;
    onShareToContextBus(title, content, type);
    setSharedMsgId(msgId);
    setTimeout(() => setSharedMsgId(null), 1500);
  };

  const getRoleBadge = (role: AgentRole) => {
    switch (role) {
      case 'ARCHITECT':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wider">
            ARCHITECT
          </span>
        );
      case 'DEVELOPER':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold tracking-wider">
            DEVELOPER
          </span>
        );
      case 'TESTER':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold tracking-wider">
            TESTER
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold tracking-wider">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = () => {
    switch (agent.status) {
      case 'thinking':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-ide-amber/20 text-ide-amber border border-ide-amber/30 animate-pulse-subtle">
            <BrainCircuit className="w-3 h-3 animate-spin" />
            Thinking
          </span>
        );
      case 'executing_tool':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-ide-purple/20 text-ide-purple border border-ide-purple/30 animate-pulse-subtle">
            <Wrench className="w-3 h-3 animate-spin" />
            Tool Calling
          </span>
        );
      case 'streaming':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30">
            <span className="w-1.5 h-1.5 rounded-full bg-ide-emerald animate-ping" />
            Streaming
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-ide-rose/20 text-ide-rose border border-ide-rose/30">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-ide-panel text-ide-muted border border-ide-border">
            Idle
          </span>
        );
    }
  };

  const isSubscriptionActive = 
    (agent.provider === 'gemini' && settings.subscriptions.gemini.isActive) ||
    (agent.provider === 'anthropic' && settings.subscriptions.claude.isActive) ||
    (agent.provider === 'openai' && settings.subscriptions.codex.isActive);

  return (
    <div className="w-full h-full flex flex-col bg-ide-panel select-text relative overflow-hidden">
      {/* Agent Header */}
      <div className="h-9 px-3 flex items-center justify-between bg-ide-sidebar border-b border-ide-border select-none shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center text-white shrink-0 ${agent.avatarColor}`}>
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide truncate">
            {agent.name}
          </span>
          {getRoleBadge(agent.role)}
          {getStatusBadge()}
          {isSubscriptionActive && (
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] bg-ide-accent/20 text-ide-accent border border-ide-accent/30 font-medium">
              <Sparkles className="w-2.5 h-2.5" /> Subscribed
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Model Selector */}
          <select
            value={`${agent.provider}:${agent.model}`}
            onChange={(e) => {
              const [prov, mod] = e.target.value.split(':');
              onSelectModel(mod, prov);
            }}
            className="text-[10px] bg-ide-card border border-ide-border text-ide-text rounded px-1.5 py-0.5 focus:outline-none hover:border-ide-accent cursor-pointer"
          >
            <option value="gemini:gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini:gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="anthropic:claude-3-7-sonnet">Claude 3.7 Sonnet</option>
            <option value="openai:gpt-4o">OpenAI Codex (GPT-4o)</option>
            <option value="ollama:llama3.2">Ollama (Llama 3.2)</option>
          </select>

          {/* Action buttons */}
          {agent.status !== 'idle' ? (
            <button
              title="Stop Agent"
              onClick={onStop}
              className="p-1 rounded bg-ide-rose/20 hover:bg-ide-rose/30 text-ide-rose border border-ide-rose/40"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          ) : (
            <button
              title="Clear Conversation"
              onClick={onClear}
              className="p-1 rounded hover:bg-ide-hover text-ide-muted hover:text-white transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}

          <button
            title={isMaximized ? "Restore Split" : "Maximize Pane"}
            onClick={onToggleMaximize}
            className="p-1 rounded hover:bg-ide-hover text-ide-muted hover:text-white transition-colors"
          >
            {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs">
        {agent.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-ide-muted select-none">
            <div className={`w-10 h-10 rounded-xl ${agent.avatarColor} text-white flex items-center justify-center mb-2 shadow-lg`}>
              <Bot className="w-6 h-6" />
            </div>
            <div className="font-semibold text-white text-xs mb-1">
              {agent.name} is Online
            </div>
            <p className="text-[11px] max-w-xs text-ide-muted leading-relaxed mb-3">
              {agent.description}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
              {agent.role === 'ARCHITECT' && (
                <>
                  <button
                    onClick={() => onSendMessage(`Design high-level architecture and component structure for BlackHat IDE`)}
                    className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                  >
                    📐 Design System Architecture
                  </button>
                  <button
                    onClick={() => onSendMessage(`Create a task decomposition plan for Developer and Tester agents`)}
                    className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                  >
                    📋 Task Decomposition Plan
                  </button>
                </>
              )}
              {agent.role === 'DEVELOPER' && (
                <>
                  <button
                    onClick={() => onSendMessage(`Inspect active project files and implement core functionality`)}
                    className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                  >
                    💻 Implement Code & Features
                  </button>
                  <button
                    onClick={() => onSendMessage(`Refactor server/index.js and verify tool calls`)}
                    className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                  >
                    ⚡ Refactor Backend Endpoints
                  </button>
                </>
              )}
              {agent.role === 'TESTER' && (
                <>
                  <button
                    onClick={() => onSendMessage(`Generate comprehensive test suite and validate edge cases`)}
                    className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                  >
                    🧪 Run QA & Unit Tests
                  </button>
                  <button
                    onClick={() => onSendMessage(`Audit code security and error recovery boundaries`)}
                    className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                  >
                    🛡️ Security & Boundary Audit
                  </button>
                </>
              )}
              {agent.role === 'CUSTOM' && (
                <button
                  onClick={() => onSendMessage(`Review workspace status and execute assigned role responsibilities`)}
                  className="px-2 py-1 bg-ide-card hover:bg-ide-hover border border-ide-border rounded text-[10px] text-ide-text hover:border-ide-accent transition-colors"
                >
                  🚀 Start Specialist Tasks
                </button>
              )}
            </div>
          </div>
        ) : (
          agent.messages.map((msg) => (
            <div key={msg.id} className="space-y-1.5">
              {msg.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-ide-card border border-ide-border px-3 py-2 rounded-xl text-white text-xs leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-ide-text">
                  {/* Thought stream card */}
                  {msg.thoughts && msg.thoughts.length > 0 && (
                    <details className="bg-ide-sidebar/90 border border-ide-border/60 rounded-lg p-2 text-[11px] text-ide-muted">
                      <summary className="font-medium text-ide-muted/90 cursor-pointer flex items-center gap-1.5 select-none hover:text-white">
                        <BrainCircuit className="w-3.5 h-3.5 text-ide-amber" />
                        <span>Reasoning & Context Synthesis ({msg.thoughts.length} steps)</span>
                      </summary>
                      <div className="mt-2 space-y-1 pl-4 border-l border-ide-amber/30 text-[11px] text-ide-text/80 font-mono">
                        {msg.thoughts.map((t, idx) => (
                          <div key={idx}>• {t}</div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* Tool Calls */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div className="space-y-1.5">
                      {msg.toolCalls.map((tc) => (
                        <div key={tc.id} className="bg-ide-darkest border border-ide-border rounded-lg p-2 text-[11px]">
                          <div className="flex items-center justify-between text-ide-muted mb-1">
                            <span className="flex items-center gap-1 text-ide-purple font-mono font-medium">
                              <Wrench className="w-3 h-3" />
                              {tc.name}
                            </span>
                            {tc.result ? (
                              <span className="text-ide-emerald flex items-center gap-1 text-[10px]">
                                <CheckCircle2 className="w-3 h-3" /> Completed
                              </span>
                            ) : (
                              <span className="text-ide-amber text-[10px]">Executing...</span>
                            )}
                          </div>
                          <div className="font-mono text-[10px] text-ide-muted bg-ide-panel p-1.5 rounded">
                            {JSON.stringify(tc.args, null, 2)}
                          </div>
                          {tc.result && (
                            <details className="mt-1 text-[10px] text-ide-muted">
                              <summary className="cursor-pointer hover:text-white">View Output</summary>
                              <pre className="mt-1 p-1.5 bg-ide-panel rounded text-[10px] overflow-x-auto text-ide-text font-mono">
                                {JSON.stringify(tc.result, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assistant response content */}
                  {msg.content && (
                    <div className="bg-ide-sidebar border border-ide-border/80 p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap flex flex-col gap-2">
                      <div>{msg.content}</div>

                      {/* Inter-Agent Context Sharing & Actions */}
                      <div className="flex items-center justify-between border-t border-ide-border/50 pt-2 text-[10px] text-ide-muted">
                        <div className="flex items-center gap-1.5">
                          <button
                            title="Copy response text"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 rounded hover:bg-ide-card hover:text-white transition-colors flex items-center gap-1"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-ide-emerald" /> : <Copy className="w-3 h-3" />}
                            <span>Copy</span>
                          </button>

                          {onApplyCodeToEditor && msg.content.includes('```') && (
                            <button
                              title="Apply code snippet to active editor tab"
                              onClick={() => {
                                const codeMatch = msg.content.match(/```(?:[a-z]*\n)?([\s\S]*?)```/);
                                if (codeMatch && codeMatch[1]) {
                                  onApplyCodeToEditor(codeMatch[1]);
                                }
                              }}
                              className="p-1 rounded hover:bg-ide-card hover:text-ide-cyan transition-colors flex items-center gap-1"
                            >
                              <FileCode className="w-3 h-3" />
                              <span>Apply to Editor</span>
                            </button>
                          )}
                        </div>

                        {onShareToContextBus && (
                          <button
                            title="Publish to Multi-Agent Context Bus for other agents to see"
                            onClick={() => handleShareContext(msg.id, msg.content)}
                            className="px-2 py-0.5 rounded bg-ide-accent/10 hover:bg-ide-accent/20 text-ide-accent border border-ide-accent/30 transition-colors flex items-center gap-1"
                          >
                            {sharedMsgId === msg.id ? (
                              <>
                                <Check className="w-3 h-3 text-ide-emerald" />
                                <span className="text-ide-emerald">Context Shared!</span>
                              </>
                            ) : (
                              <>
                                <Share2 className="w-3 h-3" />
                                <span>Share to Context Bus</span>
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

        {/* Live streaming current thought */}
        {agent.currentThought && (
          <div className="bg-ide-sidebar/60 border border-ide-amber/40 rounded-lg p-2 text-[11px] text-ide-amber flex items-center gap-2 animate-pulse-subtle">
            <BrainCircuit className="w-3.5 h-3.5 shrink-0 animate-spin" />
            <span className="truncate">{agent.currentThought}</span>
          </div>
        )}
      </div>

      {/* Input Prompt Box */}
      <div className="p-2.5 bg-ide-sidebar border-t border-ide-border select-none shrink-0">
        {activeFilePath && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-ide-card border border-ide-border text-[10px] text-ide-muted flex items-center gap-1">
              <FileCode className="w-3 h-3 text-ide-cyan" />
              <span className="text-white font-mono">{activeFilePath}</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 bg-ide-darkest border border-ide-border rounded-lg p-1.5 focus-within:border-ide-accent">
          <textarea
            rows={2}
            placeholder={`Ask ${agent.name} (${agent.role})... (Enter to run, Shift+Enter for newline)`}
            value={agent.input}
            disabled={agent.status !== 'idle'}
            onChange={(e) => onUpdateInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-white placeholder-ide-muted/50 focus:outline-none resize-none leading-relaxed"
          />
          <button
            onClick={() => onSendMessage()}
            disabled={!agent.input.trim() || agent.status !== 'idle'}
            className="p-2 rounded-md bg-ide-accent hover:bg-ide-accentHover disabled:opacity-40 text-white transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
