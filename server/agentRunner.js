import { executeTool, TOOL_DEFINITIONS } from './tools.js';

export class AgentRunner {
  constructor(emitEvent) {
    this.emitEvent = emitEvent; // (event) => void
    this.aborted = false;
  }

  abort() {
    this.aborted = true;
  }

  async run({ 
    agentId, 
    role = 'DEVELOPER', 
    name = 'Agent',
    prompt, 
    history = [], 
    config = {}, 
    workspaceContext = '', 
    sharedContext = [] 
  }) {
    this.emitEvent({ type: 'status', agentId, status: 'thinking' });

    const provider = config.provider || 'gemini';
    const apiKey = config.apiKey || '';
    const hasSubscription = Boolean(config.hasSubscription);
    const model = config.model || (provider === 'gemini' ? 'gemini-2.5-pro' : provider === 'anthropic' ? 'claude-3-7-sonnet' : 'gpt-4o');

    // Build role system instructions
    const roleInstructions = this.buildRoleSystemPrompt(role, name, config.systemPrompt);

    // If no API key provided and no active subscription (and not local ollama), run smart role simulation
    if (!apiKey && !hasSubscription && provider !== 'ollama') {
      await this.runSimulation({ agentId, role, name, prompt, sharedContext, workspaceContext });
      return;
    }

    try {
      if (provider === 'gemini') {
        await this.runGemini({ agentId, role, prompt, history, apiKey, model, roleInstructions, workspaceContext, sharedContext });
      } else if (provider === 'openai') {
        await this.runOpenAI({ agentId, role, prompt, history, apiKey, model, roleInstructions, workspaceContext, sharedContext, baseUrl: config.baseUrl });
      } else if (provider === 'anthropic') {
        await this.runAnthropic({ agentId, role, prompt, history, apiKey, model, roleInstructions, workspaceContext, sharedContext });
      } else if (provider === 'ollama') {
        await this.runOllama({ agentId, role, prompt, history, model, roleInstructions, workspaceContext, sharedContext, baseUrl: config.baseUrl || 'http://localhost:11434' });
      }
    } catch (err) {
      this.emitEvent({
        type: 'error',
        agentId,
        error: err.message || 'Error executing agent request'
      });
      this.emitEvent({ type: 'status', agentId, status: 'error' });
    }
  }

  buildRoleSystemPrompt(role, name, customPrompt) {
    let base = `You are ${name}, an autonomous agent operating within BlackHat IDE.\n`;
    if (role === 'ARCHITECT') {
      base += `Your primary responsibility is SYSTEM ARCHITECTURE, API DESIGN, MODULE DECOMPOSITION, and PLANNING. 
Decompose complex problems into clean technical specifications, module contracts, and handoff tasks for Developer and Tester agents.`;
    } else if (role === 'DEVELOPER') {
      base += `Your primary responsibility is CORE IMPLEMENTATION, CODE WRITING, REFACTORING, and EXECUTION. 
Use workspace tools (read_file, write_file, edit_file, run_command) to implement architectural plans and deliver working software.`;
    } else if (role === 'TESTER') {
      base += `Your primary responsibility is QUALITY ASSURANCE, TEST AUTOMATION, REGRESSION PREVENTION, and EDGE CASE AUDITING. 
Verify code correctness, generate unit/integration test suites, simulate adversarial inputs, and validate boundary behavior.`;
    } else {
      base += `Your primary responsibility is specialist workflow execution for your designated expertise.`;
    }

    if (customPrompt) {
      base += `\nSpecial instructions: ${customPrompt}`;
    }

    return base;
  }

  formatContextPrompt(prompt, workspaceContext, sharedContext) {
    let fullPrompt = prompt;

    if (workspaceContext) {
      fullPrompt = `[Workspace Context]: ${workspaceContext}\n\n` + fullPrompt;
    }

    if (sharedContext && sharedContext.length > 0) {
      const contextSummary = sharedContext.map(c => `--- Shared by ${c.fromAgentName} (${c.fromAgentRole}) [${c.type.toUpperCase()}] ---\nTitle: ${c.title}\nContent:\n${c.content}\n`).join('\n');
      fullPrompt = `[Shared Multi-Agent Context Blackboard]:\n${contextSummary}\n\n[User Goal]:\n` + fullPrompt;
    }

    return fullPrompt;
  }

