import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Download, 
  Star, 
  Sparkles, 
  Cpu, 
  Code2, 
  Palette, 
  Wrench, 
  ShieldCheck, 
  Layers,
  ExternalLink,
  CheckCircle,
  RefreshCw,
  X,
  PackageCheck
} from 'lucide-react';
import { ExtensionItem } from '../../types';

export const INITIAL_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'google.gemini-code-assist',
    name: 'gemini-code-assist',
    displayName: 'Google Gemini Code Assist',
    description: 'Autonomous AI completions, whole-file generation, and Gemini 2.5 Pro architecture reasoning.',
    version: '2.5.0',
    publisher: 'Google Cloud',
    iconName: 'Sparkles',
    downloads: '1.2M',
    rating: 4.9,
    category: 'AI & Agents',
    installed: true,
    enabled: true,
    tags: ['ai', 'gemini', 'code-completion', 'google'],
    verified: true
  },
  {
    id: 'Anthropic.claude-code',
    name: 'claude-code',
    displayName: 'Claude Code for VS Code',
    description: 'Harness the power of Claude Code without leaving your IDE. Deep reasoning, code refactoring and tool calling.',
    version: '2.1.303',
    publisher: 'Anthropic',
    iconUrl: 'https://open-vsx.org/api/Anthropic/claude-code/alpine-arm64/2.1.303/file/claude-logo.png',
    downloads: '59.1M',
    rating: 4.8,
    category: 'AI & Agents',
    installed: true,
    enabled: true,
    tags: ['ai', 'claude', 'anthropic', 'thinking'],
    verified: true
  },
  {
    id: 'openai.codex-copilot',
    name: 'codex-copilot',
    displayName: 'OpenAI Codex & Copilot',
    description: 'Codex agent integration with live code repair, unit test generation, and GPT-4o synthesis.',
    version: '4.2.0',
    publisher: 'OpenAI',
    iconName: 'Code2',
    downloads: '2.4M',
    rating: 4.8,
    category: 'AI & Agents',
    installed: true,
    enabled: true,
    tags: ['ai', 'codex', 'gpt-4o', 'openai'],
    verified: true
  },
  {
    id: 'blackhat.rea-toolkit',
    name: 'rea-toolkit',
    displayName: 'REA Reverse Engineering Suite',
    description: 'Inspect Mach-O binaries, PE files, ASAR bundles, runtime memory, and disassemble native instructions.',
    version: '6.7.0',
    publisher: 'BlackHat Systems',
    iconName: 'ShieldCheck',
    downloads: '380k',
    rating: 5.0,
    category: 'Tools',
    installed: true,
    enabled: true,
    tags: ['rea', 'reverse-engineering', 'binary', 'electron'],
    verified: true
  },
  {
    id: 'ms-python.python',
    name: 'python',
    displayName: 'Python Intelligence Server',
    description: 'Rich support for Python 3.12+, including Pylance, debugging, environments, and notebooks.',
    version: '2026.4.0',
    publisher: 'ms-python',
    iconUrl: 'https://open-vsx.org/api/ms-python/python/2026.4.0/file/icon.png',
    downloads: '61.0M',
    rating: 4.7,
    category: 'Languages',
    installed: false,
    enabled: true,
    tags: ['python', 'pylance', 'jupyter'],
    verified: true
  },
  {
    id: 'bradlc.vscode-tailwindcss',
    name: 'vscode-tailwindcss',
    displayName: 'Tailwind CSS IntelliSense',
    description: 'Intelligent Tailwind CSS tooling for VS Code & Antigravity IDE including autocomplete and linting.',
    version: '0.12.8',
    publisher: 'Tailwind Labs',
    iconName: 'Palette',
    downloads: '7.8M',
    rating: 4.8,
    category: 'Formatters',
    installed: true,
    enabled: true,
    tags: ['tailwind', 'css', 'design'],
    verified: true
  },
  {
    id: 'esbenp.prettier-vscode',
    name: 'prettier-vscode',
    displayName: 'Prettier - Code Formatter',
    description: 'Opinionated code formatter supporting JavaScript, TypeScript, HTML, CSS, JSON, and Markdown.',
    version: '11.0.0',
    publisher: 'esbenp',
    iconName: 'Wrench',
    downloads: '24M',
    rating: 4.6,
    category: 'Formatters',
    installed: false,
    enabled: true,
    tags: ['formatter', 'prettier', 'code-style'],
    verified: true
  }
];

interface ExtensionsStoreProps {
  extensions: ExtensionItem[];
  onToggleInstall: (extensionId: string) => void;
  onToggleEnable: (extensionId: string) => void;
  onInstallExtension?: (extension: ExtensionItem) => void;
  onUninstallExtension?: (extensionId: string) => void;
  apiBase?: string;
}

