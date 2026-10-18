import React, { useState } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  Plus, 
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
    return <FileCode className="w-4 h-4 text-ide-cyan shrink-0" />;
  }
  if (name.endsWith('.json')) {
    return <FileJson className="w-4 h-4 text-ide-amber shrink-0" />;
  }
  if (name.endsWith('.md')) {
    return <FileText className="w-4 h-4 text-ide-purple shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-ide-muted shrink-0" />;
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
            className={`flex items-center justify-between group px-2 py-1 cursor-pointer text-xs rounded hover:bg-ide-hover transition-colors select-none ${
              isActive ? 'bg-ide-hover text-white font-medium' : 'text-ide-text/80'
            }`}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-ide-muted shrink-0" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-ide-muted shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 text-ide-accent shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-ide-muted shrink-0" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button 
                title="New File"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewPromptPath({ parentPath: node.path, isDir: false });
                }}
                className="p-0.5 hover:text-ide-cyan text-ide-muted"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button 
                title="Delete Folder"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete folder ${node.path}?`)) onDeleteFile(node.path);
                }}
                className="p-0.5 hover:text-ide-rose text-ide-muted"
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
        className={`flex items-center justify-between group px-2 py-1 cursor-pointer text-xs rounded hover:bg-ide-hover transition-colors select-none ${
          isActive ? 'bg-ide-hover text-white font-medium border-l-2 border-ide-accent' : 'text-ide-text/80'
        }`}
        style={{ paddingLeft: `${level * 12 + 20}px` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {getFileIcon(node.name)}
          <span className="truncate">{node.name}</span>
        </div>
        <button 
          title="Delete File"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete ${node.path}?`)) onDeleteFile(node.path);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-ide-rose text-ide-muted"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-ide-sidebar border-r border-ide-border">
      {/* Explorer Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-ide-border text-xs font-semibold text-ide-muted tracking-wider uppercase">
        <span>Workspace Explorer</span>
        <div className="flex items-center gap-1">
          <button 
            title="New File"
            onClick={() => setNewPromptPath({ parentPath: '', isDir: false })}
            className="p-1 hover:text-white hover:bg-ide-card rounded transition-colors text-ide-muted"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button 
            title="Refresh"
            onClick={onRefresh}
            className="p-1 hover:text-white hover:bg-ide-card rounded transition-colors text-ide-muted"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline Create Form */}
      {newPromptPath && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-ide-border bg-ide-card">
          <input 
            type="text" 
            autoFocus
            placeholder={newPromptPath.isDir ? "Folder name..." : "File name (e.g. index.ts)..."}
            value={newNameInput}
            onChange={(e) => setNewNameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setNewPromptPath(null)}
            className="w-full px-2 py-1 text-xs bg-ide-darkest border border-ide-accent rounded text-white focus:outline-none"
          />
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-1">
        {files.length === 0 ? (
          <div className="p-4 text-center text-xs text-ide-muted">
            Workspace is empty
          </div>
        ) : (
          files.map(node => renderNode(node, 0))
        )}
      </div>
    </div>
  );
};
