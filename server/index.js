import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import fs from 'fs/promises';
import { exec } from 'child_process';
import { WebSocketServer } from 'ws';
import { AgentRunner } from './agentRunner.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const WORKSPACE_ROOT = process.cwd();

// Active agent runners map: agentId -> runner
const activeRunners = new Map();

// Helper to recursively list files
async function getFileTree(dir, relativePath = '') {
  const fullPath = path.join(dir, relativePath);
  const entries = await fs.readdir(fullPath, { withFileTypes: true });
  const items = [];

  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', '.DS_Store'].includes(entry.name)) {
      continue;
    }
    const itemRelPath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      const children = await getFileTree(dir, itemRelPath);
      items.push({
        name: entry.name,
        path: itemRelPath,
        isDirectory: true,
        children
      });
    } else {
      items.push({
        name: entry.name,
        path: itemRelPath,
        isDirectory: false
      });
    }
  }

  // Sort folders first, then files alphabetically
  items.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return items;
}

// 1. Filesystem Endpoints
app.get('/api/files', async (req, res) => {
  try {
    const tree = await getFileTree(WORKSPACE_ROOT);
    res.json({ success: true, tree });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/file', async (req, res) => {
  try {
    const relPath = req.query.path;
    if (!relPath) return res.status(400).json({ error: 'Missing path query parameter' });
    const fullPath = path.resolve(WORKSPACE_ROOT, relPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content, path: relPath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/file', async (req, res) => {
  try {
    const { path: relPath, content } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Missing path in request body' });
    const fullPath = path.resolve(WORKSPACE_ROOT, relPath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    res.json({ success: true, message: `Saved ${relPath}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/file/create', async (req, res) => {
  try {
    const { path: relPath, isDirectory, content = '' } = req.body;
    const fullPath = path.resolve(WORKSPACE_ROOT, relPath);
    if (isDirectory) {
      await fs.mkdir(fullPath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');
    }
    res.json({ success: true, message: `Created ${relPath}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/file', async (req, res) => {
  try {
    const relPath = req.query.path;
    const fullPath = path.resolve(WORKSPACE_ROOT, relPath);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
    res.json({ success: true, message: `Deleted ${relPath}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Terminal Command Execution
app.post('/api/terminal/run', async (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'Missing command' });

  const isWindows = process.platform === 'win32';
  const shell = isWindows ? (process.env.COMSPEC || 'powershell.exe') : (process.env.SHELL || '/bin/zsh');

  exec(command, { cwd: WORKSPACE_ROOT, shell }, (error, stdout, stderr) => {
    res.json({
      success: !error,
      stdout: stdout || '',
      stderr: stderr || '',
      exitCode: error ? (error.code || 1) : 0
    });
  });
});

// 3. Multi-Agent Streaming Execution (SSE)
app.post('/api/agent/stream', (req, res) => {
  const { agentId, role, name, prompt, history, config, workspaceContext, sharedContext } = req.body;
  if (!agentId || !prompt) {
    return res.status(400).json({ error: 'Missing agentId or prompt' });
  }

  // Setup SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders();

  const sendEvent = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const runner = new AgentRunner(sendEvent);
  activeRunners.set(agentId, runner);

  res.on('close', () => {
    runner.abort();
    activeRunners.delete(agentId);
  });

  runner.run({ agentId, role, name, prompt, history, config, workspaceContext, sharedContext })
    .finally(() => {
      activeRunners.delete(agentId);
      res.end();
    });
});

// 4. Stop Agent Execution
app.post('/api/agent/stop', (req, res) => {
  const { agentId } = req.body;
  if (activeRunners.has(agentId)) {
    activeRunners.get(agentId).abort();
    activeRunners.delete(agentId);
    return res.json({ success: true, message: `Agent ${agentId} stopped` });
  }
  res.json({ success: false, message: `Agent ${agentId} was not running` });
});

// WebSocket Connection for Terminal & Real-Time Sync
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', time: Date.now() }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch {}
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Antigravity IDE Server] Running on http://localhost:${PORT}`);
});
