import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  FolderPlus, 
  X, 
  ExternalLink, 
  Check, 
  Folder, 
  Sparkles, 
  Terminal, 
  Code, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: string;
  onOpenWorkspace: (workspacePath: string, newWindow?: boolean) => void;
  isElectron: boolean;
  initialTab?: 'open' | 'create';
}

interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  currentWorkspace,
  onOpenWorkspace,
  isElectron,
  initialTab = 'open'
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'create'>(initialTab);
  const [existingPath, setExistingPath] = useState('');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setError(null);
    }
  }, [isOpen, initialTab]);
  const [projectName, setProjectName] = useState('');
  const [parentPath, setParentPath] = useState(currentWorkspace || '');
  const [template, setTemplate] = useState<'empty' | 'typescript' | 'python' | 'node'>('typescript');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  const API_BASE = typeof window !== 'undefined' && window.location.protocol === 'file:' 
    ? 'http://localhost:3001' 
    : '';

  // Load recent projects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('blackhat_recent_projects');
      if (saved) {
        setRecentProjects(JSON.parse(saved));
      } else if (currentWorkspace) {
        setRecentProjects([{
          name: currentWorkspace.split('/').pop() || 'BlackHat',
          path: currentWorkspace,
          lastOpened: Date.now()
        }]);
      }
    } catch {}
  }, [currentWorkspace]);

  const saveRecentProject = (projectPath: string) => {
    try {
      const name = projectPath.split('/').filter(Boolean).pop() || 'Project';
      const updated = [
        { name, path: projectPath, lastOpened: Date.now() },
        ...recentProjects.filter(p => p.path !== projectPath)
      ].slice(0, 8);
      setRecentProjects(updated);
      localStorage.setItem('blackhat_recent_projects', JSON.stringify(updated));
    } catch {}
  };

  const handleBrowseExisting = async () => {
    setError(null);
    if ((window as any).electronAPI?.openFolderDialog) {
      const chosen = await (window as any).electronAPI.openFolderDialog();
      if (chosen) {
        setExistingPath(chosen);
      }
    }
  };

  const handleBrowseParent = async () => {
    setError(null);
    if ((window as any).electronAPI?.openFolderDialog) {
      const chosen = await (window as any).electronAPI.openFolderDialog();
      if (chosen) {
        setParentPath(chosen);
      }
    }
  };

  const handleOpenExisting = async (openInNewWindow: boolean) => {
    if (!existingPath.trim()) {
      setError('Please select or specify a project path');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      if ((window as any).electronAPI?.native?.validateProject) {
        const data = await (window as any).electronAPI.native.validateProject(existingPath.trim());
        if (!data.valid) {
          setError(data.error || 'The specified directory does not exist or is not a directory.');
          setIsValidating(false);
          return;
        }
        saveRecentProject(data.path);
        onOpenWorkspace(data.path, openInNewWindow);
        onClose();
        return;
      }
      const res = await fetch(`${API_BASE}/api/project/validate?path=${encodeURIComponent(existingPath.trim())}`);
      const data = await res.json();

      if (!data.valid) {
        setError(data.error || 'The specified directory does not exist or is not a directory.');
        setIsValidating(false);
        return;
      }

      saveRecentProject(data.path);
      onOpenWorkspace(data.path, openInNewWindow);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to validate project path');
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateProject = async (openInNewWindow: boolean) => {
    if (!projectName.trim()) {
      setError('Please provide a project name');
      return;
    }
    if (!parentPath.trim()) {
      setError('Please select a destination folder');
      return;
    }

    setIsValidating(true);
    setError(null);

    const fullProjectPath = `${parentPath.trim().replace(/\/+$/, '')}/${projectName.trim()}`;

    try {
      if ((window as any).electronAPI?.native?.createProject) {
        const data = await (window as any).electronAPI.native.createProject(fullProjectPath, projectName.trim(), template);
        if (!data.success) {
          throw new Error(data.error || 'Failed to create project');
        }
        saveRecentProject(data.projectPath);
        onOpenWorkspace(data.projectPath, openInNewWindow);
        onClose();
        return;
      }
      const res = await fetch(`${API_BASE}/api/project/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectPath: fullProjectPath,
          projectName: projectName.trim(),
          template
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create project');
      }

      saveRecentProject(data.projectPath);
      onOpenWorkspace(data.projectPath, openInNewWindow);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create new project');
    } finally {
      setIsValidating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-sans select-none animate-fade-in">
      <div className="w-full max-w-xl bg-[#181818] border border-[#2b2b2b] rounded-xl shadow-2xl overflow-hidden flex flex-col text-[#cccccc]">
        
        {/* Header */}
        <div className="h-12 px-5 bg-[#1f1f1f] border-b border-[#2b2b2b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="w-4 h-4 text-[#00f0ff]" />
            <h2 className="text-sm font-semibold text-white">Project Manager</h2>
            <span className="text-xs text-[#666666]">/</span>
            <span className="text-xs text-[#858585]">{activeTab === 'open' ? 'Open Existing' : 'Create New'}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded hover:bg-[#2c2c2c] text-[#858585] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-5 pt-3 border-b border-[#2b2b2b] flex items-center gap-4 bg-[#181818]">
          <button
            onClick={() => { setActiveTab('open'); setError(null); }}
            className={`pb-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'open' 
                ? 'border-[#00f0ff] text-white font-semibold' 
                : 'border-transparent text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open Existing Project</span>
          </button>

          <button
            onClick={() => { setActiveTab('create'); setError(null); }}
            className={`pb-2.5 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'create' 
                ? 'border-[#00f0ff] text-white font-semibold' 
                : 'border-transparent text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[70vh] space-y-4">
          
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'open' ? (
            /* OPEN EXISTING PROJECT TAB */
            <div className="space-y-4">
              {isElectron && (
                <button
                  type="button"
                  onClick={handleBrowseExisting}
                  className="w-full h-11 px-4 rounded-lg bg-[#222222] hover:bg-[#282828] border border-[#333333] hover:border-[#444444] text-white text-xs font-medium flex items-center justify-between transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className="w-4 h-4 text-[#58a6ff] group-hover:scale-110 transition-transform" />
                    <span>Browse Project Folder on Computer...</span>
                  </div>
                  <span className="text-[11px] text-[#858585]">Finder / Explorer</span>
                </button>
              )}

              <div>
                <label className="block text-[11px] font-medium text-[#cccccc] mb-1.5">
                  Project Directory Path
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. /Users/name/Projects/my-app or C:\Projects\my-app"
                    value={existingPath}
                    onChange={(e) => setExistingPath(e.target.value)}
                    className="flex-1 h-9 px-3 bg-[#111111] border border-[#333333] focus:border-[#00f0ff] rounded-lg text-white text-xs outline-none transition-colors font-mono"
                  />
                  {isElectron && (
                    <button
                      type="button"
                      onClick={handleBrowseExisting}
                      className="h-9 px-3 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] border border-[#383838] text-xs text-[#cccccc] hover:text-white transition-colors cursor-pointer"
                    >
                      Browse...
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenExisting(true)}
                  disabled={!existingPath.trim() || isValidating}
                  className="h-9 px-4 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in New Window</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenExisting(false)}
                  disabled={!existingPath.trim() || isValidating}
                  className="h-9 px-4 rounded-lg bg-[#0078d4] hover:bg-[#006cbd] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  <span>Open in This Window</span>
                </button>
              </div>

              {/* Recent Projects List */}
              {recentProjects.length > 0 && (
                <div className="pt-4 border-t border-[#262626]">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#858585] mb-2.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Recent Workspaces</span>
                  </div>

                  <div className="space-y-1.5">
                    {recentProjects.map((p, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#1e1e1e] hover:bg-[#242424] border border-[#2b2b2b] flex items-center justify-between transition-colors group cursor-pointer"
                        onClick={() => {
                          setExistingPath(p.path);
                          onOpenWorkspace(p.path, false);
                          onClose();
                        }}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Folder className="w-4 h-4 text-[#00f0ff] shrink-0" />
                          <div className="truncate">
                            <div className="text-xs text-white font-medium truncate">{p.name}</div>
                            <div className="text-[10px] text-[#666666] font-mono truncate">{p.path}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            title="Open in New Window"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenWorkspace(p.path, true);
                              onClose();
                            }}
                            className="p-1 rounded hover:bg-[#333333] text-[#858585] hover:text-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          ) : (
            /* CREATE NEW PROJECT TAB */
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-[#cccccc] mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. quantum-agents or my-next-app"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full h-9 px-3 bg-[#111111] border border-[#333333] focus:border-[#00f0ff] rounded-lg text-white text-xs outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#cccccc] mb-1.5">
                  Parent Destination Directory *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. /Users/name/Projects"
                    value={parentPath}
                    onChange={(e) => setParentPath(e.target.value)}
                    className="flex-1 h-9 px-3 bg-[#111111] border border-[#333333] focus:border-[#00f0ff] rounded-lg text-white text-xs outline-none transition-colors font-mono"
                  />
                  {isElectron && (
                    <button
                      type="button"
                      onClick={handleBrowseParent}
                      className="h-9 px-3 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] border border-[#383838] text-xs text-[#cccccc] hover:text-white transition-colors cursor-pointer"
                    >
                      Browse...
                    </button>
                  )}
                </div>
                {projectName.trim() && parentPath.trim() && (
                  <div className="mt-1.5 text-[10px] text-[#858585] font-mono">
                    Will be created at: {parentPath.replace(/\/+$/, '')}/{projectName.trim()}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#cccccc] mb-2">
                  Project Template & Blueprint
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplate('typescript')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      template === 'typescript'
                        ? 'bg-[#00f0ff]/10 border-[#00f0ff]/50 text-white'
                        : 'bg-[#1e1e1e] border-[#2b2b2b] text-[#858585] hover:text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />
                      <span>TypeScript Web App</span>
                    </div>
                    <div className="text-[10px] text-[#858585]">Vite, TSConfig, index.ts, package.json</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate('python')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      template === 'python'
                        ? 'bg-[#3fb950]/10 border-[#3fb950]/50 text-white'
                        : 'bg-[#1e1e1e] border-[#2b2b2b] text-[#858585] hover:text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                      <Code className="w-3.5 h-3.5 text-[#3fb950]" />
                      <span>Python Agent</span>
                    </div>
                    <div className="text-[10px] text-[#858585]">main.py, requirements.txt, README.md</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate('node')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      template === 'node'
                        ? 'bg-[#58a6ff]/10 border-[#58a6ff]/50 text-white'
                        : 'bg-[#1e1e1e] border-[#2b2b2b] text-[#858585] hover:text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                      <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span>Node.js Service</span>
                    </div>
                    <div className="text-[10px] text-[#858585]">package.json, index.js, ES Modules</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplate('empty')}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      template === 'empty'
                        ? 'bg-[#ffffff]/10 border-white/40 text-white'
                        : 'bg-[#1e1e1e] border-[#2b2b2b] text-[#858585] hover:text-[#cccccc]'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1">
                      <Folder className="w-3.5 h-3.5 text-white" />
                      <span>Empty Workspace</span>
                    </div>
                    <div className="text-[10px] text-[#858585]">Blank clean repository with README</div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleCreateProject(true)}
                  disabled={!projectName.trim() || !parentPath.trim() || isValidating}
                  className="h-9 px-4 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333] text-white text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Create in New Window</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateProject(false)}
                  disabled={!projectName.trim() || !parentPath.trim() || isValidating}
                  className="h-9 px-4 rounded-lg bg-[#2ea043] hover:bg-[#2c974b] text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Create & Open Project</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
