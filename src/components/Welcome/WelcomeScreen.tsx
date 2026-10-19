import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FolderPlus, 
  FilePlus, 
  GitBranch, 
  Sparkles, 
  Clock, 
  X, 
  Bot, 
  ArrowRight, 
  Code, 
  Layers, 
  Check, 
  Terminal, 
  ExternalLink,
  ShieldCheck,
  ChevronRight,
  Blocks
} from 'lucide-react';
import { AISettings, UserProfile } from '../../types';

interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
}

interface WelcomeScreenProps {
  onOpenFolder: () => void;
  onCreateProject: () => void;
  onNewFile: () => void;
  onOpenRecent: (path: string) => void;
  onOpenCodex: () => void;
  onOpenAgentStudio: () => void;
  onOpenExtensions: () => void;
  onOpenSettings: () => void;
  settings: AISettings;
  user: UserProfile;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onOpenFolder,
  onCreateProject,
  onNewFile,
  onOpenRecent,
  onOpenCodex,
  onOpenAgentStudio,
  onOpenExtensions,
  onOpenSettings,
  settings,
  user
}) => {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [showOnStartup, setShowOnStartup] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('blackhat_show_welcome');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('blackhat_recent_projects');
      if (saved) {
        setRecentProjects(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const handleToggleStartup = (val: boolean) => {
    setShowOnStartup(val);
    try {
      localStorage.setItem('blackhat_show_welcome', val ? 'true' : 'false');
    } catch {}
  };

  const handleRemoveRecent = (e: React.MouseEvent, pathToRemove: string) => {
    e.stopPropagation();
    const updated = recentProjects.filter(p => p.path !== pathToRemove);
    setRecentProjects(updated);
    try {
      localStorage.setItem('blackhat_recent_projects', JSON.stringify(updated));
    } catch {}
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gradient-to-b from-[#090b10] via-[#0d1017] to-[#07090d] text-white/90 select-none font-sans flex flex-col items-center justify-start p-6 sm:p-10 md:p-14">
      <div className="w-full max-w-5xl space-y-10">
        
        {/* 1. Header / Hero */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0A84FF] via-[#5E5CE6] to-[#BF5AF2] p-[1px] shadow-[0_0_24px_rgba(10,132,255,0.3)]">
              <div className="w-full h-full bg-[#0d1017] rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#0A84FF]" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>BlackHat</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.08] text-white/70 font-mono font-normal border border-white/[0.08]">
                  v1.0.0
                </span>
              </h1>
              <p className="text-sm text-white/50 font-normal">
                Autonomous Multi-Agent IDE • Antigravity Architecture • Powered by OpenAI Codex, Gemini & Claude
              </p>
            </div>
          </div>
        </div>

        {/* 2. Grid Sections: Start & Recent */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Start Actions (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 px-1">
                Start
              </h2>

              <div className="space-y-2">
                {/* Open Folder / Project */}
                <button
                  onClick={onOpenFolder}
                  className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#0A84FF]/50 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-[#0A84FF]/15 text-[#0A84FF] group-hover:scale-105 transition-transform">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/95 group-hover:text-white flex items-center gap-2">
                        <span>Open Folder...</span>
                        <span className="text-[10px] text-white/40 font-mono font-normal">⌘O</span>
                      </div>
                      <div className="text-xs text-white/45">
                        Open an existing project directory from your laptop
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Create New Project */}
                <button
                  onClick={onCreateProject}
                  className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-[#30D158]/50 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-[#30D158]/15 text-[#30D158] group-hover:scale-105 transition-transform">
                      <FolderPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/95 group-hover:text-white flex items-center gap-2">
                        <span>Create New Project...</span>
                        <span className="text-[10px] text-white/40 font-mono font-normal">⇧⌘N</span>
                      </div>
                      <div className="text-xs text-white/45">
                        Initialize TypeScript, Python, Node, or empty project
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* New File */}
                <button
                  onClick={onNewFile}
                  className="w-full p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] hover:border-white/20 transition-all text-left flex items-center justify-between group cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/[0.08] text-white/80 group-hover:scale-105 transition-transform">
                      <FilePlus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white/95 group-hover:text-white flex items-center gap-2">
                        <span>New Text File</span>
                        <span className="text-[10px] text-white/40 font-mono font-normal">⌘N</span>
                      </div>
                      <div className="text-xs text-white/45">
                        Quick scratchpad or script without opening a project
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>

            {/* AI Agents & Extensions Banner */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 px-1">
                AI Coding Agents & Extensions
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Codex Card */}
                <div 
                  onClick={onOpenCodex}
                  className="p-4 rounded-xl bg-gradient-to-br from-[#10a37f]/10 via-[#10a37f]/5 to-transparent border border-[#10a37f]/25 hover:border-[#10a37f]/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#10a37f]/20 flex items-center justify-center text-[#10a37f]">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">OpenAI Codex</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#10a37f]/20 text-[#10a37f] font-medium border border-[#10a37f]/30">
                      Installed
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-3">
                    Autonomous coding agent, TODO implementation, test synthesis & refactoring.
                  </p>
                  <div className="text-xs text-[#10a37f] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Codex Sidebar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Autonomous Multi-Agent Studio */}
                <div 
                  onClick={onOpenAgentStudio}
                  className="p-4 rounded-xl bg-gradient-to-br from-[#0A84FF]/10 via-[#5E5CE6]/5 to-transparent border border-[#0A84FF]/25 hover:border-[#0A84FF]/50 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-white">Agent Studio</span>
                    </div>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#0A84FF]/20 text-[#0A84FF] font-medium border border-[#0A84FF]/30">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mb-3">
                    Architect, Developer & Tester working collaboratively with context sharing.
                  </p>
                  <div className="text-xs text-[#0A84FF] font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open Multi-Agent Studio</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Recent Projects (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Recent Projects
              </h2>
              {recentProjects.length > 0 && (
                <button
                  onClick={() => {
                    setRecentProjects([]);
                    try { localStorage.removeItem('blackhat_recent_projects'); } catch {}
                  }}
                  className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {recentProjects.length === 0 ? (
              <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
                <Clock className="w-6 h-6 text-white/30 mx-auto" />
                <div className="text-xs font-medium text-white/60">No Recent Projects</div>
                <p className="text-[11px] text-white/40">
                  Projects you open or create will appear here for fast access.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {recentProjects.map((proj) => (
                  <div
                    key={proj.path}
                    onClick={() => onOpenRecent(proj.path)}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/15 transition-all text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-white/90 group-hover:text-white truncate">
                        {proj.name}
                      </div>
                      <div className="text-[10px] text-white/40 truncate font-mono mt-0.5" title={proj.path}>
                        {proj.path}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-white/35 font-mono">
                        {formatTime(proj.lastOpened)}
                      </span>
                      <button
                        title="Remove from recents"
                        onClick={(e) => handleRemoveRecent(e, proj.path)}
                        className="p-1 rounded-md hover:bg-white/[0.1] text-white/30 hover:text-white/80 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Extension Store & Settings Link */}
            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-white/50 px-1">
              <button
                onClick={onOpenExtensions}
                className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Blocks className="w-3.5 h-3.5 text-[#0A84FF]" />
                <span>Extensions Store</span>
              </button>

              <button
                onClick={onOpenSettings}
                className="hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>AI Settings</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Bottom Options & Keyboard Shortcuts */}
        <div className="pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnStartup}
              onChange={(e) => handleToggleStartup(e.target.checked)}
              className="rounded bg-[#1a1c24] border-white/20 text-[#0A84FF] focus:ring-0 cursor-pointer"
            />
            <span className="text-white/70 text-[11px]">Show Welcome page on startup</span>
          </label>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/40">
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60 font-mono text-[10px]">⌘P</kbd> Quick Open</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60 font-mono text-[10px]">⌘B</kbd> Toggle Sidebar</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/60 font-mono text-[10px]">⌃`</kbd> Terminal</span>
          </div>
        </div>

      </div>
    </div>
  );
};
