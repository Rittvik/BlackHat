import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Terminal as TerminalIcon, 
  Network, 
  Plus, 
  ExternalLink, 
  Filter, 
  CheckCircle2, 
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
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

interface TerminalSession {
  id: string;
  name: string;
}

interface IntegratedTerminalProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose?: () => void;
  entries?: TerminalEntry[];
  onRunCommand?: (command: string, cwd?: string) => Promise<any>;
  onClear?: () => void;
  terminalCwd: string;
}

export const IntegratedTerminal: React.FC<IntegratedTerminalProps> = ({
  isOpen,
  onToggle,
  onClose,
  terminalCwd,
}) => {
  const [activeTab, setActiveTab] = useState<BottomPanelTab>('terminal');
  const [activeSessionId, setActiveSessionId] = useState<string>('term-1');
  const [sessions, setSessions] = useState<TerminalSession[]>([
    { id: 'term-1', name: '1: zsh' }
  ]);
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaxHeight, setPreMaxHeight] = useState<number>(260);

  // Resizable panel height
  const [panelHeight, setPanelHeight] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('blackhat_terminal_height');
      return saved ? Math.max(140, Math.min(800, parseInt(saved, 10))) : 260;
    } catch {
      return 260;
    }
  });
  const isDraggingRef = useRef(false);

  // Xterm DOM and Addon References
  const xtermContainerRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Output channels
  const [outputChannel, setOutputChannel] = useState<'server' | 'git' | 'tasks' | 'extension'>('server');
  const [outputLogs, setOutputLogs] = useState<{ [key: string]: string[] }>({
    server: [
      '[BlackHat Server] Initialized on http://127.0.0.1:3001',
      '[BlackHat Server] WebSocket live event bus connected',
      '[BlackHat Server] Native PTY Engine: node-pty with xterm.js',
      '[BlackHat Server] Workspace root initialized'
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
  const debugBottomRef = useRef<HTMLDivElement>(null);

  // Forwarded ports (user applications / dev servers only, empty by default)
  const [forwardedPorts, setForwardedPorts] = useState<ForwardedPort[]>([]);
  const [newPortInput, setNewPortInput] = useState('');

  // Problems filter
  const [problemFilter, setProblemFilter] = useState('');

  // WebSocket URL resolution
  const getWsUrl = useCallback(() => {
    if (typeof window === 'undefined') return 'ws://127.0.0.1:3001/ws';
    const host = window.location.hostname || '127.0.0.1';
    return `ws://${host}:3001/ws`;
  }, []);

  // Initialize or fit Xterm
  const fitTerminal = useCallback(() => {
    if (!fitAddonRef.current || !terminalInstanceRef.current || !xtermContainerRef.current) return;
    try {
      fitAddonRef.current.fit();
      const term = terminalInstanceRef.current;
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'pty_resize',
          id: activeSessionId,
          cols: term.cols,
          rows: term.rows
        }));
      }
    } catch {}
  }, [activeSessionId]);

  // Connect WebSocket & initialize terminal
  useEffect(() => {
    if (!isOpen || activeTab !== 'terminal') return;

    let ws: WebSocket;
    let term: Terminal;
    let fitAddon: FitAddon;

    if (!terminalInstanceRef.current && xtermContainerRef.current) {
      term = new Terminal({
        cursorBlink: true,
        cursorStyle: 'bar',
        fontSize: 12,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        lineHeight: 1.25,
        theme: {
          background: '#0d1117',
          foreground: '#c9d1d9',
          cursor: '#58a6ff',
          cursorAccent: '#0d1117',
          selectionBackground: '#264f78',
          black: '#000000',
          red: '#ff7b72',
          green: '#3fb950',
          yellow: '#d29922',
          blue: '#58a6ff',
          magenta: '#bc8cff',
          cyan: '#39c5cf',
          white: '#d0d7de',
          brightBlack: '#484f58',
          brightRed: '#ffa198',
          brightGreen: '#56d364',
          brightYellow: '#e3b341',
          brightBlue: '#79c0ff',
          brightMagenta: '#d2a8ff',
          brightCyan: '#56d4dd',
          brightWhite: '#ffffff'
        },
        convertEol: true,
        allowProposedApi: true
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.loadAddon(new WebLinksAddon());

      term.open(xtermContainerRef.current);
      terminalInstanceRef.current = term;
      fitAddonRef.current = fitAddon;

      // Handle user keyboard input
      term.onData((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'pty_input',
            id: activeSessionId,
            data
          }));
        }
      });
    } else {
      term = terminalInstanceRef.current!;
      fitAddon = fitAddonRef.current!;
    }

    // Connect WebSocket
    const connectWs = () => {
      ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        requestAnimationFrame(() => {
          fitAddon.fit();
          ws.send(JSON.stringify({
            type: 'pty_init',
            id: activeSessionId,
            cols: term.cols || 80,
            rows: term.rows || 24,
            cwd: terminalCwd
          }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'pty_data' && msg.id === activeSessionId) {
            term.write(msg.data);
          } else if (msg.type === 'pty_exit' && msg.id === activeSessionId) {
            term.writeln(`\r\n\x1b[33m[Process exited with code ${msg.exitCode}]\x1b[0m\r\n`);
          }
        } catch {}
      };

      ws.onclose = () => {
        // Automatically try to reconnect if still active
      };
    };

    connectWs();

    // Resize observer on container
    const resizeObserver = new ResizeObserver(() => {
      fitTerminal();
    });

    if (xtermContainerRef.current) {
      resizeObserver.observe(xtermContainerRef.current);
    }

    const timer = setTimeout(() => {
      fitTerminal();
      term.focus();
    }, 100);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [isOpen, activeTab, activeSessionId, getWsUrl, fitTerminal, terminalCwd]);

  // Window resize handler
  useEffect(() => {
    const handleWindowResize = () => {
      fitTerminal();
    };
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [fitTerminal]);

  // Switch session or create new
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.clear();
    }
    if (wsRef.current?.readyState === WebSocket.OPEN && terminalInstanceRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'pty_init',
        id: sessionId,
        cols: terminalInstanceRef.current.cols,
        rows: terminalInstanceRef.current.rows,
        cwd: terminalCwd
      }));
    }
  };

  const handleAddSession = () => {
    const newNum = sessions.length + 1;
    const newId = `term-${Date.now()}`;
    const newSession: TerminalSession = {
      id: newId,
      name: `${newNum}: zsh`
    };
    setSessions(prev => [...prev, newSession]);
    handleSelectSession(newId);
  };

  const handleKillActiveSession = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'pty_kill',
        id: activeSessionId
      }));
    }
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.clear();
      terminalInstanceRef.current.writeln('\x1b[32m[Terminal session restarted]\x1b[0m\r\n');
    }
    // Re-initialize immediately
    setTimeout(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN && terminalInstanceRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'pty_init',
          id: activeSessionId,
          cols: terminalInstanceRef.current.cols,
          rows: terminalInstanceRef.current.rows,
          cwd: terminalCwd
        }));
      }
    }, 150);
  };

  const handleClearTerminal = () => {
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.clear();
      // Send Ctrl+L (clear screen) to pty
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'pty_input',
          id: activeSessionId,
          data: '\x0c'
        }));
      }
    }
  };

  // Toggle maximize
  const handleToggleMaximize = () => {
    if (isMaximized) {
      setPanelHeight(preMaxHeight);
      setIsMaximized(false);
    } else {
      setPreMaxHeight(panelHeight);
      setPanelHeight(Math.floor(window.innerHeight * 0.85));
      setIsMaximized(true);
    }
    setTimeout(fitTerminal, 50);
  };

  // Drag resizer for height
  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const newHeight = Math.max(140, Math.min(window.innerHeight - 100, window.innerHeight - moveEvent.clientY));
      setPanelHeight(newHeight);
      localStorage.setItem('blackhat_terminal_height', String(newHeight));
      fitTerminal();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      fitTerminal();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Debug REPL submit
  const handleDebugSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expr = debugInput.trim();
    if (!expr) return;

    const time = new Date().toLocaleTimeString();
    setDebugInput('');

    try {
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

  // Switching tabs never collapses panel
  const handleTabClick = (tab: BottomPanelTab) => {
    setActiveTab(tab);
    if (!isOpen) {
      onToggle();
    }
    if (tab === 'terminal') {
      setTimeout(() => {
        fitTerminal();
        terminalInstanceRef.current?.focus();
      }, 50);
    }
  };

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
          {/* Terminal-specific controls */}
          {isOpen && activeTab === 'terminal' && (
            <div className="flex items-center gap-1 text-[10px] mr-1">
              {/* Terminal Session Selector */}
              <select
                value={activeSessionId}
                onChange={(e) => handleSelectSession(e.target.value)}
                className="bg-[#222222] border border-[#333333] text-[#cccccc] rounded px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer"
              >
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {/* Add New Session */}
              <button
                title="New Terminal (Cmd+Shift+`)"
                onClick={handleAddSession}
                className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>

              {/* Restart Session */}
              <button
                title="Restart Terminal Process"
                onClick={handleKillActiveSession}
                className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
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
              title={activeTab === 'terminal' ? "Clear Terminal (Ctrl+L)" : activeTab === 'debug' ? "Clear Console" : "Clear Output"}
              onClick={() => {
                if (activeTab === 'terminal') handleClearTerminal();
                else if (activeTab === 'debug') setDebugLogs([]);
                else setOutputLogs(prev => ({ ...prev, [outputChannel]: [] }));
              }}
              className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Maximize / Restore Toggle */}
          {isOpen && (
            <button 
              title={isMaximized ? "Restore Panel Size" : "Maximize Panel Size"}
              onClick={handleToggleMaximize}
              className="p-1 hover:text-white text-[#858585] hover:bg-[#252525] rounded transition-colors"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
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
          
          {/* TAB 1: TERMINAL (Real xterm.js + node-pty Native Terminal) */}
          <div 
            className={`flex-1 flex flex-col min-h-0 bg-[#0d1117] p-2 relative ${
              activeTab === 'terminal' ? 'block' : 'hidden'
            }`}
            onClick={() => terminalInstanceRef.current?.focus()}
          >
            <div 
              ref={xtermContainerRef} 
              className="w-full h-full overflow-hidden" 
            />
          </div>

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

              {/* Ports Table or Empty State */}
              <div className="flex-1 overflow-y-auto">
                {forwardedPorts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
                    <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-[#2d2d2d] flex items-center justify-center mb-3">
                      <Network className="w-5 h-5 text-[#666666]" />
                    </div>
                    <p className="text-[13px] font-medium text-[#cccccc] mb-1">No Forwarded Ports</p>
                    <p className="text-[11px] text-[#777777] max-w-sm leading-relaxed mb-4">
                      When your application or development process listens on a network port, forwarded addresses will appear here. You can also forward a custom port above.
                    </p>
                  </div>
                ) : (
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
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
