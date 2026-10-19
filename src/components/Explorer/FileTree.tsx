import React, { useState, useEffect, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  FilePlus,
  FolderPlus,
  RefreshCw, 
  Trash2, 
  ChevronRight, 
  ChevronDown,
  Edit2,
  Copy,
  FolderTree,
  ExternalLink,
  Files
} from 'lucide-react';
import { FileNode } from '../../types';

interface FileTreeProps {
  files: FileNode[];
  activeFilePath?: string;
  onFileSelect: (path: string) => void;
  onRefresh: () => void;
  onCreateFile: (path: string, isDirectory: boolean) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile?: (oldPath: string, newPath: string) => void;
  onDuplicateFile?: (path: string) => void;
  onRevealInFinder?: (path: string) => void;
  workspaceRoot?: string;
  onOpenFolder?: () => void;
  onCreateProject?: () => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetNode: FileNode | null;
}

function getFileIcon(name: string) {
  if (name.endsWith('.ts') || name.endsWith('.tsx') || name.endsWith('.js') || name.endsWith('.jsx')) {
    return <FileCode className="w-4 h-4 text-[#58a6ff] shrink-0" />;
  }
  if (name.endsWith('.json')) {
    return <FileJson className="w-4 h-4 text-[#d29922] shrink-0" />;
  }
  if (name.endsWith('.md')) {
    return <FileText className="w-4 h-4 text-[#bc8cff] shrink-0" />;
  }
  if (name.endsWith('.css') || name.endsWith('.scss') || name.endsWith('.html')) {
    return <FileCode className="w-4 h-4 text-[#388bfd] shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-[#858585] shrink-0" />;
}

export const FileTree: React.FC<FileTreeProps> = ({
  files,
  activeFilePath,
  onFileSelect,
  onRefresh,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  onDuplicateFile,
  onRevealInFinder,
  workspaceRoot,
  onOpenFolder,
  onCreateProject
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '': true });
  const [newPromptPath, setNewPromptPath] = useState<{ parentPath: string; isDir: boolean } | null>(null);
  const [newNameInput, setNewNameInput] = useState('');
  
  // Inline rename state
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    targetNode: null
  });

  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click or scroll or escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(prev => ({ ...prev, visible: false }));
        setRenamingPath(null);
        setNewPromptPath(null);
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameInput.trim() || !newPromptPath) return;
    const fullPath = newPromptPath.parentPath 
      ? `${newPromptPath.parentPath}/${newNameInput.trim()}`
      : newNameInput.trim();
    onCreateFile(fullPath, newPromptPath.isDir);
    setNewPromptPath(null);
    setNewNameInput('');
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameInputValue.trim() || !renamingPath) return;
    const parts = renamingPath.split('/');
    parts.pop();
    const parent = parts.join('/');
    const newPath = parent ? `${parent}/${renameInputValue.trim()}` : renameInputValue.trim();
    if (newPath !== renamingPath && onRenameFile) {
      onRenameFile(renamingPath, newPath);
    }
    setRenamingPath(null);
    setRenameInputValue('');
  };

  const handleContextMenu = (e: React.MouseEvent, node: FileNode | null) => {
    e.preventDefault();
    e.stopPropagation();
    // Clamp to viewport
    const menuWidth = 200;
    const menuHeight = 260;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenu({
      visible: true,
      x,
      y,
      targetNode: node
    });
  };

  const copyPath = (relPath: string) => {
    navigator.clipboard.writeText(relPath);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const startRename = (node: FileNode) => {
    setRenamingPath(node.path);
    setRenameInputValue(node.name);
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const renderNode = (node: FileNode, level = 0) => {
    const isExpanded = !!expandedFolders[node.path];
    const isActive = activeFilePath === node.path;
    const isRenamingThis = renamingPath === node.path;

    if (node.isDirectory) {
      return (
        <div key={node.path}>
          {isRenamingThis ? (
            <form onSubmit={handleRenameSubmit} className="px-2 py-0.5 bg-[#1e1e1e]">
              <input
                type="text"
                autoFocus
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onBlur={handleRenameSubmit}
                className="w-full px-1.5 py-0.5 text-xs bg-[#141414] border border-[#0078d4] rounded text-white focus:outline-none font-mono"
              />
            </form>
          ) : (
            <div 
              onClick={() => toggleFolder(node.path)}
              onContextMenu={(e) => handleContextMenu(e, node)}
              className="flex items-center justify-between group h-[24px] px-2 cursor-pointer text-[12px] hover:bg-[rgba(255,255,255,0.04)] transition-colors select-none text-[#cccccc]"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#858585] shrink-0" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#858585] shrink-0" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-[#d29922] shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 text-[#858585] shrink-0" />
                )}
                <span className="truncate font-normal">{node.name}</span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button 
                  title="New File Inside"
                  onClick={() => {
                    setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                    setNewPromptPath({ parentPath: node.path, isDir: false });
                  }}
                  className="p-1 hover:text-white text-[#858585] rounded hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <FilePlus className="w-3 h-3" />
                </button>
                <button 
                  title="New Folder Inside"
                  onClick={() => {
                    setExpandedFolders(prev => ({ ...prev, [node.path]: true }));
                    setNewPromptPath({ parentPath: node.path, isDir: true });
                  }}
                  className="p-1 hover:text-white text-[#858585] rounded hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
                <button 
                  title="Delete Folder"
                  onClick={() => {
                    if (confirm(`Delete folder ${node.path}?`)) onDeleteFile(node.path);
                  }}
                  className="p-1 hover:text-[#f85149] text-[#858585] rounded hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div key={node.path}>
        {isRenamingThis ? (
          <form onSubmit={handleRenameSubmit} className="px-2 py-0.5 bg-[#1e1e1e]">
            <input
              type="text"
              autoFocus
              value={renameInputValue}
              onChange={(e) => setRenameInputValue(e.target.value)}
              onBlur={handleRenameSubmit}
              className="w-full px-1.5 py-0.5 text-xs bg-[#141414] border border-[#0078d4] rounded text-white focus:outline-none font-mono"
            />
          </form>
        ) : (
          <div 
            onClick={() => onFileSelect(node.path)}
            onContextMenu={(e) => handleContextMenu(e, node)}
            className={`flex items-center justify-between group h-[24px] px-2 cursor-pointer text-[12px] transition-colors select-none ${
              isActive 
                ? 'bg-[rgba(255,255,255,0.08)] text-white' 
                : 'text-[#cccccc] hover:bg-[rgba(255,255,255,0.04)]'
            }`}
            style={{ paddingLeft: `${level * 12 + 22}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {getFileIcon(node.name)}
              <span className="truncate font-normal">{node.name}</span>
            </div>
            <button 
              title="Delete File"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete ${node.path}?`)) onDeleteFile(node.path);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#f85149] text-[#858585] rounded hover:bg-[rgba(255,255,255,0.08)]"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const targetNode = contextMenu.targetNode;

  return (
    <div 
      className="w-full h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] select-none relative"
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Explorer Header */}
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[#2b2b2b] text-[11px] font-semibold text-[#bbbbbb] tracking-wider uppercase shrink-0 gap-1 overflow-hidden">
        <span className="truncate min-w-0">Explorer</span>
        <div className="flex items-center gap-0.5 shrink-0">
          <button 
            title="New File"
            onClick={() => setNewPromptPath({ parentPath: '', isDir: false })}
            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors text-[#858585] shrink-0"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="New Folder"
            onClick={() => setNewPromptPath({ parentPath: '', isDir: true })}
            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors text-[#858585] shrink-0"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="Refresh Explorer"
            onClick={onRefresh}
            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors text-[#858585] shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {newPromptPath && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[#2b2b2b] bg-[#1e1e1e] shrink-0">
          <input 
            type="text" 
            autoFocus
            placeholder={newPromptPath.isDir ? "Folder name..." : "File name..."}
            value={newNameInput}
            onChange={(e) => setNewNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setNewPromptPath(null)}
            className="w-full px-2 py-1 text-xs bg-[#141414] border border-[#0078d4] rounded text-white focus:outline-none font-mono"
          />
        </form>
      )}

        {!workspaceRoot || files.length === 0 ? (
          <div className="p-4 space-y-4 text-xs select-none">
            <div className="space-y-1">
              <div className="text-white/85 font-semibold uppercase text-[11px] tracking-wider">
                No Folder Opened
              </div>
              <p className="text-white/45 text-[11px] leading-relaxed">
                You have not yet opened a workspace folder. Open an existing project or create a new project on your laptop.
              </p>
            </div>

            <div className="space-y-2">
              {onOpenFolder && (
                <button
                  onClick={onOpenFolder}
                  className="w-full py-2 px-3 rounded-xl bg-[#0A84FF] hover:bg-[#0071E3] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-[#0A84FF]/25"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open Folder...</span>
                </button>
              )}

              {onCreateProject && (
                <button
                  onClick={onCreateProject}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/90 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-white/[0.08]"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-[#30D158]" />
                  <span>Create New Project...</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          files.map(node => renderNode(node, 0))
        )}

      {/* Right Click Context Menu */}
      {contextMenu.visible && (
        <div
          ref={menuRef}
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-52 bg-[#202020] border border-[#333333] rounded-md shadow-2xl py-1 text-xs text-[#cccccc] font-sans divide-y divide-[#2a2a2a] select-none"
        >
          {targetNode ? (
            <>
              {/* File / Folder Actions */}
              <div className="py-0.5">
                {!targetNode.isDirectory && (
                  <button
                    onClick={() => {
                      onFileSelect(targetNode.path);
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#58a6ff]" />
                    <span>Open File</span>
                  </button>
                )}

                {targetNode.isDirectory && (
                  <>
                    <button
                      onClick={() => {
                        setExpandedFolders(prev => ({ ...prev, [targetNode.path]: true }));
                        setNewPromptPath({ parentPath: targetNode.path, isDir: false });
                        setContextMenu(prev => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                    >
                      <FilePlus className="w-3.5 h-3.5 text-[#58a6ff]" />
                      <span>New File...</span>
                    </button>
                    <button
                      onClick={() => {
                        setExpandedFolders(prev => ({ ...prev, [targetNode.path]: true }));
                        setNewPromptPath({ parentPath: targetNode.path, isDir: true });
                        setContextMenu(prev => ({ ...prev, visible: false }));
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#d29922]" />
                      <span>New Folder...</span>
                    </button>
                  </>
                )}
              </div>

              {/* Edit / Duplicate / Rename */}
              <div className="py-0.5">
                <button
                  onClick={() => startRename(targetNode)}
                  className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Rename...</span>
                  </div>
                  <span className="text-[10px] text-[#666666]">F2</span>
                </button>

                {!targetNode.isDirectory && onDuplicateFile && (
                  <button
                    onClick={() => {
                      onDuplicateFile(targetNode.path);
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                  >
                    <Files className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Duplicate</span>
                  </button>
                )}
              </div>

              {/* Path & OS Reveal */}
              <div className="py-0.5">
                <button
                  onClick={() => copyPath(targetNode.path)}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-[#858585]" />
                  <span>Copy Relative Path</span>
                </button>

                {onRevealInFinder && (
                  <button
                    onClick={() => {
                      onRevealInFinder(targetNode.path);
                      setContextMenu(prev => ({ ...prev, visible: false }));
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Reveal in Finder</span>
                  </button>
                )}
              </div>

              {/* Delete */}
              <div className="py-0.5">
                <button
                  onClick={() => {
                    setContextMenu(prev => ({ ...prev, visible: false }));
                    if (confirm(`Are you sure you want to delete ${targetNode.path}?`)) {
                      onDeleteFile(targetNode.path);
                    }
                  }}
                  className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#f85149] hover:text-white text-[#f85149] text-left transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          ) : (
            /* Blank space context menu */
            <div className="py-0.5">
              <button
                onClick={() => {
                  setNewPromptPath({ parentPath: '', isDir: false });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
              >
                <FilePlus className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>New File</span>
              </button>
              <button
                onClick={() => {
                  setNewPromptPath({ parentPath: '', isDir: true });
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
              >
                <FolderPlus className="w-3.5 h-3.5 text-[#d29922]" />
                <span>New Folder</span>
              </button>
              <button
                onClick={() => {
                  onRefresh();
                  setContextMenu(prev => ({ ...prev, visible: false }));
                }}
                className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-[#0078d4] hover:text-white text-left transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#3fb950]" />
                <span>Refresh Explorer</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
