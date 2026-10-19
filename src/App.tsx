import React, { useState, useEffect, useRef } from 'react';
import { ActivityBar, SidebarView } from './components/Sidebar/ActivityBar';
import { FileTree } from './components/Explorer/FileTree';
import { ExtensionsStore, INITIAL_EXTENSIONS } from './components/Extensions/ExtensionsStore';
import { GlobalSearch } from './components/Search/GlobalSearch';
import { SourceControl } from './components/SourceControl/SourceControl';
import { RunDebug } from './components/RunDebug/RunDebug';
import { EditorTabs } from './components/Editor/EditorTabs';
import { MonacoCodeEditor } from './components/Editor/MonacoCodeEditor';
import { IntegratedTerminal } from './components/Terminal/IntegratedTerminal';
import { AgentWindowContainer } from './components/AgentWindow/AgentWindowContainer';
import { StatusBar } from './components/StatusBar/StatusBar';
import { SettingsModal } from './components/Modals/SettingsModal';
import { AccountModal } from './components/Modals/AccountModal';
import { AddAgentModal } from './components/Modals/AddAgentModal';
import { CommandPalette } from './components/Modals/CommandPalette';
import { ProjectModal } from './components/Modals/ProjectModal';
import { LoginScreen } from './components/Auth/LoginScreen';
import { TopMenuBar } from './components/Header/TopMenuBar';
import { AppLogo } from './components/Common/AppLogo';
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
import { PanelLeft, PanelRight, Terminal as TerminalIcon, Search } from 'lucide-react';

const DEFAULT_SETTINGS: AISettings = {
  geminiApiKey: '',
  anthropicApiKey: '',
  openaiApiKey: '',
  ollamaUrl: 'http://localhost:11434',
  defaultProvider: 'free',
  defaultModel: 'deepseek-r1',
  subscriptions: {
    gemini: {
      provider: 'gemini',
      planName: 'Google Gemini Advanced (Google One)',
      isActive: false,
      accountEmail: '',
      tier: 'Pro'
    },
    claude: {
      provider: 'claude',
      planName: 'Anthropic Claude Code & Pro',
      isActive: false,
      accountEmail: '',
      tier: 'Pro'
    },
    codex: {
      provider: 'codex',
      planName: 'OpenAI ChatGPT Plus / Codex',
      isActive: false,
      accountEmail: '',
      tier: 'Pro'
    }
  }
};

export const DEFAULT_USER: UserProfile = {
  id: '',
  name: '',
  email: '',
  avatar: '',
  provider: 'guest',
  isLoggedIn: false,
  subscriptionTier: 'Free',
  linkedAccounts: {}
};

// Three Default Agents: ARCHITECT, DEVELOPER, TESTER (Configured with free AI models out of the box)
const INITIAL_AGENTS: AgentInstance[] = [
  {
    id: 'agent-architect',
    name: 'Architect',
    role: 'ARCHITECT',
    description: 'Explores and designs high-level system architecture, technology selection, interface contracts, and task plans for Developer. (Action-restricted from writing code directly).',
    avatarColor: 'bg-indigo-600',
    provider: 'free',
    model: 'deepseek-r1',
    status: 'idle',
    messages: [],
    input: '',
    isMinimized: false,
    systemPrompt: 'You are the Lead Architect in BlackHat IDE. Your knowledge is unbounded across global software engineering, system topology, distributed systems, and modern paradigms. You explore, inspect, and design blueprints, contracts, and execution plans for the Developer agent. You do NOT write code or modify files.'
  },
  {
    id: 'agent-developer',
    name: 'Developer',
    role: 'DEVELOPER',
    description: 'Core implementation agent. Takes blueprints and task breakdowns from the Architect to write robust production code and execute tools.',
    avatarColor: 'bg-cyan-600',
    provider: 'free',
    model: 'qwen-coder',
    status: 'idle',
    messages: [],
    input: '',
    isMinimized: false,
    systemPrompt: 'You are the Core Developer in BlackHat IDE. Take blueprints and milestone specifications from the Architect, and user goals, to implement working production software.'
  },
  {
    id: 'agent-tester',
    name: 'Tester',
    role: 'TESTER',
    description: 'Quality assurance agent. Validates implementations against Architect contracts, runs test runners, and audits edge cases.',
    avatarColor: 'bg-emerald-600',
    provider: 'free',
    model: 'llama-3.3',
    status: 'idle',
    messages: [],
    input: '',
    isMinimized: false,
    systemPrompt: 'You are the QA & Testing agent in BlackHat IDE. Verify code against architectural specifications, audit boundary limits, and run test suites.'
  }
];

