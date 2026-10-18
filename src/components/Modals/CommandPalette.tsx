import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  FileCode, 
  Sparkles, 
  Plus, 
  Blocks, 
  User, 
  Bot
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
  onOpenAddAgent
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'run-all-agents',
      title: 'Run Architect, Developer & Tester',
      subtitle: 'Dispatch parallel reasoning, implementation, and test workflows',
      icon: <Sparkles className="w-4 h-4 text-[#3fb950]" />,
      action: onRunBothAgents
    },
    {
      id: 'open-extensions',
      title: 'Extensions: Show Extensions',
      subtitle: 'Browse installed and marketplace extensions',
      icon: <Blocks className="w-4 h-4 text-[#58a6ff]" />,
      action: () => onOpenExtensions && onOpenExtensions()
    },
    {
      id: 'open-account',
      title: 'Accounts: Manage Subscriptions & Login',
      subtitle: 'Google, GitHub, Gemini, Claude, and Codex accounts',
      icon: <User className="w-4 h-4 text-[#bc8cff]" />,
      action: () => onOpenAccount && onOpenAccount()
    },
    {
      id: 'add-agent',
      title: 'Agents: Create Custom Agent',
      subtitle: 'Add a new specialist agent with custom system prompt',
      icon: <Bot className="w-4 h-4 text-[#818cf8]" />,
      action: () => onOpenAddAgent && onOpenAddAgent()
    },
    {
      id: 'save-file',
      title: 'File: Save',
      subtitle: 'Save active document to disk',
      icon: <FileCode className="w-4 h-4 text-[#58a6ff]" />,
      action: onSaveFile
    },
    {
      id: 'toggle-terminal',
      title: 'View: Toggle Terminal',
      subtitle: 'Show or hide integrated terminal',
      icon: <Terminal className="w-4 h-4 text-[#d29922]" />,
      action: onToggleTerminal
    },
    {
      id: 'new-file',
      title: 'File: New File',
      subtitle: 'Create a new file in workspace',
      icon: <Plus className="w-4 h-4 text-[#3fb950]" />,
      action: onNewFile
    },
    {
      id: 'open-settings',
      title: 'Preferences: AI Settings',
      subtitle: 'Configure API keys and model parameters',
      icon: <Search className="w-4 h-4 text-[#858585]" />,
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-[2px] select-none p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#1e1e1e] border border-[#333333] rounded-lg shadow-2xl overflow-hidden flex flex-col font-sans"
      >
        {/* Input */}
        <div className="h-10 px-3 flex items-center gap-2 border-b border-[#2b2b2b] bg-[#1e1e1e]">
          <Search className="w-4 h-4 text-[#858585]" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-white placeholder-[#666666] focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-[#252525] border border-[#333333] text-[10px] text-[#858585] font-mono">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-72 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#858585]">
              No commands found
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`px-3 py-1.5 rounded flex items-center justify-between cursor-pointer text-xs transition-colors ${
                  idx === selectedIndex 
                    ? 'bg-[#0078d4] text-white' 
                    : 'text-[#cccccc] hover:bg-[rgba(255,255,255,0.04)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0">
                    {cmd.icon}
                  </div>
                  <div className="truncate">
                    <div className="font-normal truncate">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className={`text-[10px] truncate ${idx === selectedIndex ? 'text-white/80' : 'text-[#858585]'}`}>
                        {cmd.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-mono shrink-0 ml-2 ${idx === selectedIndex ? 'text-white/80' : 'text-[#858585]'}`}>
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
