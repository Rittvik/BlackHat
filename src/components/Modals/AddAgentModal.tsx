import React, { useState } from 'react';
import { X, Bot, Plus, Sparkles, Check, Palette } from 'lucide-react';
import { AgentInstance, AgentRole } from '../../types';

interface AddAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAgent: (newAgent: AgentInstance) => void;
}

const AVATAR_COLORS = [
  'bg-indigo-600',
  'bg-cyan-600',
  'bg-emerald-600',
  'bg-purple-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-blue-600',
  'bg-teal-600'
];

export const AddAgentModal: React.FC<AddAgentModalProps> = ({
  isOpen,
  onClose,
  onAddAgent
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('CUSTOM');
  const [description, setDescription] = useState('');
  const [avatarColor, setAvatarColor] = useState('bg-purple-600');
  const [provider, setProvider] = useState<'free' | 'gemini' | 'anthropic' | 'openai' | 'ollama'>('free');
  const [model, setModel] = useState('deepseek-r1');
  const [systemPrompt, setSystemPrompt] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newAgent: AgentInstance = {
      id: `agent-${Date.now()}`,
      name: name.trim(),
      role,
      description: description.trim() || `Specialized ${role} agent for custom workflow tasks.`,
      avatarColor,
      provider,
      model,
      status: 'idle',
      messages: [],
      input: '',
      isMinimized: false,
      systemPrompt: systemPrompt.trim()
    };

    onAddAgent(newAgent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm select-none p-4">
      <div className="w-full max-w-md bg-ide-sidebar border border-ide-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-ide-border bg-ide-panel shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-md ${avatarColor} flex items-center justify-center text-white`}>
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-white">Create New Custom Agent</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-ide-hover rounded text-ide-muted hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {/* Agent Name */}
          <div className="space-y-1">
            <label className="font-medium text-ide-text">Agent Name</label>
            <input
              type="text"
              placeholder="e.g. DevOps Engineer, Security Auditor, DB Specialist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent text-xs"
              required
            />
          </div>

          {/* Role & Base Profile */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="font-medium text-ide-text">Specialized Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AgentRole)}
                className="w-full px-2.5 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent text-xs"
              >
                <option value="CUSTOM">Custom Specialist</option>
                <option value="ARCHITECT">System Architect</option>
                <option value="DEVELOPER">Core Developer</option>
                <option value="TESTER">QA & Testing</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ide-text">AI Provider</label>
              <select
                value={provider}
                onChange={(e) => {
                  const prov = e.target.value as any;
                  setProvider(prov);
                  if (prov === 'free') setModel('deepseek-r1');
                  else if (prov === 'gemini') setModel('gemini-2.5-pro');
                  else if (prov === 'anthropic') setModel('claude-3-7-sonnet');
                  else if (prov === 'openai') setModel('gpt-4o');
                  else setModel('llama3.2');
                }}
                className="w-full px-2.5 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent text-xs"
              >
                <option value="free">✨ Free Cloud Models (Zero Setup)</option>
                <option value="gemini">Google Gemini</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="openai">OpenAI Codex / GPT-4o</option>
                <option value="ollama">Local Ollama (Offline & Free)</option>
              </select>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-1">
            <label className="font-medium text-ide-text">Model</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent text-xs font-mono"
            />
          </div>

          {/* Avatar Color Picker */}
          <div className="space-y-1">
            <label className="font-medium text-ide-text">Avatar Accent</label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`w-6 h-6 rounded-md ${color} flex items-center justify-center text-white transition-all ${
                    avatarColor === color ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {avatarColor === color && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-1">
            <label className="font-medium text-ide-text">Custom System Instructions</label>
            <textarea
              rows={3}
              placeholder="Define agent personality, expertise, coding conventions, or instructions..."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full px-3 py-1.5 bg-ide-darkest border border-ide-border rounded text-white focus:outline-none focus:border-ide-accent text-xs font-mono leading-relaxed resize-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-ide-muted hover:text-white hover:bg-ide-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-ide-accent hover:bg-ide-accentHover text-white font-medium transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
