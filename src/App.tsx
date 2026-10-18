import React, { useState, useEffect, useRef } from 'react';
import { ActivityBar } from './components/Sidebar/ActivityBar';
import { FileTree } from './components/Explorer/FileTree';
import { ExtensionsStore, INITIAL_EXTENSIONS } from './components/Extensions/ExtensionsStore';
import { EditorTabs } from './components/Editor/EditorTabs';
import { MonacoCodeEditor } from './components/Editor/MonacoCodeEditor';
import { IntegratedTerminal } from './components/Terminal/IntegratedTerminal';
import { AgentWindowContainer } from './components/AgentWindow/AgentWindowContainer';
import { StatusBar } from './components/StatusBar/StatusBar';
import { SettingsModal } from './components/Modals/SettingsModal';
import { AccountModal } from './components/Modals/AccountModal';
import { AddAgentModal } from './components/Modals/AddAgentModal';
import { CommandPalette } from './components/Modals/CommandPalette';
import { 
  FileNode, 
  EditorTab, 
  AgentInstance, 
  AISettings, 
  TerminalEntry, 
  UserProfile, 
  ExtensionItem, 
  SharedContextItem 
} from './types';
import { getLanguageFromPath } from './utils/language';

const DEFAULT_SETTINGS: AISettings = {
  geminiApiKey: '',
  anthropicApiKey: '',
  openaiApiKey: '',
  ollamaUrl: 'http://localhost:11434',
  defaultProvider: 'gemini',
  defaultModel: 'gemini-2.5-pro',
  subscriptions: {
    gemini: {
      provider: 'gemini',
      planName: 'Google Gemini Advanced (Google One)',
      isActive: true,
      accountEmail: 'developer@google.com',
      tier: 'Pro'
    },
    claude: {
      provider: 'claude',
      planName: 'Anthropic Claude Code & Pro',
      isActive: true,
      accountEmail: 'developer@anthropic.com',
      tier: 'Pro'
    },
    codex: {
      provider: 'codex',
      planName: 'OpenAI ChatGPT Plus / Codex',
      isActive: true,
      accountEmail: 'developer@openai.com',
      tier: 'Pro'
    }
  }
};

const DEFAULT_USER: UserProfile = {
  id: 'usr_guest',
  name: 'Dev Operator',
  email: 'developer@blackhat.ide',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  provider: 'google',
  isLoggedIn: true,
  subscriptionTier: 'Pro',
  linkedAccounts: {
    google: {
      email: 'developer@google.com',
      name: 'Google Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      linkedAt: '2026-10-18'
    },
    github: {
      username: 'blackhat-dev',
      name: 'BlackHat Developer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      linkedAt: '2026-10-18'
    }
  }
};

// Three Default Agents: ARCHITECT, DEVELOPER, TESTER
const INITIAL_AGENTS: AgentInstance[] = [
  {
    id: 'agent-architect',
    name: 'Architect',
    role: 'ARCHITECT',
    description: 'Decomposes complex requirements into architectural blueprints, data flow models, and technical specifications.',
    avatarColor: 'bg-indigo-600',
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    status: 'idle',
    messages: [],
    input: '',
    isMinimized: false,
    systemPrompt: 'You are the Lead Architect agent in BlackHat IDE. Create modular system designs and task contracts.'
  },
  {
    id: 'agent-developer',
    name: 'Developer',
    role: 'DEVELOPER',
    description: 'Implements production code, executes tools, refactors modules, and resolves technical defects.',
    avatarColor: 'bg-cyan-600',
    provider: 'anthropic',
    model: 'claude-3-7-sonnet',
    status: 'idle',
    messages: [],
    input: '',
    isMinimized: false,
    systemPrompt: 'You are the Core Developer agent in BlackHat IDE. Write clean, working code and execute file operations.'
  },
  {
    id: 'agent-tester',
    name: 'Tester',
    role: 'TESTER',
    description: 'Automates testing, checks boundary assertions, verifies edge conditions, and enforces regression prevention.',
    avatarColor: 'bg-emerald-600',
    provider: 'openai',
    model: 'gpt-4o',
    status: 'idle',
    messages: [],
    input: '',
    isMinimized: false,
    systemPrompt: 'You are the QA & Testing agent in BlackHat IDE. Generate comprehensive unit tests and validate edge cases.'
  }
];

