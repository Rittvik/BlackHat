export interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export interface EditorTab {
  path: string;
  name: string;
  content: string;
  originalContent: string;
  isDirty: boolean;
  language: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: any;
  result?: any;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thoughts?: string[];
  toolCalls?: ToolCall[];
  timestamp: number;
}

export type AgentStatus = 'idle' | 'thinking' | 'executing_tool' | 'streaming' | 'error';

export type AgentRole = 'ARCHITECT' | 'DEVELOPER' | 'TESTER' | 'CUSTOM';

export interface SharedContextItem {
  id: string;
  fromAgentId: string;
  fromAgentName: string;
  fromAgentRole: AgentRole;
  timestamp: number;
  type: 'plan' | 'code' | 'test' | 'summary' | 'handoff';
  title: string;
  content: string;
  targetAgentId?: string; // If specifically handed off to an agent
  relatedFiles?: string[];
}

export interface AgentInstance {
  id: string;
  name: string;
  role: AgentRole;
  description: string;
  avatarColor: string;
  provider: 'gemini' | 'anthropic' | 'openai' | 'ollama';
  model: string;
  status: AgentStatus;
  currentThought?: string;
  messages: AgentMessage[];
  input: string;
  isMinimized: boolean;
  systemPrompt?: string;
}

export interface AISubscription {
  provider: 'gemini' | 'claude' | 'codex';
  planName: string; // e.g. "Gemini Advanced", "Claude Pro / Code", "ChatGPT Plus / Codex"
  isActive: boolean;
  accountEmail?: string;
  sessionToken?: string;
  tier: 'Free' | 'Pro' | 'Ultra' | 'Team';
  expiresAt?: string;
}

export interface AISettings {
  geminiApiKey: string;
  anthropicApiKey: string;
  openaiApiKey: string;
  ollamaUrl: string;
  defaultProvider: 'gemini' | 'anthropic' | 'openai' | 'ollama';
  defaultModel: string;
  subscriptions: {
    gemini: AISubscription;
    claude: AISubscription;
    codex: AISubscription;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: 'google' | 'github' | 'guest';
  isLoggedIn: boolean;
  subscriptionTier: 'Free' | 'Pro' | 'Enterprise';
  linkedAccounts: {
    google?: { email: string; name: string; avatar: string; linkedAt: string };
    github?: { username: string; name: string; avatar: string; linkedAt: string };
  };
}

export interface ExtensionItem {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: string;
  iconName?: string; // fallback lucide icon identifier
  iconUrl?: string; // Open VSX icon URL
  downloads: string;
  rating: number;
  category: string;
  installed: boolean;
  enabled: boolean;
  tags: string[];
  downloadUrl?: string;
  verified?: boolean;
}

export interface TerminalEntry {
  id: string;
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: number;
}
