import React, { useState } from 'react';
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
  ChevronDown 
} from 'lucide-react';
import { FileNode } from '../../types';

interface FileTreeProps {
  files: FileNode[];
  activeFilePath?: string;
  onFileSelect: (path: string) => void;
  onRefresh: () => void;
  onCreateFile: (path: string, isDirectory: boolean) => void;
  onDeleteFile: (path: string) => void;
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
  onDeleteFile
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '': true });
  const [newPromptPath, setNewPromptPath] = useState<{ parentPath: string; isDir: boolean } | null>(null);
  const [newNameInput, setNewNameInput] = useState('');

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

  const renderNode = (node: FileNode, level = 0) => {
    const isExpanded = !!expandedFolders[node.path];
    const isActive = activeFilePath === node.path;

    if (node.isDirectory) {
      return (
        <div key={node.path}>
          <div 
            onClick={() => toggleFolder(node.path)}
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
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
              <button 
                title="New File Inside"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewPromptPath({ parentPath: node.path, isDir: false });
                }}
                className="p-1 hover:text-white text-[#858585] rounded hover:bg-[rgba(255,255,255,0.08)]"
              >
                <FilePlus className="w-3 h-3" />
              </button>
              <button 
                title="Delete Folder"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete folder ${node.path}?`)) onDeleteFile(node.path);
                }}
                className="p-1 hover:text-[#f85149] text-[#858585] rounded hover:bg-[rgba(255,255,255,0.08)]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div 
        key={node.path}
        onClick={() => onFileSelect(node.path)}
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
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] select-none">
      {/* Explorer Header */}
      <div className="h-[35px] px-4 flex items-center justify-between border-b border-[#2b2b2b] text-[11px] font-semibold text-[#bbbbbb] tracking-wider uppercase">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          <button 
            title="New File"
            onClick={() => setNewPromptPath({ parentPath: '', isDir: false })}
            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors text-[#858585]"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="New Folder"
            onClick={() => setNewPromptPath({ parentPath: '', isDir: true })}
            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors text-[#858585]"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="Refresh Explorer"
            onClick={onRefresh}
            className="p-1 hover:text-white hover:bg-[rgba(255,255,255,0.08)] rounded transition-colors text-[#858585]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {newPromptPath && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-[#2b2b2b] bg-[#1e1e1e]">
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

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#858585]">
            No files in workspace
          </div>
        ) : (
          files.map(node => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
