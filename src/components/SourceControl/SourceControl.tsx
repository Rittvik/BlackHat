import React, { useState, useEffect } from 'react';
import { GitBranch, Check, RefreshCw, UploadCloud, FileCode, Plus, Minus } from 'lucide-react';

interface GitFile {
  code: string;
  path: string;
}

interface SourceControlProps {
  onOpenFile: (path: string) => void;
  apiBase: string;
  workspaceRoot?: string;
}

export const SourceControl: React.FC<SourceControlProps> = ({ onOpenFile, apiBase, workspaceRoot }) => {
  const [branch, setBranch] = useState('main');
  const [files, setFiles] = useState<GitFile[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      if ((window as any).electronAPI?.native?.gitStatus) {
        const data = await (window as any).electronAPI.native.gitStatus(workspaceRoot);
        if (data.success) {
          setBranch(data.branch || 'main');
          setFiles(data.files || []);
          return;
        }
      }
      const headers: Record<string, string> = {};
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(`${apiBase}/api/git/status`, { headers });
      const data = await res.json();
      if (data.success) {
        setBranch(data.branch || 'main');
        setFiles(data.files || []);
      }
    } catch (err) {
      console.error('Failed to get git status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [workspaceRoot]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;
    setCommitting(true);
    try {
      if ((window as any).electronAPI?.native?.gitCommit) {
        const data = await (window as any).electronAPI.native.gitCommit(commitMessage.trim(), workspaceRoot);
        if (data.success) {
          setCommitMessage('');
          setStatusMessage('Committed successfully');
          setTimeout(() => setStatusMessage(null), 2500);
          await fetchStatus();
          return;
        } else {
          alert(data.error || 'Commit failed');
          return;
        }
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(`${apiBase}/api/git/commit`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: commitMessage.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setCommitMessage('');
        setStatusMessage('Committed successfully');
        setTimeout(() => setStatusMessage(null), 2500);
        await fetchStatus();
      } else {
        alert(data.error || 'Commit failed');
      }
    } catch (err: any) {
      alert(err.message || 'Commit request failed');
    } finally {
      setCommitting(false);
    }
  };

  const getStatusColor = (code: string) => {
    if (code.includes('M')) return 'text-[#d29922] bg-[#d29922]/15'; // modified
    if (code.includes('A') || code.includes('??')) return 'text-[#3fb950] bg-[#3fb950]/15'; // added/untracked
    if (code.includes('D')) return 'text-[#f85149] bg-[#f85149]/15'; // deleted
    return 'text-[#858585] bg-[#222222]';
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] select-none text-xs font-sans">
      {/* Header */}
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[#2b2b2b] bg-[#181818] shrink-0 gap-1 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase truncate min-w-0">
            Source Control
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#858585] truncate font-mono shrink-0">
            (<GitBranch className="w-3 h-3 text-[#58a6ff]" /> {branch})
          </span>
        </div>
        <button
          onClick={fetchStatus}
          title="Refresh Git Status"
          className="p-1 hover:text-white text-[#858585] rounded hover:bg-[#252525] transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Commit Input Box */}
      <div className="p-2 border-b border-[#2b2b2b] space-y-1.5 shrink-0">
        <textarea
          rows={2}
          placeholder="Message (Cmd+Enter to commit)"
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              handleCommit();
            }
          }}
          className="w-full p-2 bg-[#141414] border border-[#2b2b2b] rounded text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0078d4] resize-none leading-relaxed"
        />

        <button
          onClick={handleCommit}
          disabled={committing || !commitMessage.trim()}
          className="w-full py-1.5 rounded bg-[#0078d4] hover:bg-[#026ec1] disabled:opacity-30 text-white text-[11px] font-normal transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>{committing ? 'Committing...' : 'Commit Changes'}</span>
        </button>

        {statusMessage && (
          <div className="text-[10px] text-[#3fb950] text-center font-medium">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto p-1">
        <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-[#858585] uppercase">
          <span>Changes ({files.length})</span>
        </div>

        {files.length === 0 ? (
          <div className="p-4 text-center text-[#858585] text-xs">
            Working tree clean. No unstaged changes.
          </div>
        ) : (
          <div className="space-y-0.5">
            {files.map((file, idx) => (
              <div
                key={idx}
                onClick={() => onOpenFile(file.path)}
                className="px-2 py-1 rounded flex items-center justify-between hover:bg-[rgba(255,255,255,0.04)] cursor-pointer text-[#cccccc]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode className="w-3.5 h-3.5 text-[#858585] shrink-0" />
                  <span className="truncate text-xs font-normal">{file.path}</span>
                </div>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold shrink-0 ${getStatusColor(file.code)}`}>
                  {file.code.replace('??', 'U')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
