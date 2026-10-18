import React, { useState } from 'react';
import { 
  Search, 
  Download, 
  Star, 
  Check, 
  Sparkles, 
  Cpu, 
  Code2, 
  Palette, 
  Wrench, 
  ShieldCheck, 
  ExternalLink,
  Layers,
  Filter
} from 'lucide-react';
import { ExtensionItem } from '../../types';

export const INITIAL_EXTENSIONS: ExtensionItem[] = [
  {
    id: 'google.gemini-code-assist',
    name: 'gemini-code-assist',
    displayName: 'Google Gemini Code Assist',
    description: 'Autonomous AI code completions, whole-file generation, and Gemini 2.5 Pro architecture reasoning.',
    version: '2.5.0',
    publisher: 'Google Cloud',
    iconName: 'Sparkles',
    downloads: '1.2M',
    rating: 4.9,
    category: 'AI & Agents',
    installed: true,
    enabled: true,
    tags: ['ai', 'gemini', 'code-completion', 'google']
  },
  {
    id: 'anthropic.claude-code-companion',
    name: 'claude-code-companion',
    displayName: 'Claude Code Companion',
    description: 'Deep reasoning, extended thinking blocks, and multi-file refactoring powered by Claude 3.7 Sonnet.',
    version: '3.7.1',
    publisher: 'Anthropic',
    iconName: 'Cpu',
    downloads: '940k',
    rating: 4.9,
    category: 'AI & Agents',
    installed: true,
    enabled: true,
    tags: ['ai', 'claude', 'anthropic', 'thinking']
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
    tags: ['ai', 'codex', 'gpt-4o', 'openai']
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
    tags: ['rea', 'reverse-engineering', 'binary', 'electron']
  },
  {
    id: 'ms-python.python',
    name: 'python',
    displayName: 'Python Intelligence Server',
    description: 'Rich support for Python 3.12+, including Pylance, debugging, environments, and notebooks.',
    version: '2026.2.0',
    publisher: 'Microsoft',
    iconName: 'Layers',
    downloads: '18M',
    rating: 4.7,
    category: 'Languages',
    installed: false,
    enabled: true,
    tags: ['python', 'pylance', 'jupyter']
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
    tags: ['tailwind', 'css', 'design']
  },
  {
    id: 'esbenp.prettier-vscode',
    name: 'prettier-vscode',
    displayName: 'Prettier - Code Formatter',
    description: 'Opinionated code formatter supporting JavaScript, TypeScript, HTML, CSS, JSON, and Markdown.',
    version: '11.0.0',
    publisher: 'Prettier',
    iconName: 'Wrench',
    downloads: '24M',
    rating: 4.6,
    category: 'Formatters',
    installed: false,
    enabled: true,
    tags: ['formatter', 'prettier', 'code-style']
  },
  {
    id: 'blackhat.theme-obsidian-pro',
    name: 'theme-obsidian-pro',
    displayName: 'Antigravity Obsidian Cyberpunk Theme',
    description: 'Deep space dark theme with emerald & indigo neon highlights tailored for multi-agent workflows.',
    version: '1.4.0',
    publisher: 'BlackHat Design',
    iconName: 'Palette',
    downloads: '150k',
    rating: 4.9,
    category: 'Themes',
    installed: true,
    enabled: true,
    tags: ['theme', 'dark', 'cyberpunk', 'antigravity']
  }
];

interface ExtensionsStoreProps {
  extensions: ExtensionItem[];
  onToggleInstall: (extensionId: string) => void;
  onToggleEnable: (extensionId: string) => void;
}

