import React, { useState, useRef } from 'react';
import { 
  Bot, 
  Plus, 
  Settings, 
  Maximize2, 
  RotateCcw, 
  Zap, 
  LayoutList,
  Sparkles,
  Columns,
  Rows,
  Layers,
  Share2,
  Trash2
} from 'lucide-react';
import { AgentInstance, AISettings, SharedContextItem } from '../../types';
import { StackedAgentPane } from './StackedAgentPane';
import { SharedContextBus } from './SharedContextBus';

interface AgentWindowContainerProps {
  agents: AgentInstance[];
  settings: AISettings;
  sharedContextItems: SharedContextItem[];
  activeFilePath?: string;
  onOpenSettings: () => void;
  onOpenAddAgentModal: () => void;
  onRemoveCustomAgent?: (agentId: string) => void;
  onUpdateAgentInput: (agentId: string, val: string) => void;
  onSendMessage: (agentId: string, prompt?: string) => void;
  onStopAgent: (agentId: string) => void;
  onClearAgent: (agentId: string) => void;
  onSelectAgentModel: (agentId: string, model: string, provider: any) => void;
  onApplyCodeToEditor?: (code: string) => void;
  onShareToContextBus: (title: string, content: string, type: 'plan' | 'code' | 'test' | 'summary') => void;
  onClearContextBus: () => void;
  onRemoveContextItem: (id: string) => void;
}

