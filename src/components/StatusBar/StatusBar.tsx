import React from 'react';
import { 
  GitBranch, 
  Terminal, 
  Settings, 
  Share2, 
  Blocks,
  User,
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
  mcpServersCount?: number;
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
  installedExtensionsCount,
  mcpServersCount = 0
}) => {
  return (
    <div className="h-[26px] px-3 flex items-center justify-between apple-glass border-t border-white/[0.08] text-[11px] text-white/55 select-none shrink-0 font-sans apple-specular-top relative z-30">
      {/* Left items: Branch, Agent status, Context */}
      <div className="flex items-center gap-2.5">
        {/* Git Branch Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:text-white hover:bg-white/[0.06] cursor-pointer transition-all apple-interactive-subtle">
          <GitBranch className="w-3 h-3 text-[#0A84FF]" />
          <span className="font-medium text-white/80">main*</span>
        </div>

        {/* Live Multi-Agent Status */}
        <div className="hidden sm:flex items-center gap-2 border-l border-white/[0.08] pl-2.5">
          {agents.map((agent) => {
            const isBusy = agent.status !== 'idle';
            return (
              <div 
                key={agent.id}
                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] transition-colors ${
                  isBusy 
                    ? 'text-white bg-white/[0.08]' 
                    : 'text-white/45'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isBusy ? 'bg-[#30D158] shadow-[0_0_6px_#30D158] animate-pulse' : 'bg-white/25'
                }`} />
                <span className="font-medium">{agent.name.split(' ')[0]}:</span>
                <span className="capitalize text-white/60">{agent.status === 'executing_tool' ? 'tool' : agent.status}</span>
              </div>
            );
          })}
        </div>

        {/* Context Bus indicator */}
        {sharedContextCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] text-white/50 hover:text-white hover:bg-white/[0.06] cursor-pointer transition-all">
            <Share2 className="w-2.5 h-2.5 text-[#0A84FF]" />
            <span>{sharedContextCount} context</span>
          </div>
        )}
      </div>

      {/* Right items: AI Badge, Encoding, Language, Controls */}
      <div className="flex items-center gap-2">
        {/* Free AI Active Badge */}
        <button
          onClick={onOpenSettings}
          title="Free AI Models Active (DeepSeek R1, Qwen 2.5 Coder, Llama 3.3). Click to configure."
          className="hidden sm:flex items-center gap-1 text-[10px] text-[#0A84FF] hover:text-[#409CFF] cursor-pointer transition-all px-2 py-0.5 rounded-full bg-[#0A84FF]/12 border border-[#0A84FF]/25 font-medium apple-interactive-subtle"
        >
          <Sparkles className="w-2.5 h-2.5" />
          <span>Free AI Active</span>
        </button>

        {/* User Account */}
        <button
          onClick={onOpenAccountModal}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:text-white hover:bg-white/[0.06] cursor-pointer transition-all apple-interactive-subtle"
        >
          <User className="w-3 h-3 text-white/50" />
          <span className="font-medium">{user.isLoggedIn ? user.name : 'Sign In'}</span>
        </button>

        {/* Extensions active */}
        <div title={`${installedExtensionsCount} Extensions Installed`} className="flex items-center gap-1 text-white/50 px-1.5 py-0.5">
          <Blocks className="w-3 h-3" />
          <span>{installedExtensionsCount}</span>
        </div>

        {/* MCP Servers Active */}
        <div 
          title={`${mcpServersCount} Model Context Protocol (MCP) server(s) connected`} 
          className="hidden sm:flex items-center gap-1.5 text-white/50 px-1.5 py-0.5 rounded-md hover:text-white hover:bg-white/[0.06] cursor-pointer transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#388bfd] shadow-[0_0_5px_#388bfd]" />
          <span>MCP: {mcpServersCount}</span>
        </div>

        {/* Language & Encoding */}
        <span className="capitalize hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/[0.06] cursor-pointer transition-colors">
          {activeLanguage}
        </span>
        <span className="hidden sm:inline hover:text-white px-1.5 py-0.5 rounded-md hover:bg-white/[0.06] cursor-pointer transition-colors">
          UTF-8
        </span>

        {/* Terminal toggle */}
        <button
          onClick={onToggleTerminal}
          className={`p-1 rounded-md hover:bg-white/[0.08] hover:text-white cursor-pointer transition-all ${
            isTerminalOpen ? 'text-[#0A84FF] bg-white/[0.08]' : 'text-white/50'
          }`}
          title="Toggle Terminal"
        >
          <Terminal className="w-3 h-3" />
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="AI Settings"
          className="p-1 rounded-md hover:bg-white/[0.08] hover:text-white cursor-pointer transition-all text-white/50"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