export const ExtensionsStore: React.FC<ExtensionsStoreProps> = ({
  extensions,
  onToggleInstall,
  onToggleEnable,
  onInstallExtension,
  onUninstallExtension,
  apiBase = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tab, setTab] = useState<'marketplace' | 'installed'>('marketplace');
  const [openVsxExtensions, setOpenVsxExtensions] = useState<ExtensionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingOpenVsx, setUsingOpenVsx] = useState(true);

  const categories = ['All', 'AI & Agents', 'Languages', 'Formatters', 'Tools', 'Linters', 'Themes'];
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Format download numbers
  const formatDownloads = (num: number): string => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  // Convert Open VSX JSON raw response to ExtensionItem
  const mapOpenVsxToExtension = (raw: any): ExtensionItem => {
    const id = `${raw.namespace}.${raw.name}`;
    const installedMatch = extensions.find(e => e.id === id);

    let category = 'Tools';
    const desc = (raw.description || '').toLowerCase();
    const name = (raw.name || '').toLowerCase();
    if (desc.includes('ai') || desc.includes('gpt') || desc.includes('llm') || desc.includes('claude') || desc.includes('gemini') || name.includes('ai')) {
      category = 'AI & Agents';
    } else if (desc.includes('python') || desc.includes('java') || desc.includes('typescript') || desc.includes('rust') || desc.includes('go') || desc.includes('language')) {
      category = 'Languages';
    } else if (desc.includes('format') || desc.includes('prettier') || desc.includes('beautif')) {
      category = 'Formatters';
    } else if (desc.includes('theme') || desc.includes('icon') || desc.includes('color')) {
      category = 'Themes';
    } else if (desc.includes('lint') || desc.includes('eslint')) {
      category = 'Linters';
    }

    return {
      id,
      name: raw.name,
      displayName: raw.displayName || raw.name,
      description: raw.description || 'Open VSX marketplace extension',
      version: raw.version || '1.0.0',
      publisher: raw.namespace,
      iconUrl: raw.files?.icon,
      downloadUrl: raw.files?.download,
      downloads: formatDownloads(raw.downloadCount || 0),
      rating: raw.averageRating ? Math.round(raw.averageRating * 10) / 10 : 5.0,
      category,
      installed: installedMatch ? installedMatch.installed : false,
      enabled: installedMatch ? installedMatch.enabled : true,
      tags: [raw.namespace, raw.name],
      verified: !!raw.verified
    };
  };

  // Fetch extensions from Open VSX
  const fetchOpenVsx = async (query = '', category = 'All') => {
    setLoading(true);
    try {
      // 1. First attempt through local Express proxy endpoint
      let data = null;
      try {
        const res = await fetch(
          `${apiBase}/api/extensions/openvsx?query=${encodeURIComponent(query)}&size=30&category=${encodeURIComponent(category)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.extensions) {
            data = json.extensions;
          }
        }
      } catch (e) {
        // Fallback to direct Open VSX API
      }

      // 2. Direct fetch to Open VSX public registry if proxy was unavailable
      if (!data) {
        let directUrl = `https://open-vsx.org/api/-/search?size=30&sortBy=downloadCount&sortOrder=desc`;
        if (query.trim()) {
          directUrl += `&query=${encodeURIComponent(query.trim())}`;
        }
        const directRes = await fetch(directUrl);
        if (directRes.ok) {
          const directJson = await directRes.json();
          data = directJson.extensions;
        }
      }

      if (data && Array.isArray(data)) {
        const mapped = data.map(mapOpenVsxToExtension);
        setOpenVsxExtensions(mapped);
        setUsingOpenVsx(true);
      } else {
        setOpenVsxExtensions(INITIAL_EXTENSIONS);
        setUsingOpenVsx(false);
      }
    } catch (err) {
      console.warn('Failed to query Open VSX, falling back to local registry:', err);
      setOpenVsxExtensions(INITIAL_EXTENSIONS);
      setUsingOpenVsx(false);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOpenVsx();
  }, []);

  // Debounced search when query changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchOpenVsx(searchQuery, selectedCategory);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, selectedCategory]);

  const handleInstallClick = (ext: ExtensionItem) => {
    if (onInstallExtension) {
      onInstallExtension(ext);
    } else {
      onToggleInstall(ext.id);
    }
  };

  const handleUninstallClick = (extensionId: string) => {
    if (onUninstallExtension) {
      onUninstallExtension(extensionId);
    } else {
      onToggleInstall(extensionId);
    }
  };

  // Display list depending on active tab
  const displayExtensions = tab === 'installed'
    ? extensions.filter(e => e.installed)
    : openVsxExtensions.map(oe => {
        // Synchronize installed state with the parent extensions prop
        const matching = extensions.find(e => e.id === oe.id);
        return matching ? { ...oe, installed: matching.installed, enabled: matching.enabled } : oe;
      });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI & Agents':
        return <Sparkles className="w-4 h-4 text-[#58a6ff]" />;
      case 'Languages':
        return <Code2 className="w-4 h-4 text-[#388bfd]" />;
      case 'Themes':
        return <Palette className="w-4 h-4 text-[#bc8cff]" />;
      case 'Formatters':
        return <Wrench className="w-4 h-4 text-[#d29922]" />;
      case 'Tools':
        return <ShieldCheck className="w-4 h-4 text-[#3fb950]" />;
      default:
        return <Layers className="w-4 h-4 text-[#858585]" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#181818] border-r border-[#2b2b2b] select-none overflow-hidden font-sans text-xs">
      {/* Header */}
      <div className="h-[35px] px-2.5 flex items-center justify-between border-b border-[#2b2b2b] bg-[#181818] shrink-0 gap-1 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider text-[#bbbbbb] uppercase truncate min-w-0">
            Extensions
          </span>
          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#0078d4]/15 text-[#58a6ff] border border-[#0078d4]/30 font-medium shrink-0">
            Open VSX
          </span>
        </div>

        <div className="flex items-center gap-0.5 text-[10px] shrink-0">
          <button
            onClick={() => setTab('marketplace')}
            className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${
              tab === 'marketplace'
                ? 'bg-[#252525] text-white font-medium'
                : 'text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setTab('installed')}
            className={`px-1.5 py-0.5 rounded transition-colors whitespace-nowrap ${
              tab === 'installed'
                ? 'bg-[#252525] text-white font-medium'
                : 'text-[#858585] hover:text-[#cccccc]'
            }`}
          >
            Installed ({extensions.filter(e => e.installed).length})
          </button>
        </div>
      </div>

      {/* Search Bar & Registry Banner */}
      <div className="p-2 border-b border-[#2b2b2b] space-y-1.5 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search Open VSX Registry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1 bg-[#141414] border border-[#2b2b2b] rounded text-xs text-white placeholder-[#666666] focus:outline-none focus:border-[#0078d4]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-2 text-[#858585] hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#252525] text-white font-medium border border-[#333333]'
                  : 'text-[#858585] hover:text-[#cccccc]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Open VSX Registry Info Strip */}
        <div className="flex items-center justify-between text-[10px] text-[#666666] px-1 pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2ea043]" />
            <span>Marketplace: open-vsx.org</span>
          </span>
          <button
            onClick={() => fetchOpenVsx(searchQuery, selectedCategory)}
            title="Refresh Open VSX Extensions"
            className="hover:text-white text-[#858585] p-0.5"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${loading ? 'animate-spin text-[#0078d4]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222222] p-1">
        {loading && openVsxExtensions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#858585] flex flex-col items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0078d4]" />
            <span>Querying Open VSX Registry...</span>
          </div>
        ) : displayExtensions.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#858585]">
            {tab === 'installed' 
              ? 'No extensions installed yet. Browse the Marketplace to install.' 
              : `No extensions found for "${searchQuery}"`}
          </div>
        ) : (
          displayExtensions.map((ext) => (
            <div
              key={ext.id}
              className="p-2.5 hover:bg-[rgba(255,255,255,0.03)] transition-colors rounded flex flex-col gap-1.5 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  {/* Extension Icon */}
                  <div className="w-8 h-8 rounded bg-[#202020] border border-[#2e2e2e] flex items-center justify-center shrink-0 overflow-hidden">
                    {ext.iconUrl ? (
                      <img 
                        src={ext.iconUrl} 
                        alt={ext.name} 
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          // Fallback to icon if remote image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }} 
                      />
                    ) : (
                      getCategoryIcon(ext.category)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-white truncate group-hover:text-[#58a6ff] transition-colors">
                        {ext.displayName}
                      </span>
                      <span className="text-[10px] text-[#858585] font-mono">v{ext.version}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-[#858585] mt-0.5 flex-wrap">
                      <span className="text-[#cccccc] flex items-center gap-0.5">
                        {ext.publisher}
                        {ext.verified && (
                          <CheckCircle className="w-2.5 h-2.5 text-[#58a6ff] fill-[#58a6ff]/20 ml-0.5" />
                        )}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Download className="w-2.5 h-2.5" />
                        {ext.downloads}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-[#d29922]">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {ext.rating}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0">
                  {ext.installed ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleEnable(ext.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-normal transition-colors border ${
                          ext.enabled
                            ? 'bg-[#2ea043]/15 text-[#3fb950] border-[#2ea043]/30'
                            : 'bg-[#222222] text-[#858585] border-[#2e2e2e]'
                        }`}
                      >
                        {ext.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => handleUninstallClick(ext.id)}
                        className="px-1.5 py-0.5 rounded text-[10px] text-[#858585] hover:text-[#f85149] transition-colors"
                      >
                        Uninstall
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleInstallClick(ext)}
                      className="px-2.5 py-0.5 rounded bg-[#0078d4] hover:bg-[#026ec1] text-white text-[10px] font-normal transition-colors cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <Download className="w-2.5 h-2.5" />
                      <span>Install</span>
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-[#858585] line-clamp-2 leading-relaxed">
                {ext.description}
              </p>

              {/* Open VSX link */}
              <div className="flex items-center justify-between text-[10px] text-[#555555] pt-0.5">
                <span className="px-1.5 py-0.2 rounded bg-[#1c1c1c] text-[#858585] text-[9px]">
                  {ext.category}
                </span>
                <a
                  href={`https://open-vsx.org/extension/${ext.publisher}/${ext.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[#58a6ff] transition-colors"
                >
                  <span>Open VSX</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
