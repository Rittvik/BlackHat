import React from 'react';
import { 
  GitBranch, 
  Terminal, 
  Settings, 
  Share2, 
  Blocks,
  User,
  Bell,
  Sparkles
} from 'lucide-react';
import { AgentInstance, UserProfile } from '../../types';

interface StatusBarProps {
  agents: AgentInstance[];
  activeLanguage: string;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  onOpenSettings: () => void;
  onOpenAccountModal: () => void;
  user: UserProfile;
  sharedContextCount: number;
  installedExtensionsCount: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  agents,
  activeLanguage,
  isTerminalOpen,
  onToggleTerminal,
  onOpenSettings,
  onOpenAccountModal,
  user,
  sharedContextCount,
  installedExtensionsCount
}) => {
  return (
    <div className="h-[22px] px-2.5 flex items-center justify-between bg-[#181818] border-t border-[#2b2b2b] text-[11px] text-[#858585] select-none shrink-0 font-sans">
      {/* Left items */}
      <div className="flex items-center gap-3">
        {/* Branch */}
        <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
          <GitBranch className="w-3 h-3 text-[#858585]" />
          <span>main*</span>
        </div>

        {/* Live Multi-Agent Status */}
        <div className="hidden sm:flex items-center gap-2 border-l border-[#2e2e2e] pl-2.5">
          {agents.map((agent) => {
            const isBusy = agent.status !== 'idle';
            return (
              <div 
                key={agent.id}
                className={`flex items-center gap-1 text-[10px] ${
                  isBusy 
                    ? 'text-white' 
                    : 'text-[#858585]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isBusy ? 'bg-[#3fb950] animate-pulse' : 'bg-[#555555]'
                }`} />
                <span className="font-normal">{agent.name.split(' ')[0]}:</span>
                <span className="capitalize">{agent.status === 'executing_tool' ? 'tool' : agent.status}</span>
              </div>
            );
          })}
        </div>

        {/* Context Bus indicator */}
        {sharedContextCount > 0 && (
          <div className="hidden md:flex items-center gap-1 text-[10px] text-[#858585] hover:text-[#cccccc] cursor-pointer">
            <Share2 className="w-2.5 h-2.5" />
            <span>{sharedContextCount} context</span>
          </div>
        )}
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        {/* Free AI Models Active Indicator */}
        <button
          onClick={onOpenSettings}
          title="Free AI Models Active (DeepSeek R1, Qwen 2.5 Coder, Llama 3.3). No subscription required. Click to configure."
          className="hidden sm:flex items-center gap-1 text-[10px] text-[#00f0ff] hover:text-[#70f3ff] cursor-pointer transition-colors px-1.5 py-0.2 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/25 font-medium"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Free AI Active</span>
        </button>

        {/* User Account */}
        <button
          onClick={onOpenAccountModal}
          className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors"
        >
          <User className="w-3 h-3 text-[#858585]" />
          <span>{user.isLoggedIn ? user.name : 'Sign In'}</span>
        </button>

        {/* Extensions active */}
        <div className="flex items-center gap-1 text-[#858585]">
          <Blocks className="w-3 h-3" />
          <span>{installedExtensionsCount}</span>
        </div>

        {/* Language */}
        <span className="capitalize hover:text-white cursor-pointer transition-colors">
          {activeLanguage}
        </span>

        {/* Spaces & Encoding */}
        <span className="hidden sm:inline hover:text-white cursor-pointer transition-colors">
          Spaces: 2
        </span>
        <span className="hover:text-white cursor-pointer transition-colors">
          UTF-8
        </span>

        {/* Terminal toggle */}
        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1 hover:text-white cursor-pointer transition-colors ${
            isTerminalOpen ? 'text-white' : ''
          }`}
        >
          <Terminal className="w-3 h-3" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="AI Settings"
          className="hover:text-white cursor-pointer p-0.5 transition-colors"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
