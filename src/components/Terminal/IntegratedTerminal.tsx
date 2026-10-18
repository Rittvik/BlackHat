import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Play, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { TerminalEntry } from '../../types';

interface IntegratedTerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  entries: TerminalEntry[];
  onRunCommand: (command: string) => Promise<void>;
  onClear: () => void;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  isOpen,
  onToggle,
  entries,
  onRunCommand,
  onClear,
}) => {
  const [commandInput, setCommandInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || isRunning) return;
    const cmd = commandInput.trim();
    setCommandInput('');
    setIsRunning(true);
    try {
      await onRunCommand(cmd);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className={`flex flex-col bg-ide-darkest border-t border-ide-border transition-all duration-200 ${isOpen ? 'h-64' : 'h-8'}`}>
      {/* Terminal Title Bar */}
      <div 
        onClick={onToggle}
        className="h-8 px-3 flex items-center justify-between bg-ide-sidebar border-b border-ide-border cursor-pointer select-none text-xs text-ide-muted"
      >
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-ide-emerald" />
          <span className="font-semibold text-ide-text uppercase tracking-wider text-[11px]">Integrated Terminal (zsh)</span>
          {entries.length > 0 && (
            <span className="px-1.5 py-0.2 bg-ide-panel rounded text-[10px] text-ide-muted font-mono">
              {entries.length} commands
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] mr-2">
            <button
              onClick={(e) => { e.stopPropagation(); onRunCommand('git status --short'); }}
              className="px-1.5 py-0.5 bg-ide-card hover:bg-ide-hover rounded border border-ide-border text-ide-muted hover:text-white"
            >
              git status
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRunCommand('ls -la'); }}
              className="px-1.5 py-0.5 bg-ide-card hover:bg-ide-hover rounded border border-ide-border text-ide-muted hover:text-white"
            >
              ls -la
            </button>
          </div>
          <button 
            title="Clear Terminal"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="p-1 hover:text-white text-ide-muted hover:bg-ide-hover rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Terminal Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 bg-ide-darkest font-mono text-xs">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {entries.length === 0 ? (
              <div className="text-ide-muted/60 text-xs">
                Antigravity Terminal ready. Run build commands, git operations, or inspect scripts.
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-ide-muted">
                    <span className="text-ide-cyan">➜</span>
                    <span className="text-ide-accent font-semibold">~/BlackHat</span>
                    <span className="text-white font-medium">{entry.command}</span>
                    <span className={`text-[10px] px-1 rounded ${entry.exitCode === 0 ? 'text-ide-emerald' : 'text-ide-rose'}`}>
                      {entry.exitCode === 0 ? '✓' : `exit ${entry.exitCode}`}
                    </span>
                  </div>
                  {entry.stdout && (
                    <pre className="text-ide-text/90 whitespace-pre-wrap pl-4 border-l border-ide-border/50 text-[11px] leading-relaxed">
                      {entry.stdout}
                    </pre>
                  )}
                  {entry.stderr && (
                    <pre className="text-ide-rose whitespace-pre-wrap pl-4 border-l border-ide-rose/50 text-[11px] leading-relaxed">
                      {entry.stderr}
                    </pre>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Terminal Input Box */}
          <form onSubmit={handleSubmit} className="h-8 px-3 flex items-center gap-2 bg-ide-sidebar border-t border-ide-border">
            <span className="text-ide-cyan text-xs">➜</span>
            <input
              type="text"
              placeholder={isRunning ? "Running command..." : "Type shell command and press Enter..."}
              value={commandInput}
              disabled={isRunning}
              onChange={(e) => setCommandInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-ide-muted/50"
            />
            <button 
              type="submit" 
              disabled={isRunning || !commandInput.trim()}
              className="px-2 py-0.5 text-[10px] bg-ide-accent hover:bg-ide-accentHover disabled:opacity-40 text-white rounded font-sans flex items-center gap-1"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              Run
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