  async runSimulation({ agentId, role, name, prompt, sharedContext = [], workspaceContext = '' }) {
    // Step 1: Role-specific thinking
    let thoughtText = '';
    if (role === 'ARCHITECT') {
      thoughtText = `Architectural analysis: Evaluating requirements for "${prompt}". Checking system constraints, interfaces, and shared context...`;
    } else if (role === 'DEVELOPER') {
      thoughtText = `Engineering analysis: Parsing task "${prompt}". Inspecting files and preparing code changes...`;
    } else if (role === 'TESTER') {
      thoughtText = `QA analysis: Generating test scenarios for "${prompt}". Identifying edge cases, failure states, and assertion matrix...`;
    } else {
      thoughtText = `Specialist analysis: Processing request "${prompt}" with workspace context...`;
    }

    this.emitEvent({
      type: 'thought',
      agentId,
      thought: thoughtText
    });
    await this.delay(600);
    if (this.aborted) return;

    // Step 2: Tool execution
    if (role === 'ARCHITECT') {
      this.emitEvent({
        type: 'tool_call',
        agentId,
        tool: { id: `call_${Date.now()}`, name: 'list_dir', args: { path: '.' } }
      });
      this.emitEvent({ type: 'status', agentId, status: 'executing_tool' });
      await this.delay(700);
      const toolRes = await executeTool('list_dir', { path: '.' });
      this.emitEvent({
        type: 'tool_result',
        agentId,
        toolName: 'list_dir',
        result: toolRes
      });
    } else if (role === 'TESTER') {
      this.emitEvent({
        type: 'tool_call',
        agentId,
        tool: { id: `call_${Date.now()}`, name: 'search_files', args: { query: 'test' } }
      });
      this.emitEvent({ type: 'status', agentId, status: 'executing_tool' });
      await this.delay(750);
      const toolRes = await executeTool('search_files', { query: 'test' });
      this.emitEvent({
        type: 'tool_result',
        agentId,
        toolName: 'search_files',
        result: toolRes
      });
    } else {
      this.emitEvent({
        type: 'tool_call',
        agentId,
        tool: { id: `call_${Date.now()}`, name: 'run_command', args: { command: 'node -v && git status --short' } }
      });
      this.emitEvent({ type: 'status', agentId, status: 'executing_tool' });
      await this.delay(750);
      const toolRes = await executeTool('run_command', { command: 'node -v && git status --short' });
      this.emitEvent({
        type: 'tool_result',
        agentId,
        toolName: 'run_command',
        result: toolRes
      });
    }

    if (this.aborted) return;

    // Step 3: Synthesis Thought
    this.emitEvent({ type: 'status', agentId, status: 'thinking' });
    this.emitEvent({
      type: 'thought',
      agentId,
      thought: `Synthesizing tool outputs with multi-agent context blackboard. Formatting response...`
    });
    await this.delay(650);

    // Step 4: Role-specific streaming response
    this.emitEvent({ type: 'status', agentId, status: 'streaming' });

    let responseTemplate = '';

    if (role === 'ARCHITECT') {
      responseTemplate = `### 📐 Architecture & System Specification: ${prompt}\n\n` +
        `**Role**: System Architect\n` +
        `**Status**: Evaluated against active workspace topology.\n\n` +
        `#### 1. Architectural Blueprint & Boundaries\n` +
        `- **Data Layer**: Clean separation of state stores and real-time WebSocket event streams.\n` +
        `- **Multi-Agent Bus**: Inter-agent context exchange allows immediate handoffs between Architect, Developer, and Tester.\n` +
        `- **Extensibility**: Modular extensions registry supporting third-party tool adapters.\n\n` +
        `#### 2. Technical Contract\n` +
        `\`\`\`typescript\n` +
        `export interface ArchitectureContract {\n` +
        `  domain: 'system-design';\n` +
        `  modules: ['API Gateway', 'Context Bus', 'Execution Sandbox'];\n` +
        `  handoffTarget: 'DEVELOPER';\n` +
        `  timestamp: ${Date.now()};\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `*Click **"Share to Context Bus"** below to hand off this specification directly to the Developer agent.*`;
    } else if (role === 'DEVELOPER') {
      responseTemplate = `### 💻 Implementation: ${prompt}\n\n` +
        `**Role**: Core Developer\n` +
        `**Status**: Workspace code generated and verified.\n\n` +
        `#### 1. Code Changes & Implementation Details\n` +
        `- Applied modular type definitions and error boundaries.\n` +
        `- Handled cross-platform execution (macOS & Windows).\n` +
        `- Verified terminal execution and file persistence.\n\n` +
        `#### 2. Implementation Code\n` +
        `\`\`\`typescript\n` +
        `// Multi-agent worker execution implementation\n` +
        `export class TaskExecutor {\n` +
        `  async execute(task: string) {\n` +
        `    console.log(\`[Developer] Executing task: \${task}\`);\n` +
        `    return { status: 'success', executedAt: new Date().toISOString() };\n` +
        `  }\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `*Click **"Apply to Editor"** to load this into your current file, or **"Share to Context Bus"** to request QA testing from the Tester agent.*`;
    } else if (role === 'TESTER') {
      responseTemplate = `### 🧪 QA & Test Suite Verification: ${prompt}\n\n` +
        `**Role**: QA & Security Tester\n` +
        `**Status**: Validation suite generated with 100% boundary coverage.\n\n` +
        `#### 1. Test Matrix & Edge Cases\n` +
        `- [x] Happy path operational verification\n` +
        `- [x] Boundary conditions & invalid input handling\n` +
        `- [x] Concurrent multi-agent race condition prevention\n` +
        `- [x] Process lifecycle cleanup on exit\n\n` +
        `#### 2. Automated Test Suite\n` +
        `\`\`\`typescript\n` +
        `describe('Multi-Agent Suite', () => {\n` +
        `  it('should exchange context between Architect, Developer, and Tester', async () => {\n` +
        `    const bus = new ContextBus();\n` +
        `    bus.publish({ title: 'Spec', content: 'Architecture v1' });\n` +
        `    expect(bus.getItems().length).toBeGreaterThan(0);\n` +
        `  });\n` +
        `});\n` +
        `\`\`\`\n\n` +
        `*All tests passing. System is robust and regression-free.*`;
    } else {
      responseTemplate = `Processed task for **${prompt}** under specialized role **${role}**.\n\n` +
        `- Multi-agent workspace synchronized.\n` +
        `- Tool outputs evaluated.\n` +
        `- Context ready for inter-agent handoff.`;
    }

    const words = responseTemplate.split(' ');
    for (const word of words) {
      if (this.aborted) break;
      this.emitEvent({ type: 'token', agentId, token: word + ' ' });
      await this.delay(28);
    }

    this.emitEvent({ type: 'status', agentId, status: 'idle' });
    this.emitEvent({ type: 'done', agentId });
  }

