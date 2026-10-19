import React, { useState, useRef } from 'react';
import { 
  Bot, 
  Plus, 
  Settings, 
  RotateCcw, 
  Layers,
  Trash2,
  ChevronRight,
  ChevronDown,
  X,
  PanelRightClose
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
  onToggleCollapsePanel?: () => void;
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
  onToggleCollapsePanel,
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
  const [viewMode, setViewMode] = useState<'stacked' | 'tabs'>('stacked');
  const [activeTabAgentId, setActiveTabAgentId] = useState<string>(agents[0]?.id || 'agent-architect');
  const [maximizedAgentId, setMaximizedAgentId] = useState<string | null>(null);

  // The default three agents are initially COLLAPSED as requested by user
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>(() => {
    return {
      'agent-architect': true,
      'agent-developer': true,
      'agent-tester': true
    };
  });

  // Track closed agents so user can close any unneeded agent and reopen at will
  const [closedAgentIds, setClosedAgentIds] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter out any closed agents
  const visibleAgents = agents.filter(a => !closedAgentIds.includes(a.id));
  const closedAgents = agents.filter(a => closedAgentIds.includes(a.id));

  const runningCount = visibleAgents.filter(a => a.status !== 'idle').length;

  const toggleCollapse = (agentId: string) => {
    setCollapsedMap(prev => ({
      ...prev,
      [agentId]: !prev[agentId]
    }));
  };

  const handleCloseAgent = (agentId: string) => {
    setClosedAgentIds(prev => prev.includes(agentId) ? prev : [...prev, agentId]);
  };

  const handleReopenAgent = (agentId: string) => {
    setClosedAgentIds(prev => prev.filter(id => id !== agentId));
    // If reopened, uncollapse it so user sees it right away
    setCollapsedMap(prev => ({
      ...prev,
      [agentId]: false
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    visibleAgents.forEach(a => { next[a.id] = false; });
    setCollapsedMap(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    visibleAgents.forEach(a => { next[a.id] = true; });
    setCollapsedMap(next);
  };

  const allCollapsed = visibleAgents.length > 0 && visibleAgents.every(a => collapsedMap[a.id]);

  return (
    <div className="w-full h-full flex flex-col bg-[#14151a]/95 backdrop-blur-2xl border-l border-white/[0.08] select-none overflow-hidden font-sans">
      {/* Apple macOS Pro Agent Studio Header */}
      <div className="h-[38px] px-3.5 flex items-center justify-between border-b border-white/[0.08] apple-glass shrink-0 apple-specular-top">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded-md bg-[#0A84FF]/15 text-[#0A84FF]">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="text-[12px] font-semibold tracking-tight text-white/90">
            Agent Studio
          </span>

          {runningCount > 0 ? (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] bg-[#30D158]/15 text-[#30D158] font-medium border border-[#30D158]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
              {runningCount} Running
            </span>
          ) : (
            <span className="text-[10px] text-white/45 px-2 py-0.5 rounded-md bg-white/[0.05]">
              {visibleAgents.length} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Expand/Collapse All toggle */}
          <button
            title={allCollapsed ? "Expand All Agents" : "Collapse All Agents"}
            onClick={allCollapsed ? handleExpandAll : handleCollapseAll}
            className="px-2 py-1 rounded-md text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/[0.08] transition-all apple-interactive-subtle cursor-pointer"
          >
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </button>

          {/* Toggle View Mode (Tabs vs Stacked) */}
          <button
            title={viewMode === 'stacked' ? "Switch to Tabbed Agent View" : "Switch to Vertically Stacked View"}
            onClick={() => setViewMode(prev => prev === 'stacked' ? 'tabs' : 'stacked')}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all apple-interactive-subtle cursor-pointer ${
              viewMode === 'tabs' ? 'text-white bg-white/[0.12] shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          {/* Add Agent */}
          <button
            title="Add Custom Agent"
            onClick={onOpenAddAgentModal}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white text-white/50 hover:bg-white/[0.08] transition-all apple-interactive-subtle cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Settings */}
          <button
            title="AI Model & Key Settings"
            onClick={onOpenSettings}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white text-white/50 hover:bg-white/[0.08] transition-all apple-interactive-subtle cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Collapse Panel Button */}
          {onToggleCollapsePanel && (
            <button
              title="Close Agent Studio Panel"
              onClick={onToggleCollapsePanel}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-white text-white/50 hover:bg-white/[0.08] transition-all apple-interactive-subtle cursor-pointer ml-0.5"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          )}
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

      {/* Active Agents & Closed Agents Reopen Bar */}
      <div className="h-[30px] px-2 flex items-center justify-between border-b border-[#2b2b2b] bg-[#141414] overflow-x-auto no-scrollbar shrink-0 text-xs">
        {/* Visible Agents Tabs/Chips */}
        <div className="flex items-center gap-1 min-w-0">
          {visibleAgents.map((agent) => {
            const isActive = activeTabAgentId === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => {
                  setActiveTabAgentId(agent.id);
                  if (maximizedAgentId && maximizedAgentId !== agent.id) {
                    setMaximizedAgentId(agent.id);
                  }
                  // If clicking the chip in stacked mode, expand it
                  if (collapsedMap[agent.id]) {
                    toggleCollapse(agent.id);
                  }
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-normal flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap group ${
                  isActive
                    ? 'bg-[#222222] text-white border border-[#333333]'
                    : 'text-[#858585] hover:text-[#cccccc] hover:bg-[#1a1a1a]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  agent.role === 'ARCHITECT' ? 'bg-[#818cf8]' : agent.role === 'DEVELOPER' ? 'bg-[#58a6ff]' : agent.role === 'TESTER' ? 'bg-[#2ea043]' : 'bg-[#bc8cff]'
                }`} />
                <span>{agent.name.split(' ')[0]}</span>

                {agent.status !== 'idle' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#d29922] animate-ping" />
                )}

                {/* Close Button on chip */}
                <button
                  title={`Close ${agent.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseAgent(agent.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-[#f85149] text-[#858585] transition-opacity ml-0.5 p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Reopen Closed Agents Chips */}
        {closedAgents.length > 0 && (
          <div className="flex items-center gap-1 ml-2 shrink-0">
            <span className="text-[10px] text-[#555555]">Reopen:</span>
            {closedAgents.map(ca => (
              <button
                key={ca.id}
                onClick={() => handleReopenAgent(ca.id)}
                title={`Reopen ${ca.name}`}
                className="px-1.5 py-0.5 rounded bg-[#1c1c1c] hover:bg-[#252525] border border-[#2a2a2a] text-[10px] text-[#858585] hover:text-[#cccccc] transition-colors flex items-center gap-1"
              >
                <Plus className="w-2.5 h-2.5 text-[#3fb950]" />
                <span>{ca.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Agents Body */}
      <div ref={containerRef} className="flex-1 flex flex-col relative overflow-hidden bg-[#181818]">
        {visibleAgents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-[#858585]">
            <Bot className="w-8 h-8 text-[#555555] mb-2" />
            <div className="text-white text-xs font-medium mb-1">All Agents Closed</div>
            <p className="text-[11px] text-[#858585] max-w-xs mb-4">
              You have closed all active agents. Click below to reopen an agent or add a new custom agent.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {closedAgents.map(ca => (
                <button
                  key={ca.id}
                  onClick={() => handleReopenAgent(ca.id)}
                  className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#282828] border border-[#333333] text-white text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#3fb950]" />
                  <span>Open {ca.name}</span>
                </button>
              ))}
              <button
                onClick={onOpenAddAgentModal}
                className="px-2.5 py-1 rounded bg-[#0078d4] hover:bg-[#026ec1] text-white text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>New Agent</span>
              </button>
            </div>
          </div>
        ) : viewMode === 'tabs' ? (
          (() => {
            const agent = visibleAgents.find(a => a.id === activeTabAgentId) || visibleAgents[0];
            return (
              <div className="w-full h-full">
                <StackedAgentPane
                  agent={agent}
                  settings={settings}
                  activeFilePath={activeFilePath}
                  isMaximized={true}
                  isCollapsed={false}
                  onToggleMaximize={() => setViewMode('stacked')}
                  onClose={() => handleCloseAgent(agent.id)}
                  onUpdateInput={(val) => onUpdateAgentInput(agent.id, val)}
                  onSendMessage={(prompt) => onSendMessage(agent.id, prompt)}
                  onStop={() => onStopAgent(agent.id)}
                  onClear={() => onClearAgent(agent.id)}
                  onSelectModel={(model, prov) => onSelectAgentModel(agent.id, model, prov)}
                  onApplyCodeToEditor={onApplyCodeToEditor}
                  onShareToContextBus={onShareToContextBus}
                  onHandoffToDeveloper={(plan) => onSendMessage('agent-developer', `Execute implementation plan formulated by Lead Architect:\n${plan}`)}
                />
              </div>
            );
          })()
        ) : maximizedAgentId ? (
          (() => {
            const agent = visibleAgents.find(a => a.id === maximizedAgentId) || visibleAgents[0];
            return (
              <div className="w-full h-full">
                <StackedAgentPane
                  agent={agent}
                  settings={settings}
                  activeFilePath={activeFilePath}
                  isMaximized={true}
                  isCollapsed={false}
                  onToggleMaximize={() => setMaximizedAgentId(null)}
                  onClose={() => handleCloseAgent(agent.id)}
                  onUpdateInput={(val) => onUpdateAgentInput(agent.id, val)}
                  onSendMessage={(prompt) => onSendMessage(agent.id, prompt)}
                  onStop={() => onStopAgent(agent.id)}
                  onClear={() => onClearAgent(agent.id)}
                  onSelectModel={(model, prov) => onSelectAgentModel(agent.id, model, prov)}
                  onApplyCodeToEditor={onApplyCodeToEditor}
                  onShareToContextBus={onShareToContextBus}
                  onHandoffToDeveloper={(plan) => onSendMessage('agent-developer', `Execute implementation plan formulated by Lead Architect:\n${plan}`)}
                />
              </div>
            );
          })()
        ) : (
          visibleAgents.map((agent, idx) => {
            const isCollapsed = !!collapsedMap[agent.id];
            return (
              <React.Fragment key={agent.id}>
                <StackedAgentPane
                  agent={agent}
                  settings={settings}
                  activeFilePath={activeFilePath}
                  isMaximized={false}
                  isCollapsed={isCollapsed}
                  onToggleCollapse={() => toggleCollapse(agent.id)}
                  onToggleMaximize={() => setMaximizedAgentId(agent.id)}
                  onClose={() => handleCloseAgent(agent.id)}
                  onUpdateInput={(val) => onUpdateAgentInput(agent.id, val)}
                  onSendMessage={(prompt) => onSendMessage(agent.id, prompt)}
                  onStop={() => onStopAgent(agent.id)}
                  onClear={() => onClearAgent(agent.id)}
                  onSelectModel={(model, prov) => onSelectAgentModel(agent.id, model, prov)}
                  onApplyCodeToEditor={onApplyCodeToEditor}
                  onShareToContextBus={onShareToContextBus}
                  onHandoffToDeveloper={(plan) => onSendMessage('agent-developer', `Execute implementation plan formulated by Lead Architect:\n${plan}`)}
                />
                {idx < visibleAgents.length - 1 && (
                  <div className="h-[1px] w-full bg-[#2b2b2b] shrink-0" />
                )}
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
};