export const ExtensionsStore: React.FC<ExtensionsStoreProps> = ({
  extensions,
  onToggleInstall,
  onToggleEnable
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tab, setTab] = useState<'marketplace' | 'installed'>('marketplace');

  const categories = ['All', 'AI & Agents', 'Languages', 'Themes', 'Formatters', 'Tools'];

  const filteredExtensions = extensions.filter(ext => {
    const matchesSearch = 
      ext.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ext.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || ext.category === selectedCategory;
    const matchesTab = tab === 'marketplace' ? true : ext.installed;

    return matchesSearch && matchesCategory && matchesTab;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI & Agents':
        return <Sparkles className="w-3.5 h-3.5 text-ide-accent" />;
      case 'Languages':
        return <Code2 className="w-3.5 h-3.5 text-ide-cyan" />;
      case 'Themes':
        return <Palette className="w-3.5 h-3.5 text-ide-purple" />;
      case 'Formatters':
        return <Wrench className="w-3.5 h-3.5 text-ide-amber" />;
      case 'Tools':
        return <ShieldCheck className="w-3.5 h-3.5 text-ide-emerald" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-ide-muted" />;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-ide-sidebar border-r border-ide-border select-none overflow-hidden">
      {/* Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-ide-border bg-ide-sidebar shrink-0">
        <span className="text-xs font-semibold tracking-wider text-ide-text uppercase">
          Extensions Store
        </span>
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setTab('marketplace')}
            className={`px-2 py-0.5 rounded transition-colors ${
              tab === 'marketplace'
                ? 'bg-ide-accent/20 text-ide-accent font-medium'
                : 'text-ide-muted hover:text-white'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setTab('installed')}
            className={`px-2 py-0.5 rounded transition-colors ${
              tab === 'installed'
                ? 'bg-ide-accent/20 text-ide-accent font-medium'
                : 'text-ide-muted hover:text-white'
            }`}
          >
            Installed ({extensions.filter(e => e.installed).length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-ide-border shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ide-muted absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search extensions in Marketplace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 bg-ide-darkest border border-ide-border rounded text-xs text-white placeholder-ide-muted/60 focus:outline-none focus:border-ide-accent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 mt-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-ide-accent text-white font-medium'
                  : 'bg-ide-card text-ide-muted hover:text-white hover:bg-ide-hover'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Extension List */}
      <div className="flex-1 overflow-y-auto divide-y divide-ide-border/40 p-1">
        {filteredExtensions.length === 0 ? (
          <div className="p-6 text-center text-xs text-ide-muted">
            No extensions found matching your filter.
          </div>
        ) : (
          filteredExtensions.map((ext) => (
            <div
              key={ext.id}
              className="p-3 hover:bg-ide-panel/60 transition-colors rounded-lg flex flex-col gap-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-ide-card border border-ide-border flex items-center justify-center shrink-0">
                    {getCategoryIcon(ext.category)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">
                        {ext.displayName}
                      </span>
                      <span className="text-[10px] text-ide-muted">v{ext.version}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-ide-muted mt-0.5">
                      <span className="text-ide-accent hover:underline cursor-pointer">
                        {ext.publisher}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Download className="w-2.5 h-2.5" />
                        {ext.downloads}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-ide-amber">
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
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                          ext.enabled
                            ? 'bg-ide-emerald/20 text-ide-emerald border border-ide-emerald/30 hover:bg-ide-emerald/30'
                            : 'bg-ide-card text-ide-muted border border-ide-border hover:text-white'
                        }`}
                      >
                        {ext.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                      <button
                        onClick={() => onToggleInstall(ext.id)}
                        className="px-2 py-0.5 rounded text-[10px] text-ide-muted hover:text-ide-rose hover:bg-ide-rose/10 transition-colors"
                      >
                        Uninstall
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onToggleInstall(ext.id)}
                      className="px-2.5 py-1 rounded bg-ide-accent hover:bg-ide-accentHover text-white text-[10px] font-medium transition-colors shadow-sm"
                    >
                      Install
                    </button>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-ide-muted line-clamp-2 leading-relaxed">
                {ext.description}
              </p>

              {/* Tags */}
              <div className="flex items-center gap-1 flex-wrap">
                {ext.tags.map(t => (
                  <span
                    key={t}
                    className="px-1.5 py-0.2 rounded text-[9px] bg-ide-darkest text-ide-muted border border-ide-border/60"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