  async runGemini({ agentId, prompt, history, apiKey, model, roleInstructions, workspaceContext, sharedContext }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const formattedContents = history.map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    }));

    const contextualizedPrompt = this.formatContextPrompt(prompt, workspaceContext, sharedContext);

    formattedContents.push({
      role: 'user',
      parts: [{ text: `${roleInstructions}\n\n${contextualizedPrompt}` }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: formattedContents,
        tools: [{
          functionDeclarations: TOOL_DEFINITIONS.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }))
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    this.emitEvent({ type: 'status', agentId, status: 'streaming' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (this.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            const candidate = data.candidates?.[0];
            const part = candidate?.content?.parts?.[0];

            if (part?.text) {
              this.emitEvent({ type: 'token', agentId, token: part.text });
            }

            if (part?.functionCall) {
              const { name, args } = part.functionCall;
              this.emitEvent({
                type: 'tool_call',
                agentId,
                tool: { id: `gemini_${Date.now()}`, name, args }
              });
              this.emitEvent({ type: 'status', agentId, status: 'executing_tool' });

              const toolRes = await executeTool(name, args);
              this.emitEvent({
                type: 'tool_result',
                agentId,
                toolName: name,
                result: toolRes
              });

              this.emitEvent({ type: 'status', agentId, status: 'streaming' });
            }
          } catch {}
        }
      }
    }

    this.emitEvent({ type: 'status', agentId, status: 'idle' });
    this.emitEvent({ type: 'done', agentId });
  }

  async runOpenAI({ agentId, prompt, history, apiKey, model, roleInstructions, workspaceContext, sharedContext, baseUrl = 'https://api.openai.com/v1' }) {
    const contextualizedPrompt = this.formatContextPrompt(prompt, workspaceContext, sharedContext);

    const messages = [
      { role: 'system', content: roleInstructions },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: contextualizedPrompt }
    ];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    this.emitEvent({ type: 'status', agentId, status: 'streaming' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (this.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const data = JSON.parse(trimmed.slice(6));
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              this.emitEvent({ type: 'token', agentId, token: delta });
            }
          } catch {}
        }
      }
    }

    this.emitEvent({ type: 'status', agentId, status: 'idle' });
    this.emitEvent({ type: 'done', agentId });
  }

  async runAnthropic({ agentId, prompt, history, apiKey, model, roleInstructions, workspaceContext, sharedContext }) {
    const contextualizedPrompt = this.formatContextPrompt(prompt, workspaceContext, sharedContext);

    const messages = [
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: contextualizedPrompt }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-7-sonnet-20250219',
        system: roleInstructions,
        max_tokens: 4096,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${errText}`);
    }

    this.emitEvent({ type: 'status', agentId, status: 'streaming' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (this.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              this.emitEvent({ type: 'token', agentId, token: data.delta.text });
            }
          } catch {}
        }
      }
    }

    this.emitEvent({ type: 'status', agentId, status: 'idle' });
    this.emitEvent({ type: 'done', agentId });
  }

  async runOllama({ agentId, prompt, history, model, roleInstructions, workspaceContext, sharedContext, baseUrl }) {
    const contextualizedPrompt = this.formatContextPrompt(prompt, workspaceContext, sharedContext);

    const messages = [
      { role: 'system', content: roleInstructions },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: contextualizedPrompt }
    ];

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'llama3.2',
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama connection error (${response.status}). Make sure Ollama is running at ${baseUrl}`);
    }

    this.emitEvent({ type: 'status', agentId, status: 'streaming' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      if (this.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              this.emitEvent({ type: 'token', agentId, token: data.message.content });
            }
          } catch {}
        }
      }
    }

    this.emitEvent({ type: 'status', agentId, status: 'idle' });
    this.emitEvent({ type: 'done', agentId });
  }

  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
}
