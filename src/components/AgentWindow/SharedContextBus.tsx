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
  Layers
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
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#818cf8]/15 text-[#818cf8] border border-[#818cf8]/30 font-medium">ARCHITECT</span>;
      case 'DEVELOPER':
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30 font-medium">DEVELOPER</span>;
      case 'TESTER':
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#2ea043]/15 text-[#3fb950] border border-[#2ea043]/30 font-medium">TESTER</span>;
      default:
        return <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/30 font-medium">{role}</span>;
    }
  };

  return (
    <div className="w-full border-b border-[#2b2b2b] bg-[#1a1a1a] select-none shrink-0 transition-all">
      {/* Collapsed Bar Header */}
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="h-[28px] px-3 flex items-center justify-between cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors text-[11px]"
      >
        <div className="flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5 text-[#58a6ff]" />
          <span className="font-medium text-[#cccccc]">
            Context Exchange Bus
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#222222] text-[#858585] border border-[#2e2e2e]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <span className="text-[10px] text-[#3fb950] flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] animate-pulse" />
              Synced
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-[#858585]" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-[#858585]" />
          )}
        </div>
      </div>

      {/* Expanded Content Tray */}
      {isExpanded && (
        <div className="p-2.5 bg-[#141414] border-t border-[#2b2b2b] max-h-56 overflow-y-auto space-y-2">
          {items.length === 0 ? (
            <div className="py-3 text-center text-xs text-[#858585]">
              No shared context yet. Agents can publish blueprints, code, or test reports here for peer handoffs.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-1">
                <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider">
                  Shared Knowledge & Handoffs
                </span>
                <button
                  onClick={onClearContext}
                  className="text-[10px] text-[#858585] hover:text-[#f85149] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  Clear All
                </button>
              </div>

              {items.map((item) => (
                <div 
                  key={item.id}
                  className="p-2 rounded bg-[#1e1e1e] border border-[#2b2b2b] flex flex-col gap-1.5 hover:border-[#383838] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {getRoleBadge(item.fromAgentRole)}
                      <span className="text-xs font-medium text-white truncate max-w-[200px]">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        title="Copy Context"
                        onClick={() => handleCopy(item.id, item.content)}
                        className="p-1 hover:bg-[#282828] rounded text-[#858585] hover:text-white transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3 h-3 text-[#3fb950]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>

                      {onApplyCodeToEditor && (
                        <button
                          title="Apply to Editor"
                          onClick={() => onApplyCodeToEditor(item.content)}
                          className="p-1 hover:bg-[#282828] rounded text-[#858585] hover:text-[#58a6ff] transition-colors"
                        >
                          <FileCode className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        title="Dismiss"
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1 hover:bg-[#282828] rounded text-[#858585] hover:text-[#f85149] transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] font-mono text-[#cccccc] line-clamp-3 bg-[#161616] p-1.5 rounded border border-[#262626] whitespace-pre-wrap select-text">
                    {item.content}
                  </p>

                  {/* Send to other agent button */}
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-[#858585] text-[9px]">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-1">
                      <span className="text-[#858585]">Handoff:</span>
                      {agents
                        .filter(a => a.id !== item.fromAgentId)
                        .map(targetAgent => (
                          <button
                            key={targetAgent.id}
                            onClick={() => {
                              const promptText = `[Context from ${item.fromAgentName} (${item.fromAgentRole})]:\n${item.content}\n\nPlease proceed with your role tasks on this context.`;
                              onSendToAgentInput(targetAgent.id, promptText);
                            }}
                            className="px-1.5 py-0.5 rounded bg-[#252525] hover:bg-[#2e2e2e] text-[#cccccc] hover:text-white border border-[#333333] transition-colors flex items-center gap-1"
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
