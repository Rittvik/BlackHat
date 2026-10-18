import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Terminal, 
  FileCode, 
  Play, 
  Sparkles, 
  X, 
  Plus, 
  Blocks, 
  User, 
  Share2,
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
      title: 'Run Architect, Developer & Tester Concurrently',
      subtitle: 'Dispatch parallel reasoning, code implementation, and testing workflows',
      icon: <Sparkles className="w-4 h-4 text-ide-emerald" />,
      action: onRunBothAgents
    },
    {
      id: 'open-extensions',
      title: 'Open Extensions Store & Marketplace',
      subtitle: 'Browse AI companions, language servers, themes, and reverse engineering tools',
      icon: <Blocks className="w-4 h-4 text-ide-accent" />,
      action: () => onOpenExtensions && onOpenExtensions()
    },
    {
      id: 'open-account',
      title: 'Accounts & AI Subscriptions',
      subtitle: 'Google / GitHub login and Gemini, Claude, Codex subscription management',
      icon: <User className="w-4 h-4 text-ide-cyan" />,
      action: () => onOpenAccount && onOpenAccount()
    },
    {
      id: 'add-agent',
      title: 'Create New Custom Agent',
      subtitle: 'Add DevOps, Security Auditor, or specialized role agents to the studio',
      icon: <Bot className="w-4 h-4 text-ide-purple" />,
      action: () => onOpenAddAgent && onOpenAddAgent()
    },
    {
      id: 'save-file',
      title: 'Save Active File',
      subtitle: 'Write changes to disk (Cmd + S)',
      icon: <FileCode className="w-4 h-4 text-ide-cyan" />,
      action: onSaveFile
    },
    {
      id: 'toggle-terminal',
      title: 'Toggle Integrated Terminal',
      subtitle: 'Open or collapse bottom shell',
      icon: <Terminal className="w-4 h-4 text-ide-amber" />,
      action: onToggleTerminal
    },
    {
      id: 'new-file',
      title: 'Create New File in Workspace',
      subtitle: 'Add a new file to the project',
      icon: <Plus className="w-4 h-4 text-ide-purple" />,
      action: onNewFile
    },
    {
      id: 'open-settings',
      title: 'Configure AI Models & Keys',
      subtitle: 'Set Gemini, Anthropic, OpenAI, or Ollama credentials',
      icon: <Search className="w-4 h-4 text-ide-accent" />,
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
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-lg bg-ide-sidebar border border-ide-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input */}
        <div className="h-12 px-3.5 flex items-center gap-2 border-b border-ide-border bg-ide-panel">
          <Search className="w-4 h-4 text-ide-muted" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or action (e.g. 'extensions', 'account', 'run all', 'save')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-xs text-white placeholder-ide-muted/50 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-ide-card border border-ide-border text-[10px] text-ide-muted font-mono">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-xs text-ide-muted">
              No matching commands
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer text-xs transition-colors ${
                  idx === selectedIndex 
                    ? 'bg-ide-accent text-white font-medium' 
                    : 'text-ide-text hover:bg-ide-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-md ${idx === selectedIndex ? 'bg-white/20' : 'bg-ide-darkest border border-ide-border'}`}>
                    {cmd.icon}
                  </div>
                  <div>
                    <div className="font-medium">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className={`text-[10px] ${idx === selectedIndex ? 'text-white/80' : 'text-ide-muted'}`}>
                        {cmd.subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-mono ${idx === selectedIndex ? 'text-white/80' : 'text-ide-muted'}`}>
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
