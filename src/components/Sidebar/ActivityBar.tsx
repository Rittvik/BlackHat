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

export type SidebarView = 'explorer' | 'search' | 'source-control' | 'run-debug' | 'extensions' | 'codex';

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
  hasCodexInstalled?: boolean;
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
  installedExtensionsCount,
  hasCodexInstalled = true
}) => {
  const handleItemClick = (view: SidebarView) => {
    onSelectView(view);
  };

  const navItems: { id: SidebarView; label: string; icon: React.ReactNode; badge?: boolean; color?: string }[] = [
    { id: 'explorer', label: 'Explorer (Files)', icon: <Files className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { id: 'search', label: 'Search Workspace', icon: <Search className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { id: 'source-control', label: 'Source Control (Git)', icon: <GitBranch className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { id: 'run-debug', label: 'Run & Debug', icon: <Play className="w-[18px] h-[18px] stroke-[1.7]" /> },
    { 
      id: 'extensions', 
      label: 'Extensions (Open VSX)', 
      icon: <Blocks className="w-[18px] h-[18px] stroke-[1.7]" />, 
      badge: installedExtensionsCount > 0 
    },
    ...(hasCodexInstalled ? [{
      id: 'codex' as SidebarView,
      label: 'Codex – OpenAI Coding Agent',
      icon: (
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current text-[#10a37f]">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.5045 4.5045 0 0 1-4.4945 4.4947zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7866A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.0201-1.1635a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.4021-.6863zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.9071 9.2298V6.8974a.0662.0662 0 0 1 .0331-.0615l4.8778-2.8197a4.4992 4.4992 0 0 1 6.0461 1.689zM8.3444 8.7616l2.02-1.1683a.0804.0804 0 0 1 .071 0l4.8303 2.7866a4.504 4.504 0 0 1-2.3655 8.0805V12.721a.7664.7664 0 0 0-.3879-.6765L8.3444 8.7616z" />
        </svg>
      ),
      color: '#10a37f'
    }] : [])
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
                <span 
                  className="absolute -left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-r-full"
                  style={{ 
                    backgroundColor: item.color || '#0A84FF',
                    boxShadow: `0 0 8px ${item.color || '#0A84FF'}`
                  }}
                />
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
