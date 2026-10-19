import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  FileCode, 
  Sparkles, 
  Plus, 
  Blocks, 
  User, 
  Bot,
  AppWindow,
  FolderOpen,
  FolderPlus
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onToggleTerminal: () => void;
  onOpenSettings: () => void;
  onRunBothAgents: () => void;
  onSaveFile: () => void;
  onOpenExtensions?: () => void;
  onOpenAccount?: () => void;
  onOpenAddAgent?: () => void;
  onNewWindow?: () => void;
  onOpenProject?: () => void;
  onCreateProject?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewFile,
  onToggleTerminal,
  onOpenSettings,
  onRunBothAgents,
  onSaveFile,
  onOpenExtensions,
  onOpenAccount,
  onOpenAddAgent,
  onNewWindow,
  onOpenProject,
  onCreateProject
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    ...(onNewWindow ? [{
      id: 'new-window',
      title: 'Window: New Window',
      subtitle: 'Open a new independent BlackHat IDE window',
      icon: <AppWindow className="w-4 h-4 text-[#0A84FF]" />,
      action: onNewWindow
    }] : []),
    ...(onOpenProject ? [{
      id: 'open-project',
      title: 'File: Open Folder / Project...',
      subtitle: 'Open an existing workspace folder in current or new window',
      icon: <FolderOpen className="w-4 h-4 text-[#FF9F0A]" />,
      action: onOpenProject
    }] : []),
    ...(onCreateProject ? [{
      id: 'create-project',
      title: 'File: Create New Project...',
      subtitle: 'Scaffold TypeScript, Python, or Node project template',
      icon: <FolderPlus className="w-4 h-4 text-[#30D158]" />,
      action: onCreateProject
    }] : []),
    {
      id: 'run-all-agents',
      title: 'Run Architect, Developer & Tester',
      subtitle: 'Dispatch parallel reasoning, implementation, and test workflows',
      icon: <Sparkles className="w-4 h-4 text-[#30D158]" />,
      action: onRunBothAgents
    },
    {
      id: 'open-extensions',
      title: 'Extensions: Show Extensions',
      subtitle: 'Browse installed and marketplace extensions',
      icon: <Blocks className="w-4 h-4 text-[#0A84FF]" />,
      action: () => onOpenExtensions && onOpenExtensions()
    },
    {
      id: 'open-account',
      title: 'Accounts: Manage Subscriptions & Login',
      subtitle: 'Google, GitHub, Gemini, Claude, and Codex accounts',
      icon: <User className="w-4 h-4 text-[#BF5AF2]" />,
      action: () => onOpenAccount && onOpenAccount()
    },
    {
      id: 'add-agent',
      title: 'Agents: Create Custom Agent',
      subtitle: 'Add a new specialist agent with custom system prompt',
      icon: <Bot className="w-4 h-4 text-[#5E5CE6]" />,
      action: () => onOpenAddAgent && onOpenAddAgent()
    },
    {
      id: 'save-file',
      title: 'File: Save',
      subtitle: 'Save active document to disk',
      icon: <FileCode className="w-4 h-4 text-[#0A84FF]" />,
      action: onSaveFile
    },
    {
      id: 'toggle-terminal',
      title: 'View: Toggle Terminal',
      subtitle: 'Show or hide integrated terminal',
      icon: <Terminal className="w-4 h-4 text-[#FF9F0A]" />,
      action: onToggleTerminal
    },
    {
      id: 'new-file',
      title: 'File: New File',
      subtitle: 'Create a new file in workspace',
      icon: <Plus className="w-4 h-4 text-[#30D158]" />,
      action: onNewFile
    },
    {
      id: 'open-settings',
      title: 'Preferences: AI Settings',
      subtitle: 'Configure API keys and model parameters',
      icon: <Search className="w-4 h-4 text-white/50" />,
      action: onOpenSettings
    }
  ];

  const filtered = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/55 backdrop-blur-xl select-none p-4 transition-all duration-200"
    >
      {/* Apple Spotlight Modal Card */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#1c1e24]/92 backdrop-blur-2xl border border-white/[0.14] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden flex flex-col font-sans apple-specular-top animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Spotlight Search Header */}
        <div className="h-12 px-4 flex items-center gap-3 border-b border-white/[0.08] bg-transparent">
          <Search className="w-4 h-4 text-white/45 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Spotlight — Type a command, file, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-[14px] font-medium tracking-tight text-white placeholder-white/35 focus:outline-none"
          />
          <kbd className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.1] text-[10px] text-white/60 font-mono">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="max-h-76 overflow-y-auto p-1.5 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-xs text-white/40">
              No matching commands or actions
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`px-3 py-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-all apple-interactive-subtle ${
                  idx === selectedIndex 
                    ? 'bg-[#0A84FF] text-white shadow-[0_2px_10px_rgba(10,132,255,0.35)]' 
                    : 'text-white/80 hover:bg-white/[0.06]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg ${idx === selectedIndex ? 'bg-white/20 text-white' : 'bg-white/[0.06]'}`}>
                    {cmd.icon}
                  </div>
                  <div className="truncate">
                    <div className="font-medium text-[13px] tracking-tight truncate">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className={`text-[11px] truncate ${idx === selectedIndex ? 'text-white/80' : 'text-white/45'}`}>
                        {cmd.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-[11px] font-mono shrink-0 ml-2 px-1.5 py-0.5 rounded ${idx === selectedIndex ? 'text-white bg-white/20' : 'text-white/35'}`}>
                  ↵
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
