import React from 'react';
import { 
  Files, 
  Search, 
  GitBranch, 
  Play, 
  Blocks, 
  Terminal, 
  Settings, 
  User 
} from 'lucide-react';
import { UserProfile } from '../../types';

export type SidebarView = 'explorer' | 'search' | 'source-control' | 'run-debug' | 'extensions';

interface ActivityBarProps {
  activeView: SidebarView;
  isSidebarVisible: boolean;
  onSelectView: (view: SidebarView) => void;
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
  isSidebarVisible,
  onSelectView,
  isTerminalOpen,
  onToggleTerminal,
  onOpenSettings,
  onOpenAccountModal,
  user,
  installedExtensionsCount
}) => {
  const handleItemClick = (view: SidebarView) => {
    onSelectView(view);
  };

  const navItems: { id: SidebarView; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: 'explorer', label: 'Explorer (Files)', icon: <Files className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { id: 'search', label: 'Search Workspace', icon: <Search className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { id: 'source-control', label: 'Source Control (Git)', icon: <GitBranch className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { id: 'run-debug', label: 'Run & Debug', icon: <Play className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { 
      id: 'extensions', 
      label: 'Extensions (Open VSX)', 
      icon: <Blocks className="w-[18px] h-[18px] stroke-[1.7]" />, 
      badge: installedExtensionsCount > 0 
    }
  ];

  return (
    <div className="w-[52px] h-full flex flex-col justify-between apple-glass-sidebar border-r border-white/[0.08] select-none shrink-0 z-20 py-2">
      {/* Top action icons: Apple macOS Pro Navigation */}
      <div className="flex flex-col items-center gap-1.5 px-1.5">
        {navItems.map((item) => {
          const isActive = activeView === item.id && isSidebarVisible;
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => handleItemClick(item.id)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all relative cursor-pointer apple-interactive ${
                isActive
                  ? 'bg-white/[0.14] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.18)]'
                  : 'text-white/55 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              {item.icon}
              {isActive && (
                <span className="absolute -left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF]" />
              )}
              {item.badge && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#0A84FF] shadow-[0_0_6px_#0A84FF]" />
              )}
            </button>
          );
        })}

        {/* Integrated Terminal Toggle */}
        <div className="w-5 h-[1px] bg-white/[0.08] my-1" />
        <button
          title="Toggle Terminal (`)"
          onClick={onToggleTerminal}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer apple-interactive ${
            isTerminalOpen
              ? 'bg-white/[0.14] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]'
              : 'text-white/55 hover:text-white hover:bg-white/[0.07]'
          }`}
        >
          <Terminal className="w-[18px] h-[18px] stroke-[1.7]" />
        </button>
      </div>

      {/* Bottom action icons: Account & Settings */}
      <div className="flex flex-col items-center gap-1.5 px-1.5">
        {/* User Account / Profile */}
        <button
          title={user.isLoggedIn ? `Account: ${user.name} (${user.provider})` : "Sign In with Google or GitHub"}
          onClick={onOpenAccountModal}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer apple-interactive"
        >
          {user.isLoggedIn && user.avatar ? (
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-6 h-6 rounded-full border border-white/20 object-cover shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#121316] bg-[#30D158]" />
            </div>
          ) : (
            <User className="w-[18px] h-[18px] stroke-[1.7]" />
          )}
        </button>

        {/* Settings */}
        <button
          title="Manage AI Settings & Keys"
          onClick={onOpenSettings}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/[0.07] transition-all cursor-pointer apple-interactive"
        >
          <Settings className="w-[18px] h-[18px] stroke-[1.7]" />
        </button>
      </div>
    </div>
  );
};
