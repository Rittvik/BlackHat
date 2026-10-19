import React, { useState } from 'react';
import { Search, ChevronRight, ChevronDown, FileCode, RefreshCw, X } from 'lucide-react';

interface SearchResult {
  path: string;
  line: number;
  content: string;
}

interface GlobalSearchProps {
  onOpenFile: (path: string, line?: number) => void;
  apiBase: string;
  workspaceRoot?: string;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onOpenFile, apiBase, workspaceRoot }) => {
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isRegex, setIsRegex] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      if ((window as any).electronAPI?.native?.search) {
        const data = await (window as any).electronAPI.native.search(query, caseSensitive, isRegex, workspaceRoot);
        if (data.success) {
          setResults(data.results || []);
          return;
        }
      }
      const headers: Record<string, string> = {};
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(
        `${apiBase}/api/search?q=${encodeURIComponent(query)}&caseSensitive=${caseSensitive}&isRegex=${isRegex}`,
        { headers }
      );
      const data = await res.json();
      if (data.success) {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group results by file
  const grouped = results.reduce((acc, r) => {
    if (!acc[r.path]) acc[r.path] = [];
    acc[r.path].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="w-full h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] select-none text-xs font-sans">
      {/* Header */}
      <div className="h-[35px] px-3 flex items-center justify-between border-b border-[#2b2b2b] bg-[#181818] shrink-0">
        <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase">
          Search
        </span>
        <button
          onClick={() => {
            setQuery('');
            setResults([]);
            setSearched(false);
          }}
          title="Clear Search"
          className="p-1 hover:text-white text-[#858585] rounded hover:bg-[#252525] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Search Input Box */}
      <div className="p-2 border-b border-[#2b2b2b] space-y-1.5 shrink-0">
        <form onSubmit={handleSearch} className="relative flex items-center bg-[#141414] border border-[#2b2b2b] rounded focus-within:border-[#0078d4]">
          <input
            type="text"
            placeholder="Search files..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-transparent text-xs text-white placeholder-[#666666] focus:outline-none"
          />
          <div className="flex items-center pr-1 gap-0.5">
            <button
              type="button"
              onClick={() => setCaseSensitive(prev => !prev)}
              title="Match Case"
              className={`px-1 py-0.5 rounded text-[10px] font-mono transition-colors ${
                caseSensitive ? 'bg-[#0078d4] text-white' : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              Aa
            </button>
            <button
              type="button"
              onClick={() => setIsRegex(prev => !prev)}
              title="Use Regular Expression"
              className={`px-1 py-0.5 rounded text-[10px] font-mono transition-colors ${
                isRegex ? 'bg-[#0078d4] text-white' : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              .*
            </button>
          </div>
        </form>

        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="w-full py-1 rounded bg-[#0078d4] hover:bg-[#026ec1] disabled:opacity-30 text-white text-[11px] font-normal transition-colors flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <Search className="w-3 h-3" />
          )}
          <span>{loading ? 'Searching...' : 'Find Matches'}</span>
        </button>
      </div>

      {/* Results Tree */}
      <div className="flex-1 overflow-y-auto p-1">
        {loading && (
          <div className="p-4 text-center text-[#858585] text-xs">
            Searching workspace...
          </div>
        )}

        {!loading && searched && results.length === 0 && (
          <div className="p-4 text-center text-[#858585] text-xs">
            No results found for "{query}"
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-2 py-1">
            <div className="px-2 text-[10px] text-[#858585] font-semibold uppercase">
              {results.length} matches across {Object.keys(grouped).length} files
            </div>

            {Object.entries(grouped).map(([filePath, matches]) => (
              <div key={filePath} className="border-b border-[#222222] pb-1">
                {/* File Header */}
                <div 
                  onClick={() => onOpenFile(filePath)}
                  className="px-2 py-1 flex items-center justify-between hover:bg-[rgba(255,255,255,0.04)] cursor-pointer rounded text-[#cccccc]"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileCode className="w-3.5 h-3.5 text-[#58a6ff] shrink-0" />
                    <span className="truncate font-medium">{filePath}</span>
                  </div>
                  <span className="px-1.5 rounded-full bg-[#222222] text-[#858585] text-[9px] shrink-0">
                    {matches.length}
                  </span>
                </div>

                {/* Match Lines */}
                <div className="pl-4 space-y-0.5 mt-0.5">
                  {matches.map((m, idx) => (
                    <div
                      key={idx}
                      onClick={() => onOpenFile(filePath, m.line)}
                      className="px-2 py-0.5 text-[11px] font-mono text-[#858585] hover:text-white hover:bg-[rgba(255,255,255,0.05)] cursor-pointer rounded flex items-center gap-2"
                    >
                      <span className="text-[#555555] select-none text-[10px]">{m.line}:</span>
                      <span className="truncate">{m.content}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
