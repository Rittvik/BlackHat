import React from 'react';
import { 
  Files, 
  Search, 
  GitBranch, 
  Blocks, 
  Bot, 
  Terminal, 
  Settings, 
  User 
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
    <div className="w-[48px] h-full flex flex-col justify-between bg-[#181818] border-r border-[#2b2b2b] select-none shrink-0 z-10">
      {/* Top action icons */}
      <div className="flex flex-col items-center">
        {/* Explorer */}
        <button
          title="Explorer (Files)"
          onClick={() => onSelectView('explorer')}
          className={`w-full h-12 flex items-center justify-center transition-colors relative group ${
            activeView === 'explorer'
              ? 'text-white border-l-2 border-[#0078d4]'
              : 'text-[#858585] hover:text-[#cccccc] border-l-2 border-transparent'
          }`}
        >
          <Files className="w-5 h-5 stroke-[1.6]" />
        </button>

        {/* Extensions Store */}
        <button
          title="Extensions Store"
          onClick={() => onSelectView('extensions')}
          className={`w-full h-12 flex items-center justify-center transition-colors relative group ${
            activeView === 'extensions'
              ? 'text-white border-l-2 border-[#0078d4]'
              : 'text-[#858585] hover:text-[#cccccc] border-l-2 border-transparent'
          }`}
        >
          <Blocks className="w-5 h-5 stroke-[1.6]" />
          {installedExtensionsCount > 0 && (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-[#0078d4]" />
          )}
        </button>

        {/* Integrated Terminal Toggle */}
        <button
          title="Toggle Terminal (`)"
          onClick={onToggleTerminal}
          className={`w-full h-12 flex items-center justify-center transition-colors border-l-2 border-transparent ${
            isTerminalOpen
              ? 'text-white'
              : 'text-[#858585] hover:text-[#cccccc]'
          }`}
        >
          <Terminal className="w-5 h-5 stroke-[1.6]" />
        </button>
      </div>

      {/* Bottom action icons */}
      <div className="flex flex-col items-center mb-1">
        {/* User Account / Login */}
        <button
          title={user.isLoggedIn ? `Account: ${user.name} (${user.provider})` : "Sign In with Google or GitHub"}
          onClick={onOpenAccountModal}
          className="w-full h-12 flex items-center justify-center text-[#858585] hover:text-[#cccccc] transition-colors relative border-l-2 border-transparent"
        >
          {user.isLoggedIn && user.avatar ? (
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-6 h-6 rounded-full border border-[#3c3c3c] object-cover"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#181818] bg-[#2ea043]" />
            </div>
          ) : (
            <User className="w-5 h-5 stroke-[1.6]" />
          )}
        </button>

        {/* Settings */}
        <button
          title="Manage AI Settings & Keys"
          onClick={onOpenSettings}
          className="w-full h-12 flex items-center justify-center text-[#858585] hover:text-[#cccccc] transition-colors border-l-2 border-transparent"
        >
          <Settings className="w-5 h-5 stroke-[1.6]" />
        </button>
      </div>
    </div>
  );
};
