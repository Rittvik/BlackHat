import React, { useState, useRef, useEffect } from 'react';
import { Play, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
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
    <div className={`flex flex-col bg-[#181818] border-t border-[#2b2b2b] select-none transition-all duration-150 ${isOpen ? 'h-64' : 'h-[30px]'}`}>
      {/* Terminal Title Bar */}
      <div 
        onClick={onToggle}
        className="h-[30px] px-3 flex items-center justify-between bg-[#181818] border-b border-[#2b2b2b] cursor-pointer text-xs text-[#858585]"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[11px] font-medium text-white border-b-2 border-[#0078d4] h-[30px] px-1">
            <span>TERMINAL</span>
          </div>
          <div className="text-[11px] font-normal text-[#858585] hover:text-[#cccccc] transition-colors">
            <span>OUTPUT</span>
          </div>
          <div className="text-[11px] font-normal text-[#858585] hover:text-[#cccccc] transition-colors">
            <span>PROBLEMS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] mr-2">
            <button
              onClick={(e) => { e.stopPropagation(); onRunCommand('git status --short'); }}
              className="px-1.5 py-0.5 bg-[#222222] hover:bg-[#282828] rounded border border-[#2e2e2e] text-[#858585] hover:text-white"
            >
              git status
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onRunCommand('ls -la'); }}
              className="px-1.5 py-0.5 bg-[#222222] hover:bg-[#282828] rounded border border-[#2e2e2e] text-[#858585] hover:text-white"
            >
              ls -la
            </button>
          </div>
          <button 
            title="Clear Terminal"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button 
            title={isOpen ? "Collapse Terminal" : "Expand Terminal"}
            className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#141414] font-mono text-xs">
          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text">
            {entries.length === 0 ? (
              <div className="text-[#666666] text-xs">
                Antigravity Terminal ready (zsh). Run shell commands, tests, or inspection scripts.
              </div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="space-y-1">
                  <div className="flex items-center gap-2 text-[#858585]">
                    <span className="text-[#58a6ff]">➜</span>
                    <span className="text-[#cccccc] font-medium">{entry.command}</span>
                    <span className={`text-[10px] px-1 rounded ${entry.exitCode === 0 ? 'text-[#3fb950]' : 'text-[#f85149]'}`}>
                      {entry.exitCode === 0 ? '✓' : `exit ${entry.exitCode}`}
                    </span>
                  </div>
                  {entry.stdout && (
                    <pre className="text-[#cccccc] whitespace-pre-wrap pl-3 border-l border-[#2e2e2e] text-[11px] leading-relaxed">
                      {entry.stdout}
                    </pre>
                  )}
                  {entry.stderr && (
                    <pre className="text-[#f85149] whitespace-pre-wrap pl-3 border-l border-[#f85149]/40 text-[11px] leading-relaxed">
                      {entry.stderr}
                    </pre>
                  )}
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Terminal Input Box */}
          <form onSubmit={handleSubmit} className="h-8 px-3 flex items-center gap-2 bg-[#181818] border-t border-[#2b2b2b]">
            <span className="text-[#58a6ff] text-xs">➜</span>
            <input
              type="text"
              placeholder={isRunning ? "Running command..." : "Type command and press Enter..."}
              value={commandInput}
              disabled={isRunning}
              onChange={(e) => setCommandInput(e.target.value)}
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder-[#666666]"
            />
            <button 
              type="submit" 
              disabled={isRunning || !commandInput.trim()}
              className="px-2 py-0.5 text-[10px] bg-[#0078d4] hover:bg-[#026ec1] disabled:opacity-30 text-white rounded font-sans flex items-center gap-1"
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
