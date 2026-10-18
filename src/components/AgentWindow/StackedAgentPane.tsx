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
  X
} from 'lucide-react';
import { AgentInstance, AISettings, AgentRole } from '../../types';

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
  onShareToContextBus
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sharedMsgId, setSharedMsgId] = useState<string | null>(null);

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

  const getRoleBadge = (role: AgentRole) => {
    switch (role) {
      case 'ARCHITECT':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/25 font-medium tracking-wide">
            ARCHITECT
          </span>
        );
      case 'DEVELOPER':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/25 font-medium tracking-wide">
            DEVELOPER
          </span>
        );
      case 'TESTER':
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#2ea043]/15 text-[#3fb950] border border-[#2ea043]/25 font-medium tracking-wide">
            TESTER
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/25 font-medium tracking-wide">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = () => {
    switch (agent.status) {
      case 'thinking':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] text-[#d29922]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d29922] animate-pulse" />
            Thinking
          </span>
        );
      case 'executing_tool':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] text-[#bc8cff]">
            <Wrench className="w-3 h-3 animate-spin" />
            Tool Calling
          </span>
        );
      case 'streaming':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] text-[#3fb950]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] animate-ping" />
            Streaming
          </span>
        );
      case 'error':
        return (
          <span className="px-1.5 py-0.2 rounded text-[10px] text-[#f85149]">
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`w-full flex flex-col bg-[#181818] select-text relative overflow-hidden transition-all ${
      isCollapsed ? 'h-[36px] shrink-0' : 'h-full flex-1'
    }`}>
      {/* Agent Header */}
      <div 
        onClick={onToggleCollapse}
        className="h-[36px] px-2.5 flex items-center justify-between bg-[#181818] hover:bg-[#1d1d1d] border-b border-[#2b2b2b] select-none shrink-0 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {onToggleCollapse && (
            <span className="text-[#858585] p-0.5">
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          )}
          <span className="text-xs font-medium text-white truncate">
            {agent.name}
          </span>
          {getRoleBadge(agent.role)}
          {getStatusBadge()}
          {isCollapsed && agent.messages.length > 0 && (
            <span className="text-[10px] text-[#666666] font-mono">
              ({agent.messages.length} msgs)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {!isCollapsed && (
            <>
              {/* Model Selector */}
              <select
                value={`${agent.provider}:${agent.model}`}
                onChange={(e) => {
                  const [prov, mod] = e.target.value.split(':');
                  onSelectModel(mod, prov);
                }}
                className="text-[10px] bg-[#222222] border border-[#2b2b2b] text-[#cccccc] rounded px-1.5 py-0.5 focus:outline-none hover:border-[#383838] cursor-pointer"
              >
                <optgroup label="✨ Free Models (No Subscription Required)">
                  <option value="free:deepseek-r1">DeepSeek R1 [Free]</option>
                  <option value="free:qwen-coder">Qwen 2.5 Coder [Free]</option>
                  <option value="free:llama-3.3">Llama 3.3 70B [Free]</option>
                  <option value="free:mistral">Mistral Small [Free]</option>
                  <option value="ollama:llama3.2">Ollama Local [Free]</option>
                </optgroup>
                <optgroup label="💎 Pro Subscriptions & Custom Keys">
                  <option value="gemini:gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini:gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="anthropic:claude-3-7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="openai:gpt-4o">OpenAI (GPT-4o)</option>
                </optgroup>
              </select>

              {/* Action buttons */}
              {agent.status !== 'idle' ? (
                <button
                  title="Stop Agent"
                  onClick={onStop}
                  className="p-1 rounded bg-[#f85149]/20 hover:bg-[#f85149]/30 text-[#f85149]"
                >
                  <Square className="w-3 h-3 fill-current" />
                </button>
              ) : (
                <button
                  title="Clear Chat"
                  onClick={onClear}
                  className="p-1 rounded hover:bg-[#252525] text-[#858585] hover:text-[#cccccc] transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}

              <button
                title={isMaximized ? "Restore Split" : "Maximize"}
                onClick={onToggleMaximize}
                className="p-1 rounded hover:bg-[#252525] text-[#858585] hover:text-[#cccccc] transition-colors"
              >
                {isMaximized ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              </button>
            </>
          )}

          {/* Close Agent Button */}
          {onClose && (
            <button
              title="Close Agent"
              onClick={onClose}
              className="p-1 rounded hover:bg-[#f85149]/20 text-[#858585] hover:text-[#f85149] transition-colors ml-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area & Input (Visible only when not collapsed) */}
      {!isCollapsed && (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs">
            {agent.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#858585] select-none">
                <div className="w-8 h-8 rounded-lg bg-[#222222] border border-[#2b2b2b] text-[#58a6ff] flex items-center justify-center mb-2">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="font-medium text-white text-xs mb-1">
                  {agent.name}
                </div>
                <p className="text-[11px] max-w-xs text-[#858585] leading-relaxed mb-3">
                  {agent.description}
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center max-w-xs">
                  {agent.role === 'ARCHITECT' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Design high-level architecture and blueprint for this project`)}
                        className="px-2 py-1 bg-[#222222] hover:bg-[#282828] border border-[#2b2b2b] rounded text-[10px] text-[#cccccc] transition-colors"
                      >
                        Blueprint Architecture
                      </button>
                      <button
                        onClick={() => onSendMessage(`Create a task breakdown plan for Developer and Tester agents`)}
                        className="px-2 py-1 bg-[#222222] hover:bg-[#282828] border border-[#2b2b2b] rounded text-[10px] text-[#cccccc] transition-colors"
                      >
                        Task Handoff Plan
                      </button>
                    </>
                  )}
                  {agent.role === 'DEVELOPER' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Implement the core code features and run required files`)}
                        className="px-2 py-1 bg-[#222222] hover:bg-[#282828] border border-[#2b2b2b] rounded text-[10px] text-[#cccccc] transition-colors"
                      >
                        Implement Features
                      </button>
                      <button
                        onClick={() => onSendMessage(`Inspect project files and refactor key modules`)}
                        className="px-2 py-1 bg-[#222222] hover:bg-[#282828] border border-[#2b2b2b] rounded text-[10px] text-[#cccccc] transition-colors"
                      >
                        Refactor Code
                      </button>
                    </>
                  )}
                  {agent.role === 'TESTER' && (
                    <>
                      <button
                        onClick={() => onSendMessage(`Generate test suite and verify boundary conditions`)}
                        className="px-2 py-1 bg-[#222222] hover:bg-[#282828] border border-[#2b2b2b] rounded text-[10px] text-[#cccccc] transition-colors"
                      >
                        Run QA Verification
                      </button>
                      <button
                        onClick={() => onSendMessage(`Audit code resilience and edge case errors`)}
                        className="px-2 py-1 bg-[#222222] hover:bg-[#282828] border border-[#2b2b2b] rounded text-[10px] text-[#cccccc] transition-colors"
                      >
                        Edge Case Audit
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              agent.messages.map((msg) => (
                <div key={msg.id} className="space-y-1.5">
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-[#222222] border border-[#2e2e2e] px-3 py-2 rounded-lg text-white text-xs leading-relaxed">
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-[#cccccc]">
                      {/* Thought stream fold */}
                      {msg.thoughts && msg.thoughts.length > 0 && (
                        <details className="bg-[#1c1c1c] border border-[#282828] rounded-md p-2 text-[11px] text-[#858585]">
                          <summary className="font-medium text-[#9d9d9d] cursor-pointer flex items-center gap-1.5 select-none hover:text-white">
                            <BrainCircuit className="w-3.5 h-3.5 text-[#d29922]" />
                            <span>Reasoning ({msg.thoughts.length} steps)</span>
                          </summary>
                          <div className="mt-1.5 space-y-1 pl-3 border-l border-[#333333] text-[11px] text-[#cccccc] font-mono">
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
                            <div key={tc.id} className="bg-[#141414] border border-[#282828] rounded-md p-2 text-[11px]">
                              <div className="flex items-center justify-between text-[#858585] mb-1">
                                <span className="flex items-center gap-1 text-[#bc8cff] font-mono font-medium">
                                  <Wrench className="w-3 h-3" />
                                  {tc.name}
                                </span>
                                {tc.result ? (
                                  <span className="text-[#3fb950] flex items-center gap-1 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3" /> Done
                                  </span>
                                ) : (
                                  <span className="text-[#d29922] text-[10px]">Executing...</span>
                                )}
                              </div>
                              <div className="font-mono text-[10px] text-[#858585] bg-[#1a1a1a] p-1.5 rounded">
                                {JSON.stringify(tc.args, null, 2)}
                              </div>
                              {tc.result && (
                                <details className="mt-1 text-[10px] text-[#858585]">
                                  <summary className="cursor-pointer hover:text-white">Output</summary>
                                  <pre className="mt-1 p-1.5 bg-[#1a1a1a] rounded text-[10px] overflow-x-auto text-[#cccccc] font-mono">
                                    {JSON.stringify(tc.result, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Assistant response text */}
                      {msg.content && (
                        <div className="bg-[#1a1a1a] border border-[#262626] p-3 rounded-lg text-xs leading-relaxed whitespace-pre-wrap flex flex-col gap-2">
                          <div>{msg.content}</div>

                          {/* Inter-Agent Context Sharing & Actions */}
                          <div className="flex items-center justify-between border-t border-[#262626] pt-2 text-[10px] text-[#858585]">
                            <div className="flex items-center gap-1.5">
                              <button
                                title="Copy response text"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                className="p-1 rounded hover:bg-[#252525] hover:text-white transition-colors flex items-center gap-1"
                              >
                                {copiedId === msg.id ? <Check className="w-3 h-3 text-[#3fb950]" /> : <Copy className="w-3 h-3" />}
                                <span>Copy</span>
                              </button>

                              {onApplyCodeToEditor && msg.content.includes('```') && (
                                <button
                                  title="Apply code to editor"
                                  onClick={() => {
                                    const codeMatch = msg.content.match(/```(?:[a-z]*\n)?([\s\S]*?)```/);
                                    if (codeMatch && codeMatch[1]) {
                                      onApplyCodeToEditor(codeMatch[1]);
                                    }
                                  }}
                                  className="p-1 rounded hover:bg-[#252525] hover:text-[#58a6ff] transition-colors flex items-center gap-1"
                                >
                                  <FileCode className="w-3 h-3" />
                                  <span>Apply to Editor</span>
                                </button>
                              )}
                            </div>

                            {onShareToContextBus && (
                              <button
                                title="Publish to context bus"
                                onClick={() => handleShareContext(msg.id, msg.content)}
                                className="px-2 py-0.5 rounded bg-[#252525] hover:bg-[#2e2e2e] text-[#cccccc] hover:text-white border border-[#333333] transition-colors flex items-center gap-1"
                              >
                                {sharedMsgId === msg.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-[#3fb950]" />
                                    <span className="text-[#3fb950]">Context Shared!</span>
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

            {/* Live streaming thought */}
            {agent.currentThought && (
              <div className="bg-[#1c1c1c] border border-[#d29922]/30 rounded-md p-2 text-[11px] text-[#d29922] flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5 shrink-0 animate-spin" />
                <span className="truncate">{agent.currentThought}</span>
              </div>
            )}
          </div>

          {/* Cursor-style Composer Input */}
          <div className="p-2.5 bg-[#181818] border-t border-[#2b2b2b] select-none shrink-0">
            <div className="bg-[#222222] border border-[#333333] focus-within:border-[#0078d4] rounded-lg p-2 transition-all">
              {/* Active File Context Pill */}
              {activeFilePath && (
                <div className="mb-1.5 flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-[#181818] border border-[#2e2e2e] text-[10px] text-[#858585] flex items-center gap-1">
                    <FileCode className="w-3 h-3 text-[#58a6ff]" />
                    <span className="text-[#cccccc] font-mono">{activeFilePath.split('/').pop()}</span>
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
                className="w-full bg-transparent text-xs text-white placeholder-[#858585] focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between pt-1 border-t border-[#2a2a2a] mt-1 text-[11px]">
                <span className="text-[10px] text-[#858585]">
                  Enter to send, Shift+Enter for newline
                </span>
                <button
                  onClick={() => onSendMessage()}
                  disabled={!agent.input.trim() || agent.status !== 'idle'}
                  className="w-6 h-6 rounded flex items-center justify-center bg-[#0078d4] hover:bg-[#026ec1] disabled:opacity-30 text-white transition-colors"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
