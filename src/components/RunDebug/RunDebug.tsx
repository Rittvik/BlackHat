import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Bug, 
  Terminal as TerminalIcon, 
  ChevronRight, 
  ChevronDown, 
  Flame, 
  Package, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface RunDebugProps {
  onRunCommand: (command: string) => void;
  onOpenTerminal: () => void;
}

interface ScriptConfig {
  id: string;
  name: string;
  command: string;
  description: string;
  icon: 'dev' | 'build' | 'pack' | 'test';
}

const CONFIGURATIONS: ScriptConfig[] = [
  {
    id: 'dev',
    name: 'Launch Vite Dev Server',
    command: 'npm run dev',
    description: 'Hot-reloading local development web server at port 5173',
    icon: 'dev'
  },
  {
    id: 'build',
    name: 'Build Production Bundle',
    command: 'npm run build',
    description: 'TypeScript compiler & Vite production asset optimization',
    icon: 'build'
  },
  {
    id: 'pack_mac',
    name: 'Package Desktop App (macOS)',
    command: 'npm run pack:mac',
    description: 'Electron builder standalone macOS DMG & .app binary',
    icon: 'pack'
  },
  {
    id: 'test',
    name: 'Run Test Verification',
    command: 'npm test',
    description: 'QA assertion suites, unit checks and boundary tests',
    icon: 'test'
  }
];

export const RunDebug: React.FC<RunDebugProps> = ({ onRunCommand, onOpenTerminal }) => {
  const [selectedConfigId, setSelectedConfigId] = useState<string>('dev');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastExecutedCommand, setLastExecutedCommand] = useState<string | null>(null);
  const [variablesExpanded, setVariablesExpanded] = useState<boolean>(true);
  const [breakpointsExpanded, setBreakpointsExpanded] = useState<boolean>(true);

  const selectedConfig = CONFIGURATIONS.find(c => c.id === selectedConfigId) || CONFIGURATIONS[0];

  const handleLaunch = (config?: ScriptConfig) => {
    const target = config || selectedConfig;
    setIsRunning(true);
    setLastExecutedCommand(target.command);
    onOpenTerminal();
    onRunCommand(target.command);
  };

  const handleStop = () => {
    setIsRunning(false);
    onRunCommand('^C');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] select-none text-xs font-sans">
      {/* Header */}
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[#2b2b2b] bg-[#181818] shrink-0 gap-1 overflow-hidden">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase truncate min-w-0">
          Run and Debug
        </span>
        <button
          onClick={onOpenTerminal}
          title="Open Integrated Terminal"
          className="p-1 hover:text-white text-[#858585] rounded hover:bg-[#252525] transition-colors shrink-0"
        >
          <TerminalIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Configuration Selector & Launch Controls */}
      <div className="p-3 border-b border-[#2b2b2b] space-y-2 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Config dropdown */}
          <select
            value={selectedConfigId}
            onChange={(e) => setSelectedConfigId(e.target.value)}
            className="flex-1 min-w-0 bg-[#141414] border border-[#2b2b2b] text-[#cccccc] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#0078d4] cursor-pointer truncate"
          >
            {CONFIGURATIONS.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Play / Run Button */}
          <button
            onClick={() => handleLaunch()}
            title={`Launch: ${selectedConfig.name}`}
            className="w-7 h-7 rounded bg-[#2ea043] hover:bg-[#2c9740] text-white flex items-center justify-center transition-colors shrink-0 shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </button>

          {isRunning && (
            <button
              onClick={handleStop}
              title="Stop execution"
              className="w-7 h-7 rounded bg-[#f85149]/20 hover:bg-[#f85149]/30 text-[#f85149] flex items-center justify-center transition-colors shrink-0"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          )}
        </div>

        <div className="text-[11px] text-[#858585] bg-[#141414] p-2 rounded border border-[#262626] font-mono leading-relaxed">
          <div className="text-[#3fb950] font-medium mb-0.5">{selectedConfig.name}</div>
          <div className="text-[#858585] truncate">$ {selectedConfig.command}</div>
          <div className="text-[10px] text-[#666666] mt-1 font-sans">{selectedConfig.description}</div>
        </div>
      </div>

      {/* Quick Launch Targets */}
      <div className="p-2 border-b border-[#2b2b2b] shrink-0">
        <div className="text-[10px] font-semibold text-[#858585] uppercase px-1 mb-1.5">
          Available Run Targets
        </div>
        <div className="space-y-1">
          {CONFIGURATIONS.map(cfg => (
            <div
              key={cfg.id}
              onClick={() => {
                setSelectedConfigId(cfg.id);
                handleLaunch(cfg);
              }}
              className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-[#222222] cursor-pointer transition-colors group text-[#cccccc]"
            >
              <div className="flex items-center gap-2 min-w-0">
                {cfg.icon === 'dev' && <Flame className="w-3.5 h-3.5 text-[#e36209] shrink-0" />}
                {cfg.icon === 'build' && <CheckCircle2 className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />}
                {cfg.icon === 'pack' && <Package className="w-3.5 h-3.5 text-[#bc8cff] shrink-0" />}
                {cfg.icon === 'test' && <Bug className="w-3.5 h-3.5 text-[#3fb950] shrink-0" />}
                <span className="truncate text-xs font-normal group-hover:text-white">
                  {cfg.name}
                </span>
              </div>
              <Play className="w-3 h-3 text-[#666666] group-hover:text-[#3fb950] shrink-0 transition-colors" />
            </div>
          ))}
        </div>
      </div>

      {/* Debug Inspector Panels (Variables & Breakpoints) */}
      <div className="flex-1 overflow-y-auto">
        {/* Variables Collapsible */}
        <div className="border-b border-[#262626]">
          <button
            onClick={() => setVariablesExpanded(prev => !prev)}
            className="w-full px-2 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#858585] hover:text-[#cccccc] text-left uppercase"
          >
            {variablesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Environment Variables</span>
          </button>
          {variablesExpanded && (
            <div className="px-4 py-1.5 space-y-1 text-[11px] font-mono text-[#858585]">
              <div className="flex justify-between">
                <span className="text-[#58a6ff]">NODE_ENV</span>
                <span className="text-[#cccccc]">development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#58a6ff]">PORT</span>
                <span className="text-[#cccccc]">3001</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#58a6ff]">VITE_PORT</span>
                <span className="text-[#cccccc]">5173</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#58a6ff]">PLATFORM</span>
                <span className="text-[#cccccc]">darwin</span>
              </div>
            </div>
          )}
        </div>

        {/* Breakpoints & Watch */}
        <div className="border-b border-[#262626]">
          <button
            onClick={() => setBreakpointsExpanded(prev => !prev)}
            className="w-full px-2 py-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#858585] hover:text-[#cccccc] text-left uppercase"
          >
            {breakpointsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <span>Breakpoints & Call Stack</span>
          </button>
          {breakpointsExpanded && (
            <div className="px-4 py-2 text-[11px] text-[#666666] italic">
              {isRunning ? (
                <div className="flex items-center gap-1.5 text-[#3fb950] not-italic">
                  <span className="w-2 h-2 rounded-full bg-[#2ea043] animate-pulse" />
                  <span>Process running ({lastExecutedCommand})</span>
                </div>
              ) : (
                'No active debug session. Click play above to start.'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