export const App: React.FC = () => {
  // Navigation & panels
  const [activeView, setActiveView] = useState<SidebarView>('explorer');
  const [isTerminalOpen, setIsTerminalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
  const [isAddAgentModalOpen, setIsAddAgentModalOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  // Layout widths & visibility with mouse-drag adjustable state
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('blackhat_sidebar_width');
      return saved ? Math.max(180, Math.min(650, parseInt(saved, 10))) : 260;
    } catch {
      return 260;
    }
  });

  const [agentWindowWidth, setAgentWindowWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('blackhat_agent_width');
      return saved ? Math.max(280, Math.min(850, parseInt(saved, 10))) : 420;
    } catch {
      return 420;
    }
  });

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [isAgentWindowVisible, setIsAgentWindowVisible] = useState<boolean>(true);

  // Mouse resizing refs
  const isDraggingLeftRef = useRef(false);
  const isDraggingRightRef = useRef(false);

  const handleStartLeftResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingLeftRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingLeftRef.current) return;
      // ActivityBar is 48px wide
      const newWidth = Math.max(180, Math.min(650, moveEvent.clientX - 48));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingLeftRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setSidebarWidth(w => {
        localStorage.setItem('blackhat_sidebar_width', w.toString());
        return w;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStartRightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRightRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRightRef.current) return;
      const newWidth = Math.max(280, Math.min(850, window.innerWidth - moveEvent.clientX));
      setAgentWindowWidth(newWidth);
    };

    const handleMouseUp = () => {
      isDraggingRightRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setAgentWindowWidth(w => {
        localStorage.setItem('blackhat_agent_width', w.toString());
        return w;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ActivityBar view selection with collapse toggle
  const handleSelectActivityView = (view: SidebarView) => {
    if (activeView === view && isSidebarVisible) {
      setIsSidebarVisible(false);
    } else {
      setActiveView(view);
      setIsSidebarVisible(true);
    }
  };

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

  // User Profile Auth State - Clean slate by default, requiring login
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      // Purge legacy storage key
      localStorage.removeItem('blackhat_user_profile');
      const saved = localStorage.getItem('blackhat_user_profile_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isLoggedIn && parsed.email) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_USER;
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
    if (user.isLoggedIn) {
      localStorage.setItem('blackhat_user_profile_v2', JSON.stringify(user));
    } else {
      localStorage.removeItem('blackhat_user_profile_v2');
      localStorage.removeItem('blackhat_user_profile');
    }
  }, [user]);

  const API_BASE = typeof window !== 'undefined' && window.location.protocol === 'file:' 
    ? 'http://localhost:3001' 
    : '';

  // Workspace & Multi-Window Project Management
  const [workspaceRoot, setWorkspaceRoot] = useState<string>(() => {
    try {
      const param = new URLSearchParams(window.location.search).get('workspace');
      return param || '';
    } catch {
      return '';
    }
  });
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectModalTab, setProjectModalTab] = useState<'open' | 'create'>('open');

  // Load file tree with dynamic workspace support (Native IPC preferred, HTTP fallback)
  const loadFiles = async (overrideWorkspace?: string) => {
    try {
      const target = overrideWorkspace !== undefined ? overrideWorkspace : workspaceRoot;
      if ((window as any).electronAPI?.native?.listFiles) {
        const data = await (window as any).electronAPI.native.listFiles(target);
        if (data.success && data.tree) {
          setFileTree(data.tree);
          return;
        }
      }
      const headers: Record<string, string> = {};
      if (target) headers['x-workspace-root'] = target;
      const url = target 
        ? `${API_BASE}/api/files?workspace=${encodeURIComponent(target)}` 
        : `${API_BASE}/api/files`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.success && data.tree) {
        setFileTree(data.tree);
      }
    } catch (err) {
      console.error('Failed to load file tree:', err);
    }
  };

  // Synchronize workspace info on mount & update title / terminal
  useEffect(() => {
    if ((window as any).electronAPI?.native?.workspaceInfo) {
      (window as any).electronAPI.native.workspaceInfo(workspaceRoot)
        .then((data: any) => {
          if (data && data.workspaceRoot) {
            setWorkspaceRoot(data.workspaceRoot);
            setTerminalCwd(data.workspaceRoot);
            const folderName = data.workspaceName || data.workspaceRoot.split(/[/\\]/).filter(Boolean).pop() || 'BlackHat';
            document.title = `${folderName} - BlackHat`;
            loadFiles(data.workspaceRoot);
          }
        })
        .catch((err: any) => console.error('Failed to load native workspace info:', err));
      return;
    }

    if (!workspaceRoot) {
      fetch(`${API_BASE}/api/workspace/info`)
        .then(r => r.json())
        .then(data => {
          if (data.workspaceRoot) {
            setWorkspaceRoot(data.workspaceRoot);
            setTerminalCwd(data.workspaceRoot);
            const folderName = data.workspaceName || data.workspaceRoot.split(/[/\\]/).filter(Boolean).pop() || 'BlackHat';
            document.title = `${folderName} - BlackHat`;
            loadFiles(data.workspaceRoot);
          }
        })
        .catch(err => console.error('Failed to load workspace info:', err));
    } else {
      const folderName = workspaceRoot.split(/[/\\]/).filter(Boolean).pop() || 'BlackHat';
      document.title = `${folderName} - BlackHat`;
      setTerminalCwd(workspaceRoot);
      loadFiles(workspaceRoot);
    }
  }, [workspaceRoot]);

  // Project Open / Switch Handler
  const handleOpenWorkspace = (targetPath: string, newWindow?: boolean) => {
    if (!targetPath) return;

    if (newWindow) {
      if ((window as any).electronAPI?.createNewWindow) {
        (window as any).electronAPI.createNewWindow(targetPath);
      } else {
        window.open(`/?workspace=${encodeURIComponent(targetPath)}`, '_blank');
      }
      return;
    }

    // Switch workspace in the current window
    setWorkspaceRoot(targetPath);
    setTerminalCwd(targetPath);
    const folderName = targetPath.split(/[/\\]/).filter(Boolean).pop() || 'BlackHat';
    document.title = `${folderName} - BlackHat`;
    setTabs([]);
    setActiveTabIndex(-1);
    loadFiles(targetPath);
    setIsProjectModalOpen(false);
  };

  // Open Native System Folder Picker or Fallback Modal
  const handleOpenProjectFolder = async () => {
    if ((window as any).electronAPI?.openFolderDialog) {
      try {
        const res = await (window as any).electronAPI.openFolderDialog();
        if (!res.canceled && res.folderPath) {
          handleOpenWorkspace(res.folderPath, false);
          return;
        }
      } catch (e) {
        console.error('Failed to open native folder dialog:', e);
      }
    }
    setProjectModalTab('open');
    setIsProjectModalOpen(true);
  };

  // Spawn a brand new independent window
  const handleNewWindow = () => {
    if ((window as any).electronAPI?.createNewWindow) {
      (window as any).electronAPI.createNewWindow();
    } else {
      window.open(window.location.origin, '_blank');
    }
  };

  // Native Electron Listeners for Open Project and Initial Workspace
  useEffect(() => {
    if ((window as any).electronAPI?.onOpenProjectFolder) {
      const cleanup = (window as any).electronAPI.onOpenProjectFolder((folderPath: string) => {
        handleOpenWorkspace(folderPath, false);
      });
      return () => { if (typeof cleanup === 'function') cleanup(); };
    }
  }, []);

  useEffect(() => {
    if ((window as any).electronAPI?.onWorkspaceInit) {
      const cleanup = (window as any).electronAPI.onWorkspaceInit((workspacePath: string) => {
        handleOpenWorkspace(workspacePath, false);
      });
      return () => { if (typeof cleanup === 'function') cleanup(); };
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'p')) {
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

  // Handle native application menu commands from Electron
  useEffect(() => {
    if ((window as any).electronAPI?.onMenuCommand) {
      const cleanup = (window as any).electronAPI.onMenuCommand((cmd: string) => {
        switch (cmd) {
          case 'new-window':
            handleNewWindow();
            break;
          case 'open-folder':
            handleOpenProjectFolder();
            break;
          case 'create-new-project':
            setProjectModalTab('create');
            setIsProjectModalOpen(true);
            break;
          case 'new-file':
            handleCreateFile('untitled.ts', false);
            break;
          case 'new-folder':
            handleCreateFile('new_folder', true);
            break;
          case 'save-file':
            handleSaveFile();
            break;
          case 'save-all':
            handleSaveAllFiles();
            break;
          case 'close-active-tab':
            if (tabs.length > 0) handleCloseTab(activeTabIndex);
            break;
          case 'close-all-tabs':
            setTabs([]);
            break;
          case 'command-palette':
            setIsCommandPaletteOpen(true);
            break;
          case 'open-settings':
            setIsSettingsOpen(true);
            break;
          case 'open-account':
            setIsAccountModalOpen(true);
            break;
          case 'view-explorer':
            setActiveView('explorer');
            setIsSidebarVisible(true);
            break;
          case 'view-search':
            setActiveView('search');
            setIsSidebarVisible(true);
            break;
          case 'view-source-control':
            setActiveView('source-control');
            setIsSidebarVisible(true);
            break;
          case 'view-run-debug':
            setActiveView('run-debug');
            setIsSidebarVisible(true);
            break;
          case 'view-extensions':
            setActiveView('extensions');
            setIsSidebarVisible(true);
            break;
          case 'toggle-sidebar':
            setIsSidebarVisible(prev => !prev);
            break;
          case 'toggle-agent-window':
            setIsAgentWindowVisible(prev => !prev);
            break;
          case 'toggle-terminal':
            setIsTerminalOpen(prev => !prev);
            break;
          case 'next-tab':
            if (tabs.length > 1) {
              setActiveTabIndex(prev => (prev + 1) % tabs.length);
            }
            break;
          case 'prev-tab':
            if (tabs.length > 1) {
              setActiveTabIndex(prev => (prev - 1 + tabs.length) % tabs.length);
            }
            break;
          case 'run-debug-target':
            setActiveView('run-debug');
            setIsSidebarVisible(true);
            break;
          case 'run-dev-server':
            setIsTerminalOpen(true);
            handleRunTerminalCommand('npm run dev');
            break;
          case 'run-all-agents':
            handleRunAllThreeAgentsConcurrently();
            break;
          case 'new-terminal':
            setIsTerminalOpen(true);
            break;
          case 'clear-terminal':
            setTerminalEntries([]);
            break;
        }
      });
      return () => cleanup();
    }
  }, [tabs, activeTabIndex, workspaceRoot]);

  // File Operations (Native Desktop IPC preferred, HTTP fallback)
  const handleSelectFile = async (filePath: string) => {
    const existingIndex = tabs.findIndex(t => t.path === filePath);
    if (existingIndex !== -1) {
      setActiveTabIndex(existingIndex);
      return;
    }

    try {
      if ((window as any).electronAPI?.native?.readFile) {
        const data = await (window as any).electronAPI.native.readFile(filePath, workspaceRoot);
        if (data && data.success) {
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
          return;
        }
      }
      const headers: Record<string, string> = {};
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(`${API_BASE}/api/file?path=${encodeURIComponent(filePath)}`, { headers });
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
      if ((window as any).electronAPI?.native?.createFile) {
        await (window as any).electronAPI.native.createFile(filePath, isDirectory, '', workspaceRoot);
        await loadFiles();
        if (!isDirectory) {
          await handleSelectFile(filePath);
        }
        return;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      await fetch(`${API_BASE}/api/file/create`, {
        method: 'POST',
        headers,
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
      if ((window as any).electronAPI?.native?.deleteFile) {
        await (window as any).electronAPI.native.deleteFile(filePath, workspaceRoot);
        setTabs(prev => prev.filter(t => t.path !== filePath));
        await loadFiles();
        return;
      }
      const headers: Record<string, string> = {};
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      await fetch(`${API_BASE}/api/file?path=${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers
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
      if ((window as any).electronAPI?.native?.writeFile) {
        await (window as any).electronAPI.native.writeFile(activeTab.path, activeTab.content, workspaceRoot);
        setTabs(prev => prev.map((t, idx) => 
          idx === activeTabIndex ? { ...t, isDirty: false, originalContent: t.content } : t
        ));
        return;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      await fetch(`${API_BASE}/api/file`, {
        method: 'POST',
        headers,
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

  const handleRenameFile = async (oldPath: string, newPath: string) => {
    try {
      if ((window as any).electronAPI?.native?.renameFile) {
        const data = await (window as any).electronAPI.native.renameFile(oldPath, newPath, workspaceRoot);
        if (data && data.success) {
          setTabs(prev => prev.map(t => 
            t.path === oldPath 
              ? { ...t, path: newPath, name: newPath.split('/').pop() || newPath, language: getLanguageFromPath(newPath) } 
              : t
          ));
          await loadFiles();
          return;
        }
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(`${API_BASE}/api/file/rename`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ oldPath, newPath })
      });
      const data = await res.json();
      if (data.success) {
        setTabs(prev => prev.map(t => 
          t.path === oldPath 
            ? { ...t, path: newPath, name: newPath.split('/').pop() || newPath, language: getLanguageFromPath(newPath) } 
            : t
        ));
        await loadFiles();
      }
    } catch (err) {
      console.error('Failed to rename file:', err);
    }
  };

  const handleDuplicateFile = async (filePath: string) => {
    try {
      if ((window as any).electronAPI?.native?.duplicateFile) {
        const data = await (window as any).electronAPI.native.duplicateFile(filePath, workspaceRoot);
        if (data && data.success && data.newPath) {
          await loadFiles();
          await handleSelectFile(data.newPath);
          return;
        }
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(`${API_BASE}/api/file/duplicate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (data.success && data.newPath) {
        await loadFiles();
        await handleSelectFile(data.newPath);
      }
    } catch (err) {
      console.error('Failed to duplicate file:', err);
    }
  };

  const handleRevealInFinder = (filePath: string) => {
    if ((window as any).electronAPI?.revealInFinder) {
      (window as any).electronAPI.revealInFinder(filePath);
    }
  };

  const handleSaveAllFiles = async () => {
    for (const tab of tabs) {
      if (tab.isDirty) {
        try {
          if ((window as any).electronAPI?.native?.writeFile) {
            await (window as any).electronAPI.native.writeFile(tab.path, tab.content, workspaceRoot);
          } else {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
            await fetch(`${API_BASE}/api/file`, {
              method: 'POST',
              headers,
              body: JSON.stringify({ path: tab.path, content: tab.content })
            });
          }
        } catch (e) {
          console.error('Failed to save file:', tab.path, e);
        }
      }
    }
    setTabs(prev => prev.map(t => ({ ...t, isDirty: false, originalContent: t.content })));
  };

  // Terminal execution with cwd support (Native direct execution preferred)
  const [terminalCwd, setTerminalCwd] = useState<string>('~/BlackHat');

  const handleRunTerminalCommand = async (command: string, cwd?: string) => {
    try {
      if ((window as any).electronAPI?.native?.runTerminal) {
        const data = await (window as any).electronAPI.native.runTerminal(command, cwd || terminalCwd || workspaceRoot);
        const newCwd = data.cwd || cwd || terminalCwd;
        if (data.cwd) {
          setTerminalCwd(data.cwd);
        }
        setTerminalEntries(prev => [
          ...prev,
          {
            id: `cmd_${Date.now()}`,
            command,
            stdout: data.stdout || '',
            stderr: data.stderr || '',
            exitCode: data.exitCode,
            timestamp: Date.now(),
            cwd: newCwd
          }
        ]);
        return data;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (workspaceRoot) headers['x-workspace-root'] = workspaceRoot;
      const res = await fetch(`${API_BASE}/api/terminal/run`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ command, cwd: cwd || terminalCwd || workspaceRoot })
      });
      const data = await res.json();
      const newCwd = data.cwd || cwd || terminalCwd;
      if (data.cwd) {
        setTerminalCwd(data.cwd);
      }
      setTerminalEntries(prev => [
        ...prev,
        {
          id: `cmd_${Date.now()}`,
          command,
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          exitCode: data.exitCode,
          timestamp: Date.now(),
          cwd: newCwd
        }
      ]);
      return data;
    } catch (err: any) {
      console.error('Failed to run terminal command:', err);
      const errorEntry = {
        id: `cmd_${Date.now()}`,
        command,
        stdout: '',
        stderr: err?.message || 'Error running command',
        exitCode: 1,
        timestamp: Date.now(),
        cwd: terminalCwd
      };
      setTerminalEntries(prev => [...prev, errorEntry]);
      return {
        success: false,
        stdout: '',
        stderr: err?.message || 'Error running command',
        exitCode: 1,
        cwd: terminalCwd
      };
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

      // Check if this provider has an active subscription or is free tier
      const hasSubscription = 
        agent.provider === 'free' ||
        (agent.provider === 'gemini' && settings.subscriptions.gemini.isActive) ||
        (agent.provider === 'anthropic' && settings.subscriptions.claude.isActive) ||
        (agent.provider === 'openai' && settings.subscriptions.codex.isActive);

      const response = await fetch(`${API_BASE}/api/agent/stream`, {
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
            user: {
              email: user.email,
              name: user.name,
              provider: user.provider,
              isLoggedIn: user.isLoggedIn,
              sessionToken: user.sessionToken,
              autoAuthEnabled: user.autoAuthEnabled
            },
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
    await fetch(`${API_BASE}/api/agent/stop`, {
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

  // Extensions Store operations (Open VSX Marketplace Integration)
  const handleToggleInstallExtension = (extensionId: string) => {
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, installed: !ext.installed, enabled: true } : ext
    ));
  };

  const handleInstallExtension = (ext: ExtensionItem) => {
    setExtensions(prev => {
      const exists = prev.find(e => e.id === ext.id);
      if (exists) {
        return prev.map(e => e.id === ext.id ? { ...e, installed: true, enabled: true } : e);
      }
      return [{ ...ext, installed: true, enabled: true }, ...prev];
    });
  };

  const handleUninstallExtension = (extensionId: string) => {
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, installed: false } : ext
    ));
  };

  const handleToggleEnableExtension = (extensionId: string) => {
    setExtensions(prev => prev.map(ext => 
      ext.id === extensionId ? { ...ext, enabled: !ext.enabled } : ext
    ));
  };

  // User Auth operations
  const handleLogin = (userOrProvider: UserProfile | 'google' | 'github', manualData?: { email?: string; name?: string }) => {
    if (typeof userOrProvider === 'object' && userOrProvider.email) {
      const finalUser = userOrProvider;
      setUser(finalUser);
      localStorage.setItem('blackhat_user_profile_v2', JSON.stringify(finalUser));

      fetch(`${API_BASE}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: finalUser.provider,
          email: finalUser.email,
          name: finalUser.name,
          sessionToken: finalUser.sessionToken
        })
      }).catch(err => console.error('Failed to register auth session:', err));

      setSettings(prev => ({
        ...prev,
        subscriptions: {
          gemini: { ...prev.subscriptions.gemini, isActive: true, accountEmail: finalUser.email, planName: finalUser.provider === 'google' ? 'Google One AI Premium / Studio' : 'Active (Developer Federation)' },
          claude: { ...prev.subscriptions.claude, isActive: true, accountEmail: finalUser.email, planName: 'Claude Pro (Federated)' },
          codex: { ...prev.subscriptions.codex, isActive: true, accountEmail: finalUser.email, planName: 'ChatGPT Plus / Codex (Federated)' }
        }
      }));
      return;
    }

    const provider = userOrProvider;
    const rawEmail = manualData?.email?.trim();
    if (!rawEmail) return;

    if (provider === 'google') {
      const email = rawEmail;
      const name = manualData?.name?.trim() || email.split('@')[0];
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff&bold=true`;
      const sessionToken = `sess_google_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const googleUser: UserProfile = {
        id: `usr_google_${Date.now()}`,
        name,
        email,
        avatar: avatarUrl,
        provider: 'google',
        isLoggedIn: true,
        subscriptionTier: 'Pro',
        sessionToken,
        autoAuthEnabled: true,
        connectedServices: {
          gemini: { connected: true, status: 'Active (Google AI Studio / Google One)', account: email },
          claude: { connected: true, status: 'Active (Workspace Federation)', account: email },
          codex: { connected: true, status: 'Active (Workspace Federation)', account: email }
        },
        linkedAccounts: {
          google: {
            email,
            name,
            avatar: avatarUrl,
            linkedAt: new Date().toISOString()
          }
        }
      };

      setUser(googleUser);
      // Store user identity ONLY — zero API keys are stored in localStorage
      localStorage.setItem('blackhat_user_profile_v2', JSON.stringify(googleUser));

      // Register session with backend
      fetch(`${API_BASE}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          email,
          name,
          sessionToken
        })
      }).catch(err => console.error('Failed to register auth session:', err));

      // Automatically activate federated AI entitlements
      setSettings(prev => ({
        ...prev,
        subscriptions: {
          gemini: { ...prev.subscriptions.gemini, isActive: true, accountEmail: email, planName: 'Google One AI Premium / Studio' },
          claude: { ...prev.subscriptions.claude, isActive: true, accountEmail: email, planName: 'Claude Pro (Google Linked)' },
          codex: { ...prev.subscriptions.codex, isActive: true, accountEmail: email, planName: 'ChatGPT Plus / Codex (Google Linked)' }
        }
      }));
    } else {
      const email = rawEmail;
      const name = manualData?.name?.trim() || email.split('@')[0];
      const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=24292e&color=fff&bold=true`;
      const sessionToken = `sess_github_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const githubUser: UserProfile = {
        id: `usr_github_${Date.now()}`,
        name,
        email,
        avatar: avatarUrl,
        provider: 'github',
        isLoggedIn: true,
        subscriptionTier: 'Pro',
        sessionToken,
        autoAuthEnabled: true,
        connectedServices: {
          gemini: { connected: true, status: 'Active (Developer Federation)', account: email },
          claude: { connected: true, status: 'Active (Developer Federation)', account: email },
          codex: { connected: true, status: 'Active (GitHub Copilot / Codex)', account: email }
        },
        linkedAccounts: {
          github: {
            username: name,
            name,
            avatar: avatarUrl,
            linkedAt: new Date().toISOString()
          }
        }
      };

      setUser(githubUser);
      localStorage.setItem('blackhat_user_profile_v2', JSON.stringify(githubUser));

      fetch(`${API_BASE}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'github',
          email,
          name,
          sessionToken
        })
      }).catch(err => console.error('Failed to register auth session:', err));
    }
  };

  const handleLogout = () => {
    if (user.sessionToken) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: user.sessionToken })
      }).catch(() => {});
    }
    localStorage.removeItem('blackhat_user_profile_v2');
    localStorage.removeItem('blackhat_user_profile');
    setUser({
      id: '',
      name: '',
      email: '',
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

  const handleContinueAsGuest = () => {
    setUser({
      id: 'usr_guest',
      name: 'Guest Developer',
      email: 'guest@blackhat.ide',
      avatar: '',
      provider: 'guest',
      isLoggedIn: true,
      subscriptionTier: 'Free',
      linkedAccounts: {}
    });
  };

  const activeTab = tabs[activeTabIndex];
  const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;
  const platform = (window as any).electronAPI?.platform || (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32');

  // If no user is logged in, show initial Login / Authentication screen
  if (!user.isLoggedIn) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onContinueAsGuest={handleContinueAsGuest}
        isElectron={isElectron}
        platform={platform}
      />
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-[#181818] text-[#cccccc] overflow-hidden select-none font-sans">
      {/* Top Application Window Bar with Cross-Platform Support */}
      <div 
        style={{ WebkitAppRegion: 'drag' } as any}
        className={`h-[36px] px-3 flex items-center justify-between bg-[#181818] border-b border-[#2b2b2b] shrink-0 ${
          isElectron && platform === 'darwin' ? 'pl-[78px]' : ''
        }`}
      >
        {/* Left Section: Branding & Menu Bar */}
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <span className="text-[12px] font-medium text-white flex items-center gap-1.5">
            <AppLogo size={18} className="w-[18px] h-[18px] shrink-0 rounded" />
            <span>BlackHat</span>
            {workspaceRoot && (
              <span className="text-[11px] font-normal text-[#888888] flex items-center gap-1">
                <span>/</span>
                <span className="text-[#cccccc] font-medium truncate max-w-[140px]">
                  {workspaceRoot.split(/[/\\]/).filter(Boolean).pop()}
                </span>
              </span>
            )}
          </span>

          {/* Antigravity / VS Code-style Application Menu Bar */}
          <TopMenuBar
            onNewFile={() => handleCreateFile('untitled.ts', false)}
            onNewFolder={() => handleCreateFile('new_folder', true)}
            onNewWindow={handleNewWindow}
            onOpenProject={handleOpenProjectFolder}
            onCreateProject={() => {
              setProjectModalTab('create');
              setIsProjectModalOpen(true);
            }}
            onSaveFile={handleSaveFile}
            onSaveAllFiles={handleSaveAllFiles}
            onCloseActiveTab={() => { if (tabs.length > 0) handleCloseTab(activeTabIndex); }}
            onCloseAllTabs={() => setTabs([])}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenAccount={() => setIsAccountModalOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onSelectView={(v) => { setActiveView(v); setIsSidebarVisible(true); }}
            onToggleSidebar={() => setIsSidebarVisible(prev => !prev)}
            onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
            onToggleAgentStudio={() => setIsAgentWindowVisible(prev => !prev)}
            onRunAllAgents={handleRunAllThreeAgentsConcurrently}
            onRunDebugTarget={() => { setActiveView('run-debug'); setIsSidebarVisible(true); }}
          />
        </div>

        {/* Center Search / Command Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="w-[380px] max-w-[40vw] h-[26px] rounded bg-[#222222] hover:bg-[#282828] border border-[#2e2e2e] text-[12px] text-[#858585] flex items-center justify-between px-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#858585]" />
            <span className="truncate">BlackHat - Search files, symbols & commands...</span>
          </div>
          <kbd className="px-1.5 py-0.2 rounded bg-[#181818] border border-[#333333] text-[10px] font-mono text-[#858585]">
            ⌘P
          </kbd>
        </button>

        {/* Right Section: Multi-Agent Launcher, Layout Toggles & Account */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Run All Agents */}
          <button
            onClick={handleRunAllThreeAgentsConcurrently}
            className="px-2.5 py-1 rounded bg-[#0078d4] hover:bg-[#026ec1] text-white text-[11px] font-normal flex items-center gap-1.5 transition-colors shadow-sm"
            title="Dispatch Architect, Developer, and Tester simultaneously"
          >
            <span>⚡ Run All Agents</span>
          </button>

          {/* Layout Toggles */}
          <div className="flex items-center border-l border-[#2e2e2e] pl-1.5 ml-0.5 gap-0.5">
            <button
              onClick={() => setIsSidebarVisible(prev => !prev)}
              title={isSidebarVisible ? "Hide Primary SideBar" : "Show Primary SideBar"}
              className={`p-1.5 rounded hover:bg-[#252525] transition-colors ${
                isSidebarVisible ? 'text-white' : 'text-[#666666]'
              }`}
            >
              <PanelLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsTerminalOpen(prev => !prev)}
              title={isTerminalOpen ? "Hide Terminal Panel" : "Show Terminal Panel"}
              className={`p-1.5 rounded hover:bg-[#252525] transition-colors ${
                isTerminalOpen ? 'text-white' : 'text-[#666666]'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsAgentWindowVisible(prev => !prev)}
              title={isAgentWindowVisible ? "Hide Agent Studio" : "Show Agent Studio"}
              className={`p-1.5 rounded hover:bg-[#252525] transition-colors ${
                isAgentWindowVisible ? 'text-white' : 'text-[#666666]'
              }`}
            >
              <PanelRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* User Account Button */}
          <button
            onClick={() => setIsAccountModalOpen(true)}
            className="px-2 py-1 rounded hover:bg-[#252525] border border-[#2e2e2e] text-xs flex items-center gap-1.5 text-[#cccccc] transition-colors"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-4 h-4 rounded-full object-cover" />
            ) : null}
            <span className="text-[11px] font-normal">{user.isLoggedIn ? user.name : 'Sign In'}</span>
          </button>

          {/* Windows native window controls in Electron */}
          {isElectron && platform === 'win32' && (
            <div className="flex items-center ml-2 border-l border-[#2b2b2b] pl-2">
              <button 
                onClick={() => (window as any).electronAPI.minimize()}
                className="w-8 h-7 flex items-center justify-center hover:bg-[#252525] text-[#858585] hover:text-white text-xs"
                title="Minimize"
              >
                &#8212;
              </button>
              <button 
                onClick={() => (window as any).electronAPI.maximize()}
                className="w-8 h-7 flex items-center justify-center hover:bg-[#252525] text-[#858585] hover:text-white text-xs"
                title="Maximize"
              >
                &#9633;
              </button>
              <button 
                onClick={() => (window as any).electronAPI.close()}
                className="w-8 h-7 flex items-center justify-center hover:bg-[#f85149] text-[#858585] hover:text-white text-xs"
                title="Close"
              >
                &#10005;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Activity Rail */}
        <ActivityBar
          activeView={activeView}
          isSidebarVisible={isSidebarVisible}
          onSelectView={handleSelectActivityView}
          isTerminalOpen={isTerminalOpen}
          onToggleTerminal={() => setIsTerminalOpen(prev => !prev)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          user={user}
          installedExtensionsCount={extensions.filter(e => e.installed).length}
        />

        {/* Left Sidebar Views (Explorer, Search, Source Control, Run & Debug, Extensions) */}
        {isSidebarVisible && (
          <div style={{ width: `${sidebarWidth}px` }} className="h-full shrink-0 flex flex-col overflow-hidden bg-[#181818]">
            {activeView === 'explorer' && (
              <FileTree
                files={fileTree}
                activeFilePath={activeTab?.path}
                onFileSelect={handleSelectFile}
                onRefresh={loadFiles}
                onCreateFile={handleCreateFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                onDuplicateFile={handleDuplicateFile}
                onRevealInFinder={handleRevealInFinder}
              />
            )}
            {activeView === 'search' && (
              <GlobalSearch
                onOpenFile={(path) => handleSelectFile(path)}
                apiBase={API_BASE}
                workspaceRoot={workspaceRoot}
              />
            )}
            {activeView === 'source-control' && (
              <SourceControl
                onOpenFile={(path) => handleSelectFile(path)}
                apiBase={API_BASE}
                workspaceRoot={workspaceRoot}
              />
            )}
            {activeView === 'run-debug' && (
              <RunDebug
                onRunCommand={handleRunTerminalCommand}
                onOpenTerminal={() => setIsTerminalOpen(true)}
              />
            )}
            {activeView === 'extensions' && (
              <ExtensionsStore
                extensions={extensions}
                onToggleInstall={handleToggleInstallExtension}
                onToggleEnable={handleToggleEnableExtension}
                onInstallExtension={handleInstallExtension}
                onUninstallExtension={handleUninstallExtension}
                apiBase={API_BASE}
              />
            )}
          </div>
        )}

        {/* Resizer Splitter for Left Sidebar */}
        {isSidebarVisible && (
          <div
            onMouseDown={handleStartLeftResize}
            title="Drag to resize sidebar"
            className="w-[3px] hover:w-[5px] -ml-[1px] bg-transparent hover:bg-[#0078d4] active:bg-[#0078d4] cursor-col-resize z-20 shrink-0 transition-all select-none"
          />
        )}

        {/* Center Editor Area + Terminal */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] overflow-hidden">
          {/* Tab Bar */}
          <EditorTabs
            tabs={tabs}
            activeTabIndex={activeTabIndex}
            onSelectTab={setActiveTabIndex}
            onCloseTab={handleCloseTab}
          />

          {/* Monaco Editor */}
          <div className="flex-1 relative overflow-hidden bg-[#1e1e1e]">
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
            onClose={() => setIsTerminalOpen(false)}
            entries={terminalEntries}
            onRunCommand={handleRunTerminalCommand}
            onClear={() => setTerminalEntries([])}
            terminalCwd={terminalCwd}
          />
        </div>

        {/* Resizer Splitter for Right Agent Window */}
        {isAgentWindowVisible && (
          <div
            onMouseDown={handleStartRightResize}
            title="Drag to resize agent studio"
            className="w-[3px] hover:w-[5px] -mr-[1px] bg-transparent hover:bg-[#0078d4] active:bg-[#0078d4] cursor-col-resize z-20 shrink-0 transition-all select-none"
          />
        )}

        {/* Right Multi-Agent Window (Architect, Developer, Tester, etc.) */}
        {isAgentWindowVisible && (
          <div style={{ width: `${agentWindowWidth}px` }} className="h-full shrink-0 flex flex-col overflow-hidden">
            <AgentWindowContainer
              agents={agents}
              settings={settings}
              sharedContextItems={sharedContextItems}
              activeFilePath={activeTab?.path}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenAddAgentModal={() => setIsAddAgentModalOpen(true)}
              onRemoveCustomAgent={handleRemoveCustomAgent}
              onToggleCollapsePanel={() => setIsAgentWindowVisible(false)}
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
        )}
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
        user={user}
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
        onNewWindow={handleNewWindow}
        onOpenProject={handleOpenProjectFolder}
        onCreateProject={() => {
          setProjectModalTab('create');
          setIsProjectModalOpen(true);
        }}
      />

      {/* Project & Workspace Manager Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        currentWorkspace={workspaceRoot}
        onOpenWorkspace={handleOpenWorkspace}
        isElectron={isElectron}
        initialTab={projectModalTab}
      />
    </div>
  );
};

export default App;
