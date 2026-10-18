import React from 'react';
import { 
  Files, 
  Search, 
  Terminal, 
  Settings, 
  Sparkles, 
  Blocks, 
  User, 
  LogOut 
} from 'lucide-react';
import { UserProfile } from '../../types';

interface ActivityBarProps {
  activeView: 'explorer' | 'search' | 'extensions';
  onSelectView: (view: 'explorer' | 'search' | 'extensions') => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  onOpenSettings: () => void;
  onOpenAccountModal: () => void;
  onOpenCommandPalette: () => void;
  user: UserProfile;
  installedExtensionsCount: number;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activeView,
  onSelectView,
  isTerminalOpen,
  onToggleTerminal,
  onOpenSettings,
  onOpenAccountModal,
  onOpenCommandPalette,
  user,
  installedExtensionsCount
}) => {
  return (
    <div className="w-12 h-full flex flex-col justify-between bg-ide-darkest border-r border-ide-border select-none py-2 shrink-0">
      {/* Top action icons */}
      <div className="flex flex-col items-center gap-2">
        {/* Antigravity Logo / Command Palette Trigger */}
        <button
          onClick={onOpenCommandPalette}
          title="Antigravity Command Palette (Cmd + K)"
          className="w-8 h-8 rounded-lg bg-ide-accent/20 hover:bg-ide-accent/30 text-ide-accent flex items-center justify-center mb-2 border border-ide-accent/40 transition-colors shadow-sm"
        >
          <Sparkles className="w-4 h-4 fill-current" />
        </button>

        {/* Explorer */}
        <button
          title="Explorer (Files)"
          onClick={() => onSelectView('explorer')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${
            activeView === 'explorer'
              ? 'text-white bg-ide-card border-l-2 border-ide-accent'
              : 'text-ide-muted hover:text-white hover:bg-ide-card'
          }`}
        >
          <Files className="w-4 h-4" />
        </button>

        {/* Extensions Store */}
        <button
          title="Extensions Store (Marketplace)"
          onClick={() => onSelectView('extensions')}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors relative ${
            activeView === 'extensions'
              ? 'text-white bg-ide-card border-l-2 border-ide-accent'
              : 'text-ide-muted hover:text-white hover:bg-ide-card'
          }`}
        >
          <Blocks className="w-4 h-4" />
          {installedExtensionsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-ide-accent" />
          )}
        </button>

        {/* Integrated Terminal Toggle */}
        <button
          title="Integrated Terminal"
          onClick={onToggleTerminal}
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
            isTerminalOpen
              ? 'text-ide-accent bg-ide-card'
              : 'text-ide-muted hover:text-white hover:bg-ide-card'
          }`}
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom action icons */}
      <div className="flex flex-col items-center gap-2">
        {/* User Account / Login */}
        <button
          title={user.isLoggedIn ? `Logged in as ${user.name} (${user.provider})` : "Sign In with Google or GitHub"}
          onClick={onOpenAccountModal}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-ide-muted hover:text-white hover:bg-ide-card transition-colors relative group"
        >
          {user.isLoggedIn && user.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-6 h-6 rounded-full border border-ide-accent/60"
            />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span className={`absolute bottom-1 right-1 w-2 h-2 rounded-full border-2 border-ide-darkest ${
            user.isLoggedIn ? 'bg-ide-emerald' : 'bg-ide-muted/50'
          }`} />
        </button>

        {/* Settings */}
        <button
          title="AI Settings & Keys"
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-ide-muted hover:text-white hover:bg-ide-card transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
