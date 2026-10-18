import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Trash2, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Terminal as TerminalIcon, 
  AlertCircle, 
  FileText, 
  Bug, 
  Network, 
  Plus, 
  ExternalLink, 
  Filter, 
  CheckCircle2, 
  RotateCw,
  Folder,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { TerminalEntry } from '../../types';

export type BottomPanelTab = 'problems' | 'output' | 'debug' | 'terminal' | 'ports';

interface ForwardedPort {
  id: string;
  port: number;
  protocol: string;
  processName: string;
  forwardedAddress: string;
  status: 'Running' | 'Closed';
}

interface IntegratedTerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  entries: TerminalEntry[];
  onRunCommand: (command: string, cwd?: string) => Promise<any>;
  onClear: () => void;
  terminalCwd: string;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  isOpen,
  onToggle,
  onClose,
  entries,
  onRunCommand,
  onClear,
  terminalCwd,
}) => {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('terminal');
  const [commandInput, setCommandInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [activeSession, setActiveSession] = useState<string>('1: zsh');
  const [terminalSessions, setTerminalSessions] = useState<string[]>(['1: zsh']);
  
  // Resizable panel height
  const [panelHeight, setPanelHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('blackhat_terminal_height');
      return saved ? Math.max(140, Math.min(650, parseInt(saved, 10))) : 260;
    } catch {
      return 260;
    }
  });
  const isDraggingRef = useRef(false);

  // Output channels
  const [outputChannel, setOutputChannel] = useState<'server' | 'git' | 'tasks' | 'extension'>('server');
  const [outputLogs, setOutputLogs] = useState<{ [key: string]: string[] }>({
    server: [
      '[BlackHat Server] Initialized on http://127.0.0.1:3001',
      '[BlackHat Server] WebSocket live event bus connected',
      '[BlackHat Server] Workspace root initialized',
      '[BlackHat Server] Ready for inter-agent context broadcast'
    ],
    git: [
      '[Git] On branch main',
      '[Git] Remote tracking: origin/main (up to date)',
      '[Git] Working tree clean'
    ],
    tasks: [
      '[Tasks: dev] vite v6.4.4 dev server running at:',
      '[Tasks: dev] > Local:   http://localhost:5173/',
      '[Tasks: dev] > Network: use --host to expose',
      '[Tasks: dev] ready in 312ms.'
    ],
    extension: [
      '[Extension Host] Open VSX Registry provider mounted',
      '[Extension Host] 8 default extensions loaded and verified'
    ]
  });

  // Debug Console REPL state
  const [debugInput, setDebugInput] = useState('');
  const [debugLogs, setDebugLogs] = useState<Array<{ id: string; type: 'input' | 'output' | 'error'; text: string; time: string }>>([
    { id: '1', type: 'output', text: 'BlackHat Debug Console. Type JavaScript/TypeScript expressions to evaluate.', time: '01:00:00' }
  ]);

  // Forwarded ports
  const [forwardedPorts, setForwardedPorts] = useState<ForwardedPort[]>([
    {
      id: 'port-1',
      port: 3001,
      protocol: 'HTTP',
      processName: 'node (BlackHat Server)',
      forwardedAddress: 'http://localhost:3001',
      status: 'Running'
    },
    {
      id: 'port-2',
      port: 5173,
      protocol: 'HTTP',
      processName: 'vite (Development Server)',
      forwardedAddress: 'http://localhost:5173',
      status: 'Running'
    }
  ]);
  const [newPortInput, setNewPortInput] = useState('');

  // Problems filter
  const [problemFilter, setProblemFilter] = useState('');

  const terminalBottomRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const debugBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'terminal') {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'debug') {
      debugBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [debugLogs, isOpen, activeTab]);

  // Drag resizer for height
  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newHeight = Math.max(140, Math.min(650, window.innerHeight - moveEvent.clientY));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setPanelHeight(h => {
        localStorage.setItem('blackhat_terminal_height', h.toString());
        return h;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Terminal submit handler
  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd || isRunning) return;

    setCommandInput('');
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd === 'clear') {
      onClear();
      return;
    }

    setIsRunning(true);
    try {
      await onRunCommand(cmd, terminalCwd);
    } finally {
      setIsRunning(false);
      setTimeout(() => {
        terminalInputRef.current?.focus();
      }, 50);
    }
  };

  // Keyboard navigation for history
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setCommandInput(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= commandHistory.length) {
        setHistoryIndex(-1);
        setCommandInput('');
      } else {
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[nextIdx]);
      }
    }
  };

  // Debug REPL submit
  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expr = debugInput.trim();
    if (!expr) return;

    const time = new Date().toLocaleTimeString();
    setDebugInput('');

    try {
      // Evaluate expression
      const fn = new Function(`"use strict"; return (${expr});`);
      const result = fn();
      let formatted = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      if (result === undefined) formatted = 'undefined';

      setDebugLogs(prev => [
        ...prev,
        { id: `dbg_in_${Date.now()}`, type: 'input', text: expr, time },
        { id: `dbg_out_${Date.now() + 1}`, type: 'output', text: formatted, time }
      ]);
    } catch (err: any) {
      setDebugLogs(prev => [
        ...prev,
        { id: `dbg_in_${Date.now()}`, type: 'input', text: expr, time },
        { id: `dbg_err_${Date.now() + 1}`, type: 'error', text: err.message || 'Evaluation Error', time }
      ]);
    }
  };

  // Add new forwarded port
  const handleAddPort = (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(newPortInput.trim(), 10);
    if (!portNum || isNaN(portNum)) return;

    const newPort: ForwardedPort = {
      id: `port-${Date.now()}`,
      port: portNum,
      protocol: 'HTTP',
      processName: `custom-service (${portNum})`,
      forwardedAddress: `http://localhost:${portNum}`,
      status: 'Running'
    };
    setForwardedPorts(prev => [...prev, newPort]);
    setNewPortInput('');
  };

  const handleOpenPortUrl = (url: string) => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handleTabClick = (tab: BottomPanelTab) => {
    setActiveTab(tab);
    if (!isOpen) {
      onToggle();
    }
  };

  const handleAddTerminalSession = () => {
    const num = terminalSessions.length + 1;
    const sessionName = `${num}: zsh`;
    setTerminalSessions(prev => [...prev, sessionName]);
    setActiveSession(sessionName);
  };

  // Clean directory display for prompt
  const displayCwd = terminalCwd.replace(/^\/Users\/[^/]+/, '~');

  return (
    <div 
      className={`flex flex-col bg-[#141414] border-t border-[#2b2b2b] select-none relative transition-all duration-150 ${
        isOpen ? '' : 'h-[32px] shrink-0'
      }`}
      style={isOpen ? { height: `${panelHeight}px` } : undefined}
    >
      {/* Top Drag Resizer Handle */}
      {isOpen && (
        <div
          onMouseDown={handleStartResize}
          title="Drag to resize bottom panel"
          className="absolute top-0 left-0 right-0 h-[4px] -mt-[2px] cursor-row-resize hover:bg-[#0078d4] active:bg-[#0078d4] z-30 transition-colors"
        />
      )}

      {/* Panel Tab Header Bar */}
      <div className="h-[32px] px-2 flex items-center justify-between bg-[#181818] border-b border-[#282828] shrink-0 text-xs text-[#858585]">
        {/* Left Side: Standard VSCode/Antigravity Bottom Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar h-full">
          {/* PROBLEMS Tab */}
          <button
            onClick={() => handleTabClick('problems')}
            className={`h-full px-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${
              isOpen && activeTab === 'problems'
                ? 'border-[#0078d4] text-white bg-[#1e1e1e]'
                : 'border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#1c1c1c]'
            }`}
          >
            <span>PROBLEMS</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#252525] text-[#858585] font-mono">
              0
            </span>
          </button>

          {/* OUTPUT Tab */}
          <button
            onClick={() => handleTabClick('output')}
            className={`h-full px-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${
              isOpen && activeTab === 'output'
                ? 'border-[#0078d4] text-white bg-[#1e1e1e]'
                : 'border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#1c1c1c]'
            }`}
          >
            <span>OUTPUT</span>
          </button>

          {/* DEBUG CONSOLE Tab */}
          <button
            onClick={() => handleTabClick('debug')}
            className={`h-full px-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${
              isOpen && activeTab === 'debug'
                ? 'border-[#0078d4] text-white bg-[#1e1e1e]'
                : 'border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#1c1c1c]'
            }`}
          >
            <span>DEBUG CONSOLE</span>
          </button>

          {/* TERMINAL Tab */}
          <button
            onClick={() => handleTabClick('terminal')}
            className={`h-full px-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${
              isOpen && activeTab === 'terminal'
                ? 'border-[#0078d4] text-white bg-[#1e1e1e]'
                : 'border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#1c1c1c]'
            }`}
          >
            <TerminalIcon className="w-3 h-3 text-[#58a6ff]" />
            <span>TERMINAL</span>
          </button>

          {/* PORTS Tab */}
          <button
            onClick={() => handleTabClick('ports')}
            className={`h-full px-2.5 flex items-center gap-1.5 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${
              isOpen && activeTab === 'ports'
                ? 'border-[#0078d4] text-white bg-[#1e1e1e]'
                : 'border-transparent text-[#858585] hover:text-[#cccccc] hover:bg-[#1c1c1c]'
            }`}
          >
            <Network className="w-3 h-3 text-[#3fb950]" />
            <span>PORTS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
          </button>
        </div>

        {/* Right Side: Tab Context Controls */}
        <div className="flex items-center gap-1.5">
          {/* Terminal-specific shortcuts */}
          {isOpen && activeTab === 'terminal' && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] mr-1">
              {/* Terminal Session Selector */}
              <select
                value={activeSession}
                onChange={(e) => setActiveSession(e.target.value)}
                className="bg-[#222222] border border-[#333333] text-[#cccccc] rounded px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer"
              >
                {terminalSessions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Add New Session */}
              <button
                title="New Terminal Session"
                onClick={handleAddTerminalSession}
                className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>

              <button
                onClick={() => onRunCommand('git status --short', terminalCwd)}
                className="px-1.5 py-0.5 bg-[#222222] hover:bg-[#282828] rounded border border-[#2e2e2e] text-[#858585] hover:text-white font-mono"
              >
                git status
              </button>
              <button
                onClick={() => onRunCommand('ls -la', terminalCwd)}
                className="px-1.5 py-0.5 bg-[#222222] hover:bg-[#282828] rounded border border-[#2e2e2e] text-[#858585] hover:text-white font-mono"
              >
                ls -la
              </button>
            </div>
          )}

          {/* Output channel selector */}
          {isOpen && activeTab === 'output' && (
            <select
              value={outputChannel}
              onChange={(e) => setOutputChannel(e.target.value as any)}
              className="bg-[#222222] border border-[#333333] text-[#cccccc] rounded px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer mr-1"
            >
              <option value="server">BlackHat Server</option>
              <option value="git">Git</option>
              <option value="tasks">Tasks (Vite)</option>
              <option value="extension">Extension Host</option>
            </select>
          )}

          {/* Clear Button */}
          {isOpen && (
            <button 
              title={activeTab === 'terminal' ? "Clear Terminal" : activeTab === 'debug' ? "Clear Console" : "Clear Output"}
              onClick={() => {
                if (activeTab === 'terminal') onClear();
                else if (activeTab === 'debug') setDebugLogs([]);
                else setOutputLogs(prev => ({ ...prev, [outputChannel]: [] }));
              }}
              className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Collapse / Expand Toggle */}
          <button 
            title={isOpen ? "Collapse Panel" : "Expand Panel"}
            onClick={onToggle}
            className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
          >
            {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Close Panel */}
          {onClose && (
            <button 
              title="Close Panel"
              onClick={onClose}
              className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Body Content */}
      {isOpen && (
        <div className="flex-1 flex flex-col min-h-0 bg-[#121212] overflow-hidden font-sans">
          
          {/* TAB 1: TERMINAL (Interactive zsh Shell) */}
          {activeTab === 'terminal' && (
            <div 
              onClick={() => terminalInputRef.current?.focus()}
              className="flex-1 flex flex-col min-h-0 bg-[#0d1117] font-mono text-xs cursor-text"
            >
              {/* Output History Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 select-text font-mono">
                {/* Initial Terminal Banner */}
                <div className="text-[#6e7681] text-[11px] leading-relaxed mb-2 pb-2 border-b border-[#21262d]">
                  <div className="text-[#58a6ff] font-semibold flex items-center gap-1.5">
                    <span>BlackHat Integrated Terminal (zsh)</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">Active</span>
                  </div>
                  <div>Working Directory: <span className="text-[#cccccc]">{terminalCwd}</span></div>
                  <div>Type any command (`npm`, `git`, `python`, `node`, `cd`) or press `Ctrl+C` to interrupt.</div>
                </div>

                {/* Rendered Command Entries */}
                {entries.map((entry) => (
                  <div key={entry.id} className="space-y-1">
                    {/* Prompt Line */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="text-[#2ea043] font-bold">➜</span>
                      <span className="text-[#58a6ff] font-semibold">
                        {(entry.cwd || displayCwd).replace(/^\/Users\/[^/]+/, '~')}
                      </span>
                      <span className="text-[#d29922] text-[11px]">git:(<span className="text-[#f0883e]">main</span>)</span>
                      <span className="text-[#ffffff] font-medium">{entry.command}</span>
                      <span className={`text-[10px] px-1 rounded font-mono ${
                        entry.exitCode === 0 ? 'text-[#3fb950]' : 'text-[#f85149] bg-[#f85149]/10'
                      }`}>
                        {entry.exitCode === 0 ? '✓' : `exit ${entry.exitCode}`}
                      </span>
                    </div>

                    {/* Stdout */}
                    {entry.stdout && (
                      <pre className="text-[#c9d1d9] whitespace-pre-wrap pl-3.5 border-l-2 border-[#30363d] text-[11px] leading-relaxed font-mono">
                        {entry.stdout}
                      </pre>
                    )}

                    {/* Stderr */}
                    {entry.stderr && (
                      <pre className="text-[#f85149] whitespace-pre-wrap pl-3.5 border-l-2 border-[#f85149]/40 text-[11px] leading-relaxed font-mono">
                        {entry.stderr}
                      </pre>
                    )}
                  </div>
                ))}

                <div ref={terminalBottomRef} />
              </div>

              {/* Live Interactive Command Prompt Line */}
              <form 
                onSubmit={handleCommandSubmit}
                className="h-8 px-3 flex items-center gap-2 bg-[#161b22] border-t border-[#30363d] font-mono shrink-0"
              >
                <div className="flex items-center gap-1.5 shrink-0 select-none text-xs">
                  <span className="text-[#2ea043] font-bold">➜</span>
                  <span className="text-[#58a6ff] font-semibold">{displayCwd}</span>
                  <span className="text-[#d29922] text-[11px]">git:(<span className="text-[#f0883e]">main</span>)</span>
                  <span className="text-[#8b949e]">$</span>
                </div>

                <input
                  ref={terminalInputRef}
                  type="text"
                  autoFocus
                  value={commandInput}
                  disabled={isRunning}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRunning ? "Executing..." : ""}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none font-mono caret-[#58a6ff]"
                />

                {isRunning ? (
                  <span className="text-[10px] text-[#58a6ff] flex items-center gap-1 shrink-0 animate-pulse">
                    <RotateCw className="w-3 h-3 animate-spin" />
                    Running
                  </span>
                ) : (
                  <button 
                    type="submit" 
                    disabled={!commandInput.trim()}
                    className="px-2 py-0.5 text-[10px] bg-[#0078d4] hover:bg-[#026ec1] disabled:opacity-20 text-white rounded font-sans flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
                    <span>Run</span>
                  </button>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: PROBLEMS (Diagnostics & Linters) */}
          {activeTab === 'problems' && (
            <div className="flex-1 flex flex-col bg-[#141414] overflow-hidden text-xs">
              {/* Filter input */}
              <div className="h-8 px-3 flex items-center gap-2 bg-[#181818] border-b border-[#242424] shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#858585]" />
                <input
                  type="text"
                  placeholder="Filter problems (e.g. text, !exclude)..."
                  value={problemFilter}
                  onChange={(e) => setProblemFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-[#666666] focus:outline-none"
                />
              </div>

              {/* Problems list */}
              <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-[#858585]">
                <CheckCircle2 className="w-8 h-8 text-[#3fb950] mb-2 opacity-80" />
                <span className="font-semibold text-white mb-0.5">No problems have been detected in the workspace.</span>
                <span className="text-[11px] text-[#666666] max-w-sm">
                  TypeScript compiler, ESLint, and language servers report 0 errors and 0 warnings.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: OUTPUT (Multi-Channel Logs) */}
          {activeTab === 'output' && (
            <div className="flex-1 flex flex-col bg-[#121212] font-mono text-[11px] overflow-hidden select-text">
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {(outputLogs[outputChannel] || []).map((line, idx) => (
                  <div key={idx} className="text-[#cccccc] whitespace-pre-wrap leading-relaxed">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DEBUG CONSOLE (Interactive REPL) */}
          {activeTab === 'debug' && (
            <div className="flex-1 flex flex-col bg-[#141414] font-mono text-xs overflow-hidden select-text">
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {debugLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 text-xs">
                    <span className="text-[#666666] text-[10px] select-none shrink-0 font-mono mt-0.5">
                      [{log.time}]
                    </span>
                    {log.type === 'input' ? (
                      <div className="flex items-center gap-1.5 text-[#58a6ff] font-medium">
                        <span className="select-none font-bold">›</span>
                        <span>{log.text}</span>
                      </div>
                    ) : log.type === 'error' ? (
                      <div className="flex items-center gap-1.5 text-[#f85149]">
                        <span className="select-none font-bold">✕</span>
                        <span>{log.text}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#cccccc]">
                        <span className="select-none font-bold text-[#3fb950]">‹</span>
                        <pre className="whitespace-pre-wrap font-mono text-xs">{log.text}</pre>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={debugBottomRef} />
              </div>

              {/* Debug REPL input */}
              <form 
                onSubmit={handleDebugSubmit}
                className="h-8 px-3 flex items-center gap-2 bg-[#181818] border-t border-[#282828] shrink-0"
              >
                <span className="text-[#0078d4] font-bold select-none">›</span>
                <input
                  type="text"
                  placeholder="Evaluate expression in Debug Console (e.g. 2 + 2, Date.now())..."
                  value={debugInput}
                  onChange={(e) => setDebugInput(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-white focus:outline-none font-mono placeholder-[#666666]"
                />
              </form>
            </div>
          )}

          {/* TAB 5: PORTS (Port Forwarding & Active Servers) */}
          {activeTab === 'ports' && (
            <div className="flex-1 flex flex-col bg-[#141414] text-xs overflow-hidden">
              {/* Add Custom Port Bar */}
              <form onSubmit={handleAddPort} className="h-8 px-3 flex items-center gap-2 bg-[#181818] border-b border-[#282828] shrink-0">
                <span className="text-[11px] text-[#858585] font-medium">Forward a Port:</span>
                <input
                  type="number"
                  placeholder="e.g. 8080, 3000..."
                  value={newPortInput}
                  onChange={(e) => setNewPortInput(e.target.value)}
                  className="w-28 px-2 py-0.5 bg-[#111111] border border-[#333333] rounded text-white text-xs focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={!newPortInput.trim()}
                  className="px-2 py-0.5 bg-[#0078d4] hover:bg-[#026ec1] text-white rounded text-[11px] font-medium disabled:opacity-40 cursor-pointer"
                >
                  Forward Port
                </button>
              </form>

              {/* Ports Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#181818] border-b border-[#282828] text-[11px] text-[#858585] uppercase">
                      <th className="py-2 px-3 font-semibold">Port</th>
                      <th className="py-2 px-3 font-semibold">Protocol</th>
                      <th className="py-2 px-3 font-semibold">Process</th>
                      <th className="py-2 px-3 font-semibold">Local Address</th>
                      <th className="py-2 px-3 font-semibold">Status</th>
                      <th className="py-2 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forwardedPorts.map((p) => (
                      <tr key={p.id} className="border-b border-[#222222] hover:bg-[#1a1a1a] transition-colors">
                        <td className="py-2 px-3 font-mono text-[#58a6ff] font-semibold">
                          {p.port}
                        </td>
                        <td className="py-2 px-3 text-[#cccccc]">
                          {p.protocol}
                        </td>
                        <td className="py-2 px-3 text-white font-medium">
                          {p.processName}
                        </td>
                        <td className="py-2 px-3 font-mono text-[#cccccc]">
                          {p.forwardedAddress}
                        </td>
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1.5 text-[#3fb950] font-medium text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] animate-pulse" />
                            {p.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => handleOpenPortUrl(p.forwardedAddress)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#222222] hover:bg-[#282828] border border-[#333333] hover:border-[#444444] text-white text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <span>Open in Browser</span>
                            <ExternalLink className="w-3 h-3 text-[#58a6ff]" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
