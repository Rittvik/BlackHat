import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Model Context Protocol (MCP) Client
 * Handles stdio JSON-RPC 2.0 communication with MCP servers
 */
export class McpServerConnection {
  constructor(name, config) {
    this.name = name;
    this.config = config; // { command, args, env, cwd }
    this.process = null;
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.tools = [];
    this.status = 'disconnected'; // 'connecting' | 'connected' | 'error'
    this.errorMessage = null;
    this.buffer = '';
  }

  async start() {
    this.status = 'connecting';
    const env = { ...process.env, ...(this.config.env || {}) };
    const cwd = this.config.cwd || process.cwd();

    try {
      this.process = spawn(this.config.command, this.config.args || [], {
        env,
        cwd,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout.on('data', (chunk) => {
        this.handleStdout(chunk.toString());
      });

      this.process.stderr.on('data', (chunk) => {
        const str = chunk.toString();
        // Keep logs for debugging without crashing
        if (process.env.DEBUG_MCP) {
          console.error(`[MCP:${this.name}:stderr]`, str);
        }
      });

      this.process.on('error', (err) => {
        console.error(`[MCP:${this.name}] Process error:`, err.message);
        this.status = 'error';
        this.errorMessage = err.message;
      });

      this.process.on('exit', (code, signal) => {
        this.status = 'disconnected';
        this.process = null;
      });

      // 1. Initialize Handshake
      await this.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: { listChanged: true },
          sampling: {}
        },
        clientInfo: {
          name: 'BlackHat-IDE',
          version: '1.0.0'
        }
      });

      // 2. Notification initialized
      this.sendNotification('notifications/initialized', {});

      // 3. Discover available tools
      const toolsResponse = await this.sendRequest('tools/list', {});
      this.tools = (toolsResponse && toolsResponse.tools) || [];
      this.status = 'connected';
      console.log(`[MCP:${this.name}] Connected! Loaded ${this.tools.length} tools.`);
      return true;
    } catch (err) {
      this.status = 'error';
      this.errorMessage = err.message;
      console.warn(`[MCP:${this.name}] Failed to start:`, err.message);
      return false;
    }
  }

  handleStdout(text) {
    this.buffer += text;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const msg = JSON.parse(trimmed);
        if (msg.id !== undefined && this.pendingRequests.has(msg.id)) {
          const { resolve, reject } = this.pendingRequests.get(msg.id);
          this.pendingRequests.delete(msg.id);
          if (msg.error) {
            reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            resolve(msg.result);
          }
        }
      } catch {
        // Not a JSON-RPC message, could be server banner/log
      }
    }
  }

  sendRequest(method, params, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
      if (!this.process || !this.process.stdin.writable) {
        return reject(new Error(`MCP server ${this.name} is not running`));
      }

      const id = this.requestId++;
      const req = {
        jsonrpc: '2.0',
        id,
        method,
        params
      };

      const timer = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`MCP request '${method}' timed out after ${timeoutMs}ms`));
        }
      }, timeoutMs);

      this.pendingRequests.set(id, {
        resolve: (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        }
      });

      this.process.stdin.write(JSON.stringify(req) + '\n');
    });
  }

  sendNotification(method, params) {
    if (!this.process || !this.process.stdin.writable) return;
    const msg = {
      jsonrpc: '2.0',
      method,
      params
    };
    this.process.stdin.write(JSON.stringify(msg) + '\n');
  }

  async callTool(toolName, args) {
    const res = await this.sendRequest('tools/call', {
      name: toolName,
      arguments: args
    }, 30000);

    return res;
  }

  stop() {
    if (this.process) {
      try {
        this.process.kill();
      } catch {}
      this.process = null;
    }
    this.status = 'disconnected';
  }
}

/**
 * MCP Manager to discover, initialize and query all configured MCP servers
 */
export class McpManager {
  constructor() {
    this.servers = new Map(); // name -> McpServerConnection
  }

  async loadConfigs() {
    const configPaths = [
      path.join(os.homedir(), '.blackhat', 'mcp_config.json'),
      path.join(os.homedir(), '.gemini', 'config', 'mcp_config.json'),
      path.join(os.homedir(), '.gemini', 'antigravity-ide', 'mcp_config.json'),
      path.join(process.cwd(), '.blackhat', 'mcp.json')
    ];

    const mergedServers = {};

    for (const confPath of configPaths) {
      try {
        const raw = await fs.readFile(confPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.mcpServers) {
          for (const [name, cfg] of Object.entries(parsed.mcpServers)) {
            mergedServers[name] = cfg;
          }
        }
      } catch {
        // file doesn't exist, ignore
      }
    }

    return mergedServers;
  }

  async initialize() {
    const configs = await this.loadConfigs();

    // Start each configured MCP server
    for (const [name, cfg] of Object.entries(configs)) {
      if (!this.servers.has(name)) {
        const conn = new McpServerConnection(name, cfg);
        this.servers.set(name, conn);
        // Connect in background so startup isn't blocked
        conn.start().catch(() => {});
      }
    }
  }

  getAllTools() {
    const tools = [];
    for (const [serverName, conn] of this.servers.entries()) {
      if (conn.status === 'connected' && conn.tools) {
        for (const t of conn.tools) {
          tools.push({
            name: `mcp_${serverName}_${t.name}`,
            originalName: t.name,
            serverName,
            description: `[MCP: ${serverName}] ${t.description || ''}`,
            parameters: t.inputSchema || { type: 'object', properties: {} }
          });
        }
      }
    }
    return tools;
  }

  async executeMcpTool(scopedToolName, args) {
    for (const [serverName, conn] of this.servers.entries()) {
      const prefix = `mcp_${serverName}_`;
      if (scopedToolName.startsWith(prefix)) {
        const realToolName = scopedToolName.substring(prefix.length);
        const result = await conn.callTool(realToolName, args);
        return {
          success: true,
          serverName,
          toolName: realToolName,
          result
        };
      }
    }
    throw new Error(`MCP tool not found: ${scopedToolName}`);
  }

  getServersStatus() {
    const list = [];
    for (const [name, conn] of this.servers.entries()) {
      list.push({
        name,
        status: conn.status,
        toolCount: conn.tools.length,
        errorMessage: conn.errorMessage,
        command: conn.config.command
      });
    }
    return list;
  }
}

export const mcpManager = new McpManager();
