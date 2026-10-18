import React from 'react';
import { 
  GitBranch, 
  Terminal, 
  Settings, 
  CheckCircle2, 
  Zap, 
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
    <div className="h-6 px-2.5 flex items-center justify-between bg-ide-darkest border-t border-ide-border text-[11px] text-ide-muted select-none shrink-0">
      {/* Left items */}
      <div className="flex items-center gap-3">
        {/* Branch */}
        <div className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors">
          <GitBranch className="w-3 h-3 text-ide-muted" />
          <span>main</span>
        </div>

        {/* Live Multi-Agent Status */}
        <div className="flex items-center gap-2 border-l border-ide-border/80 pl-3">
          {agents.map((agent) => {
            const isBusy = agent.status !== 'idle';
            return (
              <div 
                key={agent.id}
                className={`flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] ${
                  isBusy 
                    ? 'bg-ide-accent/20 text-ide-accent border border-ide-accent/40 animate-pulse-subtle' 
                    : 'text-ide-muted/80'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-ide-emerald animate-ping' : 'bg-ide-muted/60'}`} />
                <span className="font-medium text-white">{agent.name.split(' ')[0]}:</span>
                <span className="capitalize">{agent.status.replace('_', ' ')}</span>
              </div>
            );
          })}
        </div>

        {/* Context Bus indicator */}
        {sharedContextCount > 0 && (
          <div className="hidden md:flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-ide-card border border-ide-border text-ide-cyan">
            <Share2 className="w-2.5 h-2.5" />
            <span>{sharedContextCount} Contexts</span>
          </div>
        )}
      </div>

      {/* Right items */}
      <div className="flex items-center gap-3">
        {/* User Account Status */}
        <button
          onClick={onOpenAccountModal}
          className="flex items-center gap-1 hover:text-white cursor-pointer transition-colors"
        >
          <User className="w-3 h-3 text-ide-muted" />
          <span>{user.isLoggedIn ? `${user.name} (${user.provider})` : 'Guest'}</span>
        </button>

        {/* Extensions active */}
        <div className="flex items-center gap-1 text-ide-muted">
          <Blocks className="w-3 h-3" />
          <span>{installedExtensionsCount} Ext</span>
        </div>

        {/* Language */}
        <span className="capitalize hover:text-white cursor-pointer transition-colors">
          {activeLanguage}
        </span>

        {/* Encoding */}
        <span className="hover:text-white cursor-pointer transition-colors">
          UTF-8
        </span>

        {/* Terminal toggle */}
        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1 hover:text-white cursor-pointer transition-colors ${
            isTerminalOpen ? 'text-ide-accent font-medium' : ''
          }`}
        >
          <Terminal className="w-3 h-3" />
          <span>Terminal</span>
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
