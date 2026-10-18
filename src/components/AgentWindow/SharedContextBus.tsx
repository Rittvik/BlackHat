import React, { useState } from 'react';
import { 
  Share2, 
  ArrowRight, 
  Check, 
  Copy, 
  FileCode, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Sparkles,
  Bot,
  ExternalLink
} from 'lucide-react';
import { SharedContextItem, AgentInstance } from '../../types';

interface SharedContextBusProps {
  items: SharedContextItem[];
  agents: AgentInstance[];
  onApplyCodeToEditor?: (code: string) => void;
  onSendToAgentInput: (agentId: string, text: string) => void;
  onClearContext: () => void;
  onRemoveItem: (id: string) => void;
}

export const SharedContextBus: React.FC<SharedContextBusProps> = ({
  items,
  agents,
  onApplyCodeToEditor,
  onSendToAgentInput,
  onClearContext,
  onRemoveItem
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ARCHITECT':
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">ARCHITECT</span>;
      case 'DEVELOPER':
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">DEVELOPER</span>;
      case 'TESTER':
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">TESTER</span>;
      default:
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-400 border border-purple-500/30">{role}</span>;
    }
  };

  return (
    <div className="w-full border-b border-ide-border bg-ide-card/80 backdrop-blur-md select-none shrink-0 transition-all">
      {/* Collapsed Bar Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-ide-panel/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-ide-accent/20 text-ide-accent border border-ide-accent/40 flex items-center justify-center">
            <Share2 className="w-3 h-3" />
          </div>
          <span className="text-[11px] font-semibold text-white tracking-wide">
            Multi-Agent Context Bus
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-ide-darkest text-ide-muted border border-ide-border">
            {items.length} Shared Items
          </span>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[10px] text-ide-emerald animate-pulse-subtle flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-ide-emerald" />
              Live Sync
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-ide-muted" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-ide-muted" />
          )}
        </div>
      </div>

      {/* Expanded Content Tray */}
      {isExpanded && (
        <div className="p-3 bg-ide-darkest/90 border-t border-ide-border max-h-56 overflow-y-auto space-y-2">
          {items.length === 0 ? (
            <div className="py-4 text-center text-xs text-ide-muted">
              No shared context yet. Agents can publish architecture plans, code solutions, or test results here for other agents to consume.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-ide-muted uppercase tracking-wider">
                  Shared Knowledge & Handoffs
                </span>
                <button
                  onClick={onClearContext}
                  className="text-[10px] text-ide-muted hover:text-ide-rose transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  Clear All
                </button>
              </div>

              {items.map((item) => (
                <div 
                  key={item.id}
                  className="p-2.5 rounded-lg bg-ide-panel border border-ide-border/80 flex flex-col gap-1.5 hover:border-ide-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(item.fromAgentRole)}
                      <span className="text-xs font-semibold text-white">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        title="Copy Context"
                        onClick={() => handleCopy(item.id, item.content)}
                        className="p-1 hover:bg-ide-card rounded text-ide-muted hover:text-white transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-ide-emerald" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {onApplyCodeToEditor && (
                        <button
                          title="Apply to Editor"
                          onClick={() => onApplyCodeToEditor(item.content)}
                          className="p-1 hover:bg-ide-card rounded text-ide-muted hover:text-ide-cyan transition-colors"
                        >
                          <FileCode className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        title="Dismiss"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 hover:bg-ide-card rounded text-ide-muted hover:text-ide-rose transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-ide-text/90 line-clamp-3 bg-ide-darkest/70 p-1.5 rounded border border-ide-border/50 whitespace-pre-wrap select-text">
                    {item.content}
                  </p>

                  {/* Send to other agent button */}
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-ide-muted text-[9px]">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1">
                      <span className="text-ide-muted">Handoff to:</span>
                      {agents
                        .filter(a => a.id !== item.fromAgentId)
                        .map(targetAgent => (
                          <button
                            key={targetAgent.id}
                            onClick={() => {
                              const promptText = `[Context from ${item.fromAgentName} (${item.fromAgentRole})]:\n${item.content}\n\nPlease proceed with your role tasks on this context.`;
                              onSendToAgentInput(targetAgent.id, promptText);
                            }}
                            className="px-1.5 py-0.5 rounded bg-ide-card hover:bg-ide-accent/20 text-ide-muted hover:text-ide-accent border border-ide-border transition-colors flex items-center gap-1"
                          >
                            <span>{targetAgent.name.split(' ')[0]}</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