export const App: React.FC = () => {
  // Navigation & panels
  const [activeView, setActiveView] = useState<'explorer' | 'search' | 'extensions'>('explorer');
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Layout widths
  const [sidebarWidth, setSidebarWidth] = useState<number>(270);
  const [agentWindowWidth, setAgentWindowWidth] = useState<number>(490);

  // Files & Tabs
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<EditorTab[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);

  // Terminal history
  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>([]);

  // Multi-Agent State
  const [agents, setAgents] = useState<AgentInstance[]>(() => {
    try {
      const saved = localStorage.getItem('blackhat_agents');
      return saved ? JSON.parse(saved) : INITIAL_AGENTS;
    } catch {
      return INITIAL_AGENTS;
    }
  });

  // Shared Context Bus items
  const [sharedContextItems, setSharedContextItems] = useState<SharedContextItem[]>([
    {
      id: 'ctx-init-1',
      fromAgentId: 'agent-architect',
      fromAgentName: 'Architect',
      fromAgentRole: 'ARCHITECT',
      timestamp: Date.now() - 360000,
      type: 'plan',
      title: 'BlackHat IDE Multi-Agent Architecture Plan',
      content: '1. Modular Agent Studio: Support parallel vertical execution of Architect, Developer, and Tester.\n2. Context Bus: Inter-agent handoffs with shared blackboard.\n3. Native Desktop Shell: macOS hiddenInset and Windows titlebar integration.'
    }
  ]);

  // Extensions Store State
  const [extensions, setExtensions] = useState<ExtensionItem[]>(() => {
    try {
      const saved = localStorage.getItem('blackhat_extensions');
      return saved ? JSON.parse(saved) : INITIAL_EXTENSIONS;
    } catch {
      return INITIAL_EXTENSIONS;
    }
  });

  // User Profile Auth State
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('blackhat_user_profile');
      return saved ? JSON.parse(saved) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  // AI Settings State
  const [settings, setSettings] = useState<AISettings>(() => {
    try {
      const saved = localStorage.getItem('antigravity_ai_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Save state helpers
  useEffect(() => {
    localStorage.setItem('blackhat_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('blackhat_extensions', JSON.stringify(extensions));
  }, [extensions]);

  useEffect(() => {
    localStorage.setItem('blackhat_user_profile', JSON.stringify(user));
  }, [user]);

  // Load file tree on startup
  const loadFiles = async () => {
    try {
      const res = await fetch('/api/files');
      const data = await res.json();
      if (data.success && data.tree) {
        setFileTree(data.tree);
      }
    } catch (err) {
      console.error('Failed to load file tree:', err);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabIndex]);

  // File Operations
  const handleSelectFile = async (filePath: string) => {
    const existingIndex = tabs.findIndex(t => t.path === filePath);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
      return;
    }

    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.success) {
        const newTab: EditorTab = {
          path: filePath,
          name: filePath.split('/').pop() || filePath,
          content: data.content,
          originalContent: data.content,
          isDirty: false,
          language: getLanguageFromPath(filePath)
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabIndex(tabs.length);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  };

  const handleCreateFile = async (filePath: string, isDirectory: boolean) => {
    try {
      await fetch('/api/file/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, isDirectory, content: '' })
      });
      await loadFiles();
      if (!isDirectory) {
        await handleSelectFile(filePath);
      }
    } catch (err) {
      console.error('Failed to create file:', err);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    try {
      await fetch(`/api/file?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE'
      });
      setTabs(prev => prev.filter(t => t.path !== filePath));
      await loadFiles();
    } catch (err) {
      console.error('Failed to delete file:', err);
    }
  };

  const handleSaveFile = async () => {
    const activeTab = tabs[activeTabIndex];
    if (!activeTab || !activeTab.isDirty) return;

    try {
      await fetch('/api/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: activeTab.path, content: activeTab.content })
      });
      setTabs(prev => prev.map((t, idx) => 
        idx === activeTabIndex ? { ...t, isDirty: false, originalContent: t.content } : t
      ));
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  };

  const handleChangeEditorContent = (newContent: string) => {
    setTabs(prev => prev.map((t, idx) => {
      if (idx === activeTabIndex) {
        return {
          ...t,
          content: newContent,
          isDirty: newContent !== t.originalContent
        };
      }
      return t;
    }));
  };

  const handleCloseTab = (index: number) => {
    setTabs(prev => prev.filter((_, idx) => idx !== index));
    if (activeTabIndex >= index && activeTabIndex > 0) {
      setActiveTabIndex(prev => prev - 1);
    }
  };

  // Terminal execution
  const handleRunTerminalCommand = async (command: string) => {
    try {
      const res = await fetch('/api/terminal/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      setTerminalEntries(prev => [
        ...prev,
        {
          id: `cmd_${Date.now()}`,
          command,
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          exitCode: data.exitCode,
          timestamp: Date.now()
        }
      ]);
      loadFiles();
    } catch (err: any) {
      setTerminalEntries(prev => [
        ...prev,
        {
          id: `cmd_${Date.now()}`,
          command,
          stdout: '',
          stderr: err.message || 'Error running command',
          exitCode: 1,
          timestamp: Date.now()
        }
      ]);
    }
  };

  // Multi-Agent Execution Engine with Context Exchange
  const handleSendMessage = async (agentId: string, customPrompt?: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const promptText = (customPrompt || agent.input).trim();
    if (!promptText) return;

    const userMsgId = `msg_${Date.now()}`;
    const assistantMsgId = `asst_${Date.now() + 1}`;

    setAgents(prev => prev.map(a => {
      if (a.id === agentId) {
        return {
          ...a,
          input: '',
          status: 'thinking',
          currentThought: `Activating ${a.role} agent and reasoning over workspace...`,
          messages: [
            ...a.messages,
            { id: userMsgId, role: 'user', content: promptText, timestamp: Date.now() },
            { id: assistantMsgId, role: 'assistant', content: '', thoughts: [], toolCalls: [], timestamp: Date.now() }
          ]
        };
      }
      return a;
    }));

    try {
      const activeTab = tabs[activeTabIndex];
      const activeFilePath = activeTab?.path;

      // Check if this provider has an active subscription
      const hasSubscription = 
        (agent.provider === 'gemini' && settings.subscriptions.gemini.isActive) ||
        (agent.provider === 'anthropic' && settings.subscriptions.claude.isActive) ||
        (agent.provider === 'openai' && settings.subscriptions.codex.isActive);

      const response = await fetch('/api/agent/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          role: agent.role,
          name: agent.name,
          prompt: promptText,
          history: agent.messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          config: {
            provider: agent.provider,
            model: agent.model,
            apiKey: agent.provider === 'gemini' 
              ? settings.geminiApiKey 
              : agent.provider === 'anthropic' 
                ? settings.anthropicApiKey 
                : settings.openaiApiKey,
            hasSubscription,
            systemPrompt: agent.systemPrompt,
            baseUrl: settings.ollamaUrl
          },
          workspaceContext: activeFilePath ? `Active open file: ${activeFilePath}` : '',
          sharedContext: sharedContextItems.slice(-4)
        })
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6));
              handleAgentStreamEvent(event, assistantMsgId);
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`Error streaming agent ${agentId}:`, err);
      setAgents(prev => prev.map(a => 
        a.id === agentId ? { ...a, status: 'error', currentThought: undefined } : a
      ));
    }
  };

  const handleAgentStreamEvent = (event: any, assistantMsgId: string) => {
    const { agentId, type } = event;

    setAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;

      if (type === 'status') {
        return { ...a, status: event.status };
      }

      if (type === 'thought') {
        return { ...a, currentThought: event.thought };
      }

      if (type === 'token') {
        return {
          ...a,
          currentThought: undefined,
          status: 'streaming',
          messages: a.messages.map(m => 
            m.id === assistantMsgId ? { ...m, content: m.content + event.token } : m
          )
        };
      }

      if (type === 'tool_call') {
        return {
          ...a,
          status: 'executing_tool',
          messages: a.messages.map(m => 
            m.id === assistantMsgId ? { ...m, toolCalls: [...(m.toolCalls || []), event.tool] } : m
          )
        };
      }

      if (type === 'tool_result') {
        return {
          ...a,
          messages: a.messages.map(m => {
            if (m.id !== assistantMsgId) return m;
            return {
              ...m,
              toolCalls: (m.toolCalls || []).map(tc => 
                tc.name === event.toolName && !tc.result ? { ...tc, result: event.result } : tc
              )
            };
          })
        };
      }

      if (type === 'done') {
        return { ...a, status: 'idle', currentThought: undefined };
      }

      if (type === 'error') {
        return {
          ...a,
          status: 'error',
          currentThought: undefined,
          messages: a.messages.map(m => 
            m.id === assistantMsgId ? { ...m, content: (m.content || '') + `\n\n❌ **Error**: ${event.error}` } : m
          )
        };
      }

      return a;
    }));
  };

  const handleStopAgent = async (agentId: string) => {
    await fetch('/api/agent/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId })
    });
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, status: 'idle', currentThought: undefined } : a
    ));
  };

  const handleClearAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, messages: [], currentThought: undefined } : a
    ));
  };

  const handleSelectAgentModel = (agentId: string, model: string, provider: any) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId ? { ...a, model, provider } : a
    ));
  };

  // Add Custom Agent
  const handleAddNewAgent = (newAgent: AgentInstance) => {
    setAgents(prev => [...prev, newAgent]);
  };

  const handleRemoveCustomAgent = (agentId: string) => {
    setAgents(prev => prev.filter(a => a.id !== agentId));
  };

  // Context Bus operations
  const handleShareToContextBus = (title: string, content: string, type: 'plan' | 'code' | 'test' | 'summary') => {
    const newItem: SharedContextItem = {
      id: `ctx-${Date.now()}`,
      fromAgentId: 'agent',
      fromAgentName: 'Agent Studio',
      fromAgentRole: type === 'plan' ? 'ARCHITECT' : type === 'test' ? 'TESTER' : 'DEVELOPER',
      timestamp: Date.now(),
      type,
      title,
      content
    };
    setSharedContextItems(prev => [newItem, ...prev]);
  };

  // Extensions Store operations
  const handleToggleInstallExtension = (extensionId: string) => {
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, installed: !ext.installed, enabled: true } : ext
    ));
  };

  const handleToggleEnableExtension = (extensionId: string) => {
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, enabled: !ext.enabled } : ext
    ));
  };

  // User Auth operations
  const handleLogin = (provider: 'google' | 'github') => {
    if (provider === 'google') {
      setUser({
        id: 'usr_google_102',
        name: 'Alex Rivera',
        email: 'alex.rivera@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        provider: 'google',
        isLoggedIn: true,
        subscriptionTier: 'Pro',
        linkedAccounts: {
          google: {
            email: 'alex.rivera@gmail.com',
            name: 'Alex Rivera',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            linkedAt: new Date().toISOString()
          },
          github: user.linkedAccounts.github
        }
      });
    } else {
      setUser({
        id: 'usr_github_204',
        name: 'alex-rivera-dev',
        email: 'alex@github.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        provider: 'github',
        isLoggedIn: true,
        subscriptionTier: 'Pro',
        linkedAccounts: {
          google: user.linkedAccounts.google,
          github: {
            username: 'alex-rivera-dev',
            name: 'Alex Rivera',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
            linkedAt: new Date().toISOString()
          }
        }
      });
    }
  };

  const handleLogout = () => {
    setUser({
      id: 'usr_guest',
      name: 'Guest Developer',
      email: 'guest@blackhat.ide',
      avatar: '',
      provider: 'guest',
      isLoggedIn: false,
      subscriptionTier: 'Free',
      linkedAccounts: {}
    });
  };

  const handleUpdateSubscription = (provider: 'gemini' | 'claude' | 'codex', updates: any) => {
    setSettings(prev => ({
      ...prev,
      subscriptions: {
        ...prev.subscriptions,
        [provider]: {
          ...prev.subscriptions[provider],
          ...updates
        }
      }
    }));
  };

  // Run all 3 Default Agents Concurrently (Architect, Developer, Tester)
  const handleRunAllThreeAgentsConcurrently = () => {
    handleSendMessage('agent-architect', 'Review overall system architecture and formulate next milestone specifications.');
    handleSendMessage('agent-developer', 'Inspect active workspace code and implement feature enhancements.');
    handleSendMessage('agent-tester', 'Validate system security, generate assertion suites, and audit edge cases.');
  };

  const activeTab = tabs[activeTabIndex];
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  const platform = (window as any).electronAPI?.platform || (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32');

  return (
    <div className="w-screen h-screen flex flex-col bg-ide-darkest text-ide-text overflow-hidden select-none font-sans">
      {/* Top Application Window Bar with Cross-Platform Support */}
      <div 
        style={{ WebkitAppRegion: 'drag' } as any}
        className={`h-9 px-3 flex items-center justify-between bg-ide-darkest border-b border-ide-border shrink-0 ${
          isElectron && platform === 'darwin' ? 'pl-20' : ''
        }`}
      >
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {(!isElectron && platform === 'darwin') && (
            <div className="flex items-center gap-1.5 mr-1">
              <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 cursor-pointer" />
              <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-500 cursor-pointer" />
            </div>
          )}
          <span className="text-xs font-bold tracking-wider text-white flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-ide-accent/20 border border-ide-accent/40 text-ide-accent text-[10px] font-mono font-semibold">
              BH
            </span>
            <span>BlackHat</span>
            <span className="text-[10px] font-normal text-ide-muted font-sans border-l border-ide-border pl-2">
              Autonomous Multi-Agent IDE
            </span>
          </span>
        </div>

        {/* Center Search / Command Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="px-4 py-1 rounded-md bg-ide-sidebar hover:bg-ide-card border border-ide-border text-xs text-ide-muted flex items-center gap-2 transition-colors cursor-pointer"
        >
          <span>Quick Open & Commands</span>
          <kbd className="px-1.5 py-0.5 rounded bg-ide-panel border border-ide-border text-[10px] font-mono">
            Cmd + K
          </kbd>
        </button>

        {/* Right Section: Multi-Agent Launcher & User Profile Button */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button
            onClick={handleRunAllThreeAgentsConcurrently}
            className="px-2.5 py-1 rounded-md bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 hover:opacity-95 text-white text-[11px] font-medium flex items-center gap-1.5 shadow-sm transition-all"
          >
            <span>⚡ Run Architect, Developer & Tester Concurrently</span>
          </button>

          {/* User Account Button */}
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="px-2 py-1 rounded-md bg-ide-card hover:bg-ide-hover border border-ide-border text-xs flex items-center gap-1.5 text-ide-text transition-colors"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full" />
            ) : null}
            <span className="text-[11px] font-medium">{user.isLoggedIn ? user.name : 'Sign In'}</span>
          </button>

          {/* Windows native window controls in Electron */}
          {isElectron && platform === 'win32' && (
            <div className="flex items-center ml-2 border-l border-ide-border pl-2">
              <button 
                onClick={() => (window as any).electronAPI.minimize()}
                className="w-8 h-7 flex items-center justify-center hover:bg-ide-hover text-ide-muted hover:text-white text-xs"
                title="Minimize"
              >
                &#8212;
              </button>
              <button 
                onClick={() => (window as any).electronAPI.maximize()}
                className="w-8 h-7 flex items-center justify-center hover:bg-ide-hover text-ide-muted hover:text-white text-xs"
                title="Maximize"
              >
                &#9633;
              </button>
              <button 
                onClick={() => (window as any).electronAPI.close()}
                className="w-8 h-7 flex items-center justify-center hover:bg-red-600 text-ide-muted hover:text-white text-xs"
                title="Close"
              >
                &#10005;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Activity Rail */}
        <ActivityBar
          activeView={activeView}
          onSelectView={setActiveView}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          user={user}
          installedExtensionsCount={extensions.filter(e => e.installed).length}
        />

        {/* Left Sidebar (Explorer OR Extensions Store) */}
        <div style={{ width: `${sidebarWidth}px` }} className="h-full shrink-0">
          {activeView === 'extensions' ? (
            <ExtensionsStore
              extensions={extensions}
              onToggleInstall={handleToggleInstallExtension}
              onToggleEnable={handleToggleEnableExtension}
            />
          ) : (
            <FileTree
              files={fileTree}
              activeFilePath={activeTab?.path}
              onFileSelect={handleSelectFile}
              onRefresh={loadFiles}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
            />
          )}
        </div>

        {/* Center Editor Area + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-ide-bg overflow-hidden">
          {/* Tab Bar */}
          <EditorTabs
            tabs={tabs}
            activeTabIndex={activeTabIndex}
            onSelectTab={setActiveTabIndex}
            onCloseTab={handleCloseTab}
          />

          {/* Monaco Editor */}
          <div className="flex-1 relative overflow-hidden">
            <MonacoCodeEditor
              activeTab={activeTab}
              onChangeContent={handleChangeEditorContent}
              onSave={handleSaveFile}
            />
          </div>

          {/* Integrated Terminal Panel */}
          <IntegratedTerminal
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(prev => !prev)}
            entries={terminalEntries}
            onRunCommand={handleRunTerminalCommand}
            onClear={() => setTerminalEntries([])}
          />
        </div>

        {/* Right Multi-Agent Window (Architect, Developer, Tester, etc.) */}
        <div style={{ width: `${agentWindowWidth}px` }} className="h-full shrink-0">
          <AgentWindowContainer
            agents={agents}
            settings={settings}
            sharedContextItems={sharedContextItems}
            activeFilePath={activeTab?.path}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAddAgentModal={() => setIsAddAgentModalOpen(true)}
            onRemoveCustomAgent={handleRemoveCustomAgent}
            onUpdateAgentInput={(id, val) => {
              setAgents(prev => prev.map(a => a.id === id ? { ...a, input: val } : a));
            }}
            onSendMessage={handleSendMessage}
            onStopAgent={handleStopAgent}
            onClearAgent={handleClearAgent}
            onSelectAgentModel={handleSelectAgentModel}
            onApplyCodeToEditor={(code) => {
              if (activeTab) handleChangeEditorContent(code);
            }}
            onShareToContextBus={handleShareToContextBus}
            onClearContextBus={() => setSharedContextItems([])}
            onRemoveContextItem={(id) => setSharedContextItems(prev => prev.filter(i => i.id !== id))}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        agents={agents}
        activeLanguage={activeTab?.language || 'Plain Text'}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        user={user}
        sharedContextCount={sharedContextItems.length}
        installedExtensionsCount={extensions.filter(e => e.installed).length}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          localStorage.setItem('antigravity_ai_settings', JSON.stringify(newSettings));
        }}
      />

      {/* Account & AI Subscription Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        user={user}
        settings={settings}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onUpdateSubscription={handleUpdateSubscription}
      />

      {/* Add Custom Agent Modal */}
      <AddAgentModal
        isOpen={isAddAgentModalOpen}
        onClose={() => setIsAddAgentModalOpen(false)}
        onAddAgent={handleAddNewAgent}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewFile={() => handleCreateFile('new_file.ts', false)}
        onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRunBothAgents={handleRunAllThreeAgentsConcurrently}
        onSaveFile={handleSaveFile}
        onOpenExtensions={() => setActiveView('extensions')}
        onOpenAccount={() => setIsAccountModalOpen(true)}
        onOpenAddAgent={() => setIsAddAgentModalOpen(true)}
      />
    </div>
  );
};

export default App;
