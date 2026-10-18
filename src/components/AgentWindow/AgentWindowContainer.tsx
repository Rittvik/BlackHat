import React, { useState, useRef } from 'react';
import { 
  Bot, 
  Plus, 
  Settings, 
  RotateCcw, 
  Layers,
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
  const [viewMode, setViewMode] = useState<'stacked' | 'tabs'>('stacked');
  const [activeTabAgentId, setActiveTabAgentId] = useState<string>(agents[0]?.id || 'agent-architect');
  const [maximizedAgentId, setMaximizedAgentId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const runningCount = agents.filter(a => a.status !== 'idle').length;

  return (
    <div className="w-full h-full flex flex-col bg-[#181818] border-l border-[#2b2b2b] select-none overflow-hidden">
      {/* Top Header */}
      <div className="h-[35px] px-3.5 flex items-center justify-between border-b border-[#2b2b2b] bg-[#181818] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
            Agent Studio
          </span>

          {runningCount > 0 ? (
            <span className="flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-[#2ea043]/15 text-[#3fb950] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043] animate-pulse" />
              {runningCount} Running
            </span>
          ) : (
            <span className="text-[10px] text-[#858585] font-normal">
              {agents.length} active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Toggle View Mode */}
          <button
            title={viewMode === 'stacked' ? "Switch to Tabbed Agent View" : "Switch to Vertically Stacked View"}
            onClick={() => setViewMode(prev => prev === 'stacked' ? 'tabs' : 'stacked')}
            className={`p-1 rounded transition-colors ${
              viewMode === 'tabs' ? 'text-white bg-[#282828]' : 'text-[#858585] hover:text-white hover:bg-[#252525]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            title="Reset Split"
            onClick={() => setMaximizedAgentId(null)}
            className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            title="Add Custom Agent"
            onClick={onOpenAddAgentModal}
            className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors flex items-center gap-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            title="AI Model & Key Settings"
            onClick={onOpenSettings}
            className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
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

      {/* Agent Selector Bar */}
      <div className="h-[30px] px-2 flex items-center gap-1 border-b border-[#2b2b2b] bg-[#141414] overflow-x-auto no-scrollbar shrink-0">
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
              className={`px-2 py-0.5 rounded text-[11px] font-normal flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
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

              {agent.role === 'CUSTOM' && onRemoveCustomAgent && (
                <button
                  title="Remove Agent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCustomAgent(agent.id);
                  }}
                  className="hover:text-[#f85149] text-[#858585] ml-0.5 p-0.5"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Agents Body */}
      <div ref={containerRef} className="flex-1 flex flex-col relative overflow-hidden bg-[#181818]">
        {viewMode === 'tabs' ? (
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
                <div className="h-[1px] w-full bg-[#2b2b2b] shrink-0" />
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};
