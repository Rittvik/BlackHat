import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, 
  Check, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export interface TopMenuBarProps {
  onNewWindow?: () => void;
  onOpenProject?: () => void;
  onCreateProject?: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onSaveFile: () => void;
  onSaveAllFiles: () => void;
  onCloseActiveTab: () => void;
  onCloseAllTabs: () => void;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onOpenCommandPalette: () => void;
  onSelectView: (view: 'explorer' | 'search' | 'source-control' | 'run-debug' | 'extensions') => void;
  onToggleSidebar: () => void;
  onToggleTerminal: () => void;
  onToggleAgentStudio: () => void;
  onRunAllAgents: () => void;
  onRunDebugTarget: () => void;
}

interface MenuItem {
  label?: string;
  shortcut?: string;
  action?: () => void;
  separator?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  onNewWindow,
  onOpenProject,
  onCreateProject,
  onNewFile,
  onNewFolder,
  onSaveFile,
  onSaveAllFiles,
  onCloseActiveTab,
  onCloseAllTabs,
  onOpenSettings,
  onOpenAccount,
  onOpenCommandPalette,
  onSelectView,
  onToggleSidebar,
  onToggleTerminal,
  onToggleAgentStudio,
  onRunAllAgents,
  onRunDebugTarget
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };

    window.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Window', shortcut: '⇧⌘N', action: onNewWindow },
      { label: 'Open Folder / Project...', shortcut: '⌘O', action: onOpenProject },
      { label: 'Create New Project...', action: onCreateProject },
      { separator: true },
      { label: 'New Text File', shortcut: '⌘N', action: onNewFile },
      { label: 'New Folder...', action: onNewFolder },
      { separator: true },
      { label: 'Quick Open...', shortcut: '⌘P', action: onOpenCommandPalette },
      { separator: true },
      { label: 'Save', shortcut: '⌘S', action: onSaveFile },
      { label: 'Save All', shortcut: '⌥⌘S', action: onSaveAllFiles },
      { separator: true },
      { label: 'Close Editor', shortcut: '⌘W', action: onCloseActiveTab },
      { label: 'Close All Editors', action: onCloseAllTabs },
      { separator: true },
      { label: 'AI Settings & Keys...', shortcut: '⌘,', action: onOpenSettings },
      { label: 'Accounts & Subscriptions...', action: onOpenAccount }
    ],
    Edit: [
      { label: 'Undo', shortcut: '⌘Z', action: () => document.execCommand('undo') },
      { label: 'Redo', shortcut: '⇧⌘Z', action: () => document.execCommand('redo') },
      { separator: true },
      { label: 'Cut', shortcut: '⌘X', action: () => document.execCommand('cut') },
      { label: 'Copy', shortcut: '⌘C', action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: '⌘V', action: () => document.execCommand('paste') },
      { label: 'Select All', shortcut: '⌘A', action: () => document.execCommand('selectAll') },
      { separator: true },
      { label: 'Find in Files...', shortcut: '⇧⌘F', action: () => onSelectView('search') }
    ],
    Selection: [
      { label: 'Select All', shortcut: '⌘A', action: () => document.execCommand('selectAll') },
      { label: 'Expand Selection', shortcut: '⌃⇧→' },
      { label: 'Shrink Selection', shortcut: '⌃⇧←' }
    ],
    View: [
      { label: 'Command Palette...', shortcut: '⇧⌘P', action: onOpenCommandPalette },
      { separator: true },
      { label: 'Explorer', shortcut: '⇧⌘E', action: () => onSelectView('explorer') },
      { label: 'Search', shortcut: '⇧⌘F', action: () => onSelectView('search') },
      { label: 'Source Control (Git)', shortcut: '⇧⌘G', action: () => onSelectView('source-control') },
      { label: 'Run and Debug', shortcut: '⇧⌘D', action: () => onSelectView('run-debug') },
      { label: 'Extensions (Open VSX)', shortcut: '⇧⌘X', action: () => onSelectView('extensions') },
      { separator: true },
      { label: 'Toggle Primary SideBar', shortcut: '⌘B', action: onToggleSidebar },
      { label: 'Toggle Agent Studio', shortcut: '⌥⌘B', action: onToggleAgentStudio },
      { label: 'Toggle Integrated Terminal', shortcut: '⌃`', action: onToggleTerminal }
    ],
    Go: [
      { label: 'Go to File...', shortcut: '⌘P', action: onOpenCommandPalette },
      { separator: true },
      { label: 'Next Editor Tab', shortcut: '⌃Tab' },
      { label: 'Previous Editor Tab', shortcut: '⌃⇧Tab' }
    ],
    Run: [
      { label: 'Start Debugging / Run Target', shortcut: 'F5', action: onRunDebugTarget },
      { label: 'Open Run & Debug Panel', shortcut: '⇧⌘D', action: () => onSelectView('run-debug') },
      { separator: true },
      { label: '⚡ Run All AI Agents Concurrently', shortcut: '⇧⌘R', action: onRunAllAgents }
    ],
    Terminal: [
      { label: 'New Terminal', shortcut: '⌃⇧`', action: onToggleTerminal },
      { label: 'Toggle Terminal Panel', shortcut: '⌃`', action: onToggleTerminal }
    ],
    Help: [
      { label: 'BlackHat GitHub Documentation', action: () => window.open('https://github.com/Rittvik/BlackHat', '_blank') },
      { label: 'Open VSX Marketplace', action: () => window.open('https://open-vsx.org', '_blank') },
      { separator: true },
      { label: 'Keyboard Shortcuts (Command Palette)', shortcut: '⌘P', action: onOpenCommandPalette },
      { label: 'Configure AI Subscriptions...', action: onOpenAccount }
    ]
  };

  const handleMenuClick = (title: string) => {
    setActiveMenu(prev => prev === title ? null : title);
  };

  const handleMouseEnter = (title: string) => {
    if (activeMenu) {
      setActiveMenu(title);
    }
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.action) {
      item.action();
    }
    setActiveMenu(null);
  };

  return (
    <div ref={containerRef} className="flex items-center gap-0.5 select-none relative z-40 text-xs font-sans">
      {Object.entries(menus).map(([title, items]) => {
        const isOpen = activeMenu === title;
        return (
          <div key={title} className="relative">
            <button
              onClick={() => handleMenuClick(title)}
              onMouseEnter={() => handleMouseEnter(title)}
              className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-all cursor-pointer apple-interactive-subtle ${
                isOpen
                  ? 'bg-white/[0.12] text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.07]'
              }`}
            >
              {title}
            </button>

            {/* Apple macOS Frosted Glass Dropdown Menu */}
            {isOpen && (
              <div 
                className="absolute top-full left-0 mt-1.5 min-w-[230px] bg-[#1c1e24]/90 backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-[0_20px_48px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)] p-1 text-[12px] text-white/90 select-none z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div>
                  {items.map((item, idx) => {
                    if (item.separator) {
                      return <div key={idx} className="h-[1px] bg-white/[0.08] my-1 mx-2" />;
                    }
                    return (
                      <button
                        key={idx}
                        onClick={() => handleItemClick(item)}
                        disabled={item.disabled}
                        className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-left transition-all apple-interactive-subtle ${
                          item.disabled
                            ? 'opacity-35 cursor-not-allowed'
                            : item.danger
                              ? 'hover:bg-red-500/20 hover:text-red-400 text-red-400'
                              : 'hover:bg-[#0A84FF] hover:text-white text-white/90'
                        }`}
                      >
                        <span className="truncate font-normal">{item.label}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-white/40 group-hover:text-white/80 font-mono ml-3 shrink-0 tracking-wide">
                            {item.shortcut}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