export const AgentWindowContainer: React.FC<AgentWindowContainerProps> = ({
  agents,
  settings,
  sharedContextItems,
  activeFilePath,
  onOpenSettings,
  onOpenAddAgentModal,
  onRemoveCustomAgent,
  onUpdateAgentInput,
  onSendMessage,
  onStopAgent,
  onClearAgent,
  onSelectAgentModel,
  onApplyCodeToEditor,
  onShareToContextBus,
  onClearContextBus,
  onRemoveContextItem
}) => {
  // View mode: 'stacked' (all agents vertically split) or 'tabs' (active single agent with tabs)
  const [viewMode, setViewMode] = useState<'stacked' | 'tabs'>('stacked');
  const [activeTabAgentId, setActiveTabAgentId] = useState<string>(agents[0]?.id || 'agent-architect');
  const [splitPercent, setSplitPercent] = useState<number>(33.3);
  const [maximizedAgentId, setMaximizedAgentId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const draggingIndexRef = useRef<number>(0);

  const runningCount = agents.filter(a => a.status !== 'idle').length;

  return (
    <div className="w-full h-full flex flex-col bg-ide-sidebar border-l border-ide-border select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-ide-border bg-ide-sidebar shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ide-text uppercase">
            <Bot className="w-4 h-4 text-ide-accent" />
            <span>Agent Studio</span>
          </div>

          {runningCount > 0 ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30 animate-pulse-subtle font-medium">
              <Zap className="w-2.5 h-2.5 fill-current" />
              {runningCount} Active
            </span>
          ) : (
            <span className="text-[10px] text-ide-muted px-1.5 py-0.2 rounded bg-ide-card font-medium">
              {agents.length} Agents Available
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle View Mode: Stacked vs Tabbed */}
          <button
            title={viewMode === 'stacked' ? "Switch to Tabbed Agent View" : "Switch to Vertically Stacked View"}
            onClick={() => setViewMode(prev => prev === 'stacked' ? 'tabs' : 'stacked')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'tabs' ? 'text-ide-accent bg-ide-card' : 'text-ide-muted hover:text-white hover:bg-ide-card'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            title="Reset Split & Maximization"
            onClick={() => { setMaximizedAgentId(null); setSplitPercent(33.3); }}
            className="p-1 hover:text-white text-ide-muted hover:bg-ide-card rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            title="Create Custom Agent"
            onClick={onOpenAddAgentModal}
            className="p-1 hover:text-white text-ide-accent hover:bg-ide-card rounded transition-colors flex items-center gap-0.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium pr-1 hidden sm:inline">Add Agent</span>
          </button>

          <button
            title="AI Model & API Keys Settings"
            onClick={onOpenSettings}
            className="p-1 hover:text-white text-ide-muted hover:bg-ide-card rounded transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Shared Context Bus Drawer */}
      <SharedContextBus
        items={sharedContextItems}
        agents={agents}
        onApplyCodeToEditor={onApplyCodeToEditor}
        onSendToAgentInput={onUpdateAgentInput}
        onClearContext={onClearContextBus}
        onRemoveItem={onRemoveContextItem}
      />

      {/* Agent Quick Select Tabs (Visible in Tabbed mode or with >2 agents) */}
      <div className="h-8 px-2 flex items-center gap-1 border-b border-ide-border bg-ide-darkest overflow-x-auto no-scrollbar shrink-0">
        {agents.map((agent) => {
          const isActive = activeTabAgentId === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => {
                setActiveTabAgentId(agent.id);
                if (maximizedAgentId && maximizedAgentId !== agent.id) {
                  setMaximizedAgentId(agent.id);
                }
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-ide-panel text-white border border-ide-border shadow-sm'
                  : 'text-ide-muted hover:text-white hover:bg-ide-card'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${agent.avatarColor}`} />
              <span>{agent.name.split(' ')[0]}</span>
              <span className="text-[9px] text-ide-muted opacity-70">({agent.role})</span>

              {agent.status !== 'idle' && (
                <span className="w-1.5 h-1.5 rounded-full bg-ide-amber animate-ping" />
              )}

              {/* Allow removing user-added custom agents */}
              {agent.role === 'CUSTOM' && onRemoveCustomAgent && (
                <button
                  title="Remove Custom Agent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomAgent(agent.id);
                  }}
                  className="hover:text-ide-rose text-ide-muted ml-0.5 p-0.5"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Agents Body */}
      <div ref={containerRef} className="flex-1 flex flex-col relative overflow-hidden">
        {viewMode === 'tabs' ? (
          /* Single Tabbed Agent View */
          (() => {
            const agent = agents.find(a => a.id === activeTabAgentId) || agents[0];
            return (
              <div className="w-full h-full">
                <StackedAgentPane
                  agent={agent}
                  settings={settings}
                  activeFilePath={activeFilePath}
                  isMaximized={true}
                  onToggleMaximize={() => setViewMode('stacked')}
                  onUpdateInput={(val) => onUpdateAgentInput(agent.id, val)}
                  onSendMessage={(prompt) => onSendMessage(agent.id, prompt)}
                  onStop={() => onStopAgent(agent.id)}
                  onClear={() => onClearAgent(agent.id)}
                  onSelectModel={(model, prov) => onSelectAgentModel(agent.id, model, prov)}
                  onApplyCodeToEditor={onApplyCodeToEditor}
                  onShareToContextBus={onShareToContextBus}
                />
              </div>
            );
          })()
        ) : maximizedAgentId ? (
          /* One Agent Maximized */
          (() => {
            const agent = agents.find(a => a.id === maximizedAgentId) || agents[0];
            return (
              <div className="w-full h-full">
                <StackedAgentPane
                  agent={agent}
                  settings={settings}
                  activeFilePath={activeFilePath}
                  isMaximized={true}
                  onToggleMaximize={() => setMaximizedAgentId(null)}
                  onUpdateInput={(val) => onUpdateAgentInput(agent.id, val)}
                  onSendMessage={(prompt) => onSendMessage(agent.id, prompt)}
                  onStop={() => onStopAgent(agent.id)}
                  onClear={() => onClearAgent(agent.id)}
                  onSelectModel={(model, prov) => onSelectAgentModel(agent.id, model, prov)}
                  onApplyCodeToEditor={onApplyCodeToEditor}
                  onShareToContextBus={onShareToContextBus}
                />
              </div>
            );
          })()
        ) : (
          /* Multi-Agent Vertically Stacked Panes (Simultaneous Execution) */
          agents.map((agent, idx) => (
            <React.Fragment key={agent.id}>
              <div className="flex-1 min-h-[160px] overflow-hidden flex flex-col">
                <StackedAgentPane
                  agent={agent}
                  settings={settings}
                  activeFilePath={activeFilePath}
                  isMaximized={false}
                  onToggleMaximize={() => setMaximizedAgentId(agent.id)}
                  onUpdateInput={(val) => onUpdateAgentInput(agent.id, val)}
                  onSendMessage={(prompt) => onSendMessage(agent.id, prompt)}
                  onStop={() => onStopAgent(agent.id)}
                  onClear={() => onClearAgent(agent.id)}
                  onSelectModel={(model, prov) => onSelectAgentModel(agent.id, model, prov)}
                  onApplyCodeToEditor={onApplyCodeToEditor}
                  onShareToContextBus={onShareToContextBus}
                />
              </div>
              {idx < agents.length - 1 && (
                <div className="h-1.5 w-full bg-ide-darkest border-y border-ide-border shrink-0 select-none flex items-center justify-center">
                  <div className="w-6 h-0.5 rounded-full bg-ide-border" />
                </div>
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};
