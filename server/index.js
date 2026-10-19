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

import os from 'os';
import fsSync from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
let pty = null;
try {
  pty = require('node-pty');
} catch (e) {
  console.warn('[BlackHat Server] node-pty import warning:', e.message);
}

// Ensure spawn-helper binary has executable permissions on unix systems
function ensureSpawnHelperPermissions() {
  try {
    const ptyPath = require.resolve('node-pty');
    const ptyDir = path.dirname(ptyPath);
    const prebuildsDir = path.join(ptyDir, '..', 'prebuilds');
    if (fsSync.existsSync(prebuildsDir)) {
      const archDirs = ['darwin-arm64', 'darwin-x64', 'linux-x64', 'linux-arm64'];
      for (const d of archDirs) {
        const helperPath = path.join(prebuildsDir, d, 'spawn-helper');
        if (fsSync.existsSync(helperPath)) {
          try {
            fsSync.chmodSync(helperPath, 0o755);
          } catch {}
        }
      }
    }
  } catch {}
}
ensureSpawnHelperPermissions();

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || (process.cwd() === '/' ? path.join(os.homedir(), 'BlackHat') : process.cwd());

// Active agent runners map: agentId -> runner
const activeRunners = new Map();

// Active PTY terminal sessions map: sessionId -> session object
const ptySessions = new Map();

function getOrCreatePtySession(sessionId, initialCols = 80, initialRows = 24, initialCwd = WORKSPACE_ROOT) {
  if (ptySessions.has(sessionId)) {
    const existing = ptySessions.get(sessionId);
    if (existing.ptyProcess) {
      return existing;
    }
  }

  ensureSpawnHelperPermissions();

  const isWindows = process.platform === 'win32';
  const defaultShell = isWindows 
    ? (process.env.COMSPEC || 'powershell.exe') 
    : (process.env.SHELL || '/bin/zsh');

  const shell = fsSync.existsSync(defaultShell) 
    ? defaultShell 
    : (isWindows ? 'cmd.exe' : '/bin/bash');

  let executionCwd = initialCwd || WORKSPACE_ROOT;
  try {
    if (!fsSync.existsSync(executionCwd)) {
      executionCwd = WORKSPACE_ROOT;
    }
  } catch {
    executionCwd = WORKSPACE_ROOT;
  }

  const ptyProcess = pty ? pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: Math.max(10, initialCols || 80),
    rows: Math.max(5, initialRows || 24),
    cwd: executionCwd,
    env: {
      ...process.env,
      TERM: 'xterm-256color',
      COLORTERM: 'truecolor',
      WORKSPACE_ROOT
    }
  }) : null;

  const sessionObj = {
    id: sessionId,
    ptyProcess,
    cwd: executionCwd,
    historyBuffer: '',
    subscribers: new Set()
  };

  if (ptyProcess) {
    ptyProcess.onData((data) => {
      sessionObj.historyBuffer = (sessionObj.historyBuffer + data).slice(-50000);
      const msg = JSON.stringify({ type: 'pty_data', id: sessionId, data });
      for (const ws of sessionObj.subscribers) {
        if (ws.readyState === 1) { // WebSocket.OPEN
          ws.send(msg);
        }
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      const msg = JSON.stringify({ type: 'pty_exit', id: sessionId, exitCode, signal });
      for (const ws of sessionObj.subscribers) {
        if (ws.readyState === 1) {
          ws.send(msg);
        }
      }
      ptySessions.delete(sessionId);
    });
  }

  ptySessions.set(sessionId, sessionObj);
  return sessionObj;
}

// Helper to recursively list files
async function getFileTree(dir, relativePath = '', depth = 0) {
  if (depth > 5) return [];
  const fullPath = path.join(dir, relativePath);
  let entries = [];
  try {
    entries = await fs.readdir(fullPath, { withFileTypes: true });
  } catch (err) {
    return [];
  }
  const items = [];

  for (const entry of entries) {
    if (['node_modules', '.git', 'dist', 'release', '.DS_Store', 'Library'].includes(entry.name) || (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env.example')) {
      continue;
    }
    const itemRelPath = path.join(relativePath, entry.name);
    if (entry.isDirectory()) {
      const children = await getFileTree(dir, itemRelPath, depth + 1);
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

app.post('/api/file/rename', async (req, res) => {
  try {
    const { oldPath, newPath } = req.body;
    if (!oldPath || !newPath) return res.status(400).json({ error: 'Missing oldPath or newPath' });
    const fullOld = path.resolve(WORKSPACE_ROOT, oldPath);
    const fullNew = path.resolve(WORKSPACE_ROOT, newPath);
    await fs.mkdir(path.dirname(fullNew), { recursive: true });
    await fs.rename(fullOld, fullNew);
    res.json({ success: true, message: `Renamed to ${newPath}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/file/duplicate', async (req, res) => {
  try {
    const { path: relPath } = req.body;
    if (!relPath) return res.status(400).json({ error: 'Missing path' });
    const fullPath = path.resolve(WORKSPACE_ROOT, relPath);
    const ext = path.extname(relPath);
    const base = path.basename(relPath, ext);
    const dir = path.dirname(relPath);
    const newName = `${base}_copy${ext}`;
    const newRelPath = dir === '.' ? newName : path.join(dir, newName);
    const fullNew = path.resolve(WORKSPACE_ROOT, newRelPath);
    await fs.copyFile(fullPath, fullNew);
    res.json({ success: true, newPath: newRelPath });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Global Search in Workspace
app.get('/api/search', async (req, res) => {
  try {
    const { q, caseSensitive = 'false', isRegex = 'false' } = req.query;
    if (!q) return res.json({ success: true, results: [] });

    const results = [];
    const maxResults = 100;
    const isCase = caseSensitive === 'true';
    const isReg = isRegex === 'true';
    let regex;
    try {
      regex = isReg ? new RegExp(q, isCase ? 'g' : 'gi') : null;
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid regular expression' });
    }

    async function searchDir(dir, rel = '', depth = 0) {
      if (depth > 6 || results.length >= maxResults) return;
      const full = path.join(dir, rel);
      let entries = [];
      try {
        entries = await fs.readdir(full, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        if (results.length >= maxResults) break;
        if (['node_modules', '.git', 'dist', 'release', '.DS_Store'].includes(entry.name) || (entry.name.startsWith('.') && entry.name !== '.gitignore')) {
          continue;
        }
        const itemRel = path.join(rel, entry.name);
        if (entry.isDirectory()) {
          await searchDir(dir, itemRel, depth + 1);
        } else {
          try {
            const filePath = path.join(dir, itemRel);
            const content = await fs.readFile(filePath, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
              if (results.length >= maxResults) break;
              const line = lines[i];
              let matched = false;
              if (regex) {
                matched = regex.test(line);
                regex.lastIndex = 0;
              } else {
                matched = isCase ? line.includes(q) : line.toLowerCase().includes(q.toLowerCase());
              }
              if (matched) {
                results.push({
                  path: itemRel,
                  line: i + 1,
                  content: line.trim()
                });
              }
            }
          } catch {
            // skip binary / unreadable files
          }
        }
      }
    }

    await searchDir(WORKSPACE_ROOT);
    res.json({ success: true, results, total: results.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1c. Git Source Control Endpoints
app.get('/api/git/status', async (req, res) => {
  exec('git status --porcelain=v1 && git branch --show-current', { cwd: WORKSPACE_ROOT }, (error, stdout, stderr) => {
    if (error) {
      return res.json({ success: false, error: stderr || error.message });
    }
    const lines = stdout.trim().split('\n');
    const branch = lines.pop() || 'main';
    const files = lines.filter(Boolean).map(line => {
      const code = line.substring(0, 2).trim();
      const filePath = line.substring(3).trim();
      return { code, path: filePath };
    });
    res.json({ success: true, branch, files });
  });
});

app.post('/api/git/commit', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Commit message is required' });
  exec(`git add -A && git commit -m "${message.replace(/"/g, '\\"')}"`, { cwd: WORKSPACE_ROOT }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ success: false, error: stderr || error.message });
    }
    res.json({ success: true, output: stdout });
  });
});

app.get('/api/git/diff', async (req, res) => {
  const filePath = req.query.path || '';
  exec(`git diff ${filePath}`, { cwd: WORKSPACE_ROOT }, (error, stdout, stderr) => {
    res.json({ success: !error, diff: stdout || '' });
  });
});

// 2. Terminal Command Execution
app.post('/api/terminal/run', async (req, res) => {
  const { command, cwd: reqCwd } = req.body;
  if (!command) return res.status(400).json({ error: 'Missing command' });

  const isWindows = process.platform === 'win32';
  const shell = isWindows ? (process.env.COMSPEC || 'powershell.exe') : (process.env.SHELL || '/bin/zsh');

  let executionCwd = WORKSPACE_ROOT;
  if (reqCwd) {
    const candidate = reqCwd.startsWith('~') ? path.join(os.homedir(), reqCwd.slice(1)) : reqCwd;
    executionCwd = path.isAbsolute(candidate) ? candidate : path.resolve(WORKSPACE_ROOT, candidate);
  }

  // Ensure executionCwd exists; fallback to WORKSPACE_ROOT if deleted
  try {
    const s = await fs.stat(executionCwd);
    if (!s.isDirectory()) executionCwd = WORKSPACE_ROOT;
  } catch {
    executionCwd = WORKSPACE_ROOT;
  }

  // Shell probe to capture final CWD and preserve the child command's exit code
  const wrappedCmd = isWindows
    ? `${command}\r\n$__ec = $LASTEXITCODE; Write-Host "\`n__CWD__:$((Get-Location).Path)"; exit $__ec`
    : `${command}\n__STATUS__=$?\nprintf "\\n__CWD__:%s" "$PWD"\nexit $__STATUS__`;

  exec(wrappedCmd, { cwd: executionCwd, shell }, (error, stdout, stderr) => {
    let finalCwd = executionCwd;
    let cleanStdout = stdout || '';

    const cwdMatch = cleanStdout.match(/\n__CWD__:(.*)$/);
    if (cwdMatch) {
      finalCwd = cwdMatch[1].trim() || executionCwd;
      cleanStdout = cleanStdout.substring(0, cwdMatch.index);
    }

    res.json({
      success: !error,
      stdout: cleanStdout,
      stderr: stderr || '',
      exitCode: error ? (error.code || 1) : 0,
      cwd: finalCwd
    });
  });
});

app.get('/api/workspace/info', (req, res) => {
  res.json({
    workspaceRoot: WORKSPACE_ROOT,
    username: os.userInfo().username || 'developer',
    hostname: os.hostname().split('.')[0] || 'localhost',
    platform: process.platform,
    homeDir: os.homedir()
  });
});

// 2b. In-Memory Session Management (Zero Local Storage for API Keys)
const activeAuthSessions = new Map();

app.post('/api/auth/session', (req, res) => {
  const { provider, email, name, sessionToken: reqToken } = req.body;
  if (!email || !provider) {
    return res.status(400).json({ success: false, error: 'Missing email or provider' });
  }

  const sessionToken = reqToken || `sess_${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const sessionData = {
    provider,
    email,
    name: name || email.split('@')[0],
    sessionToken,
    authenticatedAt: new Date().toISOString(),
    services: {
      gemini: {
        connected: true,
        status: 'Active (Google AI Studio / Google One)',
        account: email,
        model: 'gemini-2.5-pro'
      },
      claude: {
        connected: true,
        status: 'Active (Workspace Federation)',
        account: email,
        model: 'claude-3-7-sonnet'
      },
      codex: {
        connected: true,
        status: 'Active (Workspace Federation)',
        account: email,
        model: 'gpt-4o'
      }
    }
  };

  activeAuthSessions.set(sessionToken, sessionData);
  res.json({
    success: true,
    sessionToken,
    session: sessionData,
    message: 'Authenticated session established. Zero local API keys required.'
  });
});

app.get('/api/auth/session', (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query.token;
  if (token && activeAuthSessions.has(token)) {
    return res.json({ success: true, session: activeAuthSessions.get(token) });
  }
  if (activeAuthSessions.size > 0) {
    const lastSession = Array.from(activeAuthSessions.values()).pop();
    return res.json({ success: true, session: lastSession });
  }
  res.json({ success: false, session: null });
});

app.post('/api/auth/logout', (req, res) => {
  const { sessionToken } = req.body;
  if (sessionToken && activeAuthSessions.has(sessionToken)) {
    activeAuthSessions.delete(sessionToken);
  } else {
    activeAuthSessions.clear();
  }
  res.json({ success: true, message: 'Logged out successfully' });
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

// 5. Open VSX Marketplace Proxy Endpoint
app.get('/api/extensions/openvsx', async (req, res) => {
  try {
    const { query = '', size = 25, sortBy = 'downloadCount', sortOrder = 'desc', category = '' } = req.query;
    let url = `https://open-vsx.org/api/-/search?size=${size}&sortBy=${encodeURIComponent(sortBy)}&sortOrder=${encodeURIComponent(sortOrder)}`;
    if (query) {
      url += `&query=${encodeURIComponent(query)}`;
    }
    if (category && category !== 'All') {
      url += `&category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BlackHat-IDE/1.0.0 (Open-VSX-Client)'
      }
    });

    if (!response.ok) {
      throw new Error(`Open VSX responded with status ${response.status}`);
    }

    const data = await response.json();
    res.json({ success: true, extensions: data.extensions || [], total: data.totalSize || 0 });
  } catch (err) {
    console.error('Open VSX proxy error:', err.message);
    res.status(500).json({ success: false, error: err.message, extensions: [] });
  }
});

// WebSocket Connection for Native Terminal & Real-Time Sync
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', time: Date.now() }));

  const subscribedSessions = new Set();

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      if (data.type === 'pty_init') {
        const sessionId = data.id || 'default';
        const session = getOrCreatePtySession(sessionId, data.cols, data.rows, data.cwd);
        session.subscribers.add(ws);
        subscribedSessions.add(sessionId);

        // Send replay buffer if reattaching
        if (session.historyBuffer) {
          ws.send(JSON.stringify({ type: 'pty_data', id: sessionId, data: session.historyBuffer }));
        }

        // Send ready confirmation
        ws.send(JSON.stringify({ 
          type: 'pty_ready', 
          id: sessionId, 
          cwd: session.cwd,
          platform: process.platform 
        }));
        return;
      }

      if (data.type === 'pty_input') {
        const sessionId = data.id || 'default';
        const session = ptySessions.get(sessionId);
        if (session && session.ptyProcess) {
          session.ptyProcess.write(data.data);
        }
        return;
      }

      if (data.type === 'pty_resize') {
        const sessionId = data.id || 'default';
        const session = ptySessions.get(sessionId);
        if (session && session.ptyProcess && data.cols && data.rows) {
          try {
            session.ptyProcess.resize(Math.max(10, data.cols), Math.max(5, data.rows));
          } catch {}
        }
        return;
      }

      if (data.type === 'pty_kill') {
        const sessionId = data.id || 'default';
        const session = ptySessions.get(sessionId);
        if (session && session.ptyProcess) {
          try {
            session.ptyProcess.kill();
          } catch {}
          ptySessions.delete(sessionId);
        }
        return;
      }
    } catch (err) {
      console.error('[WebSocket] Terminal message error:', err);
    }
  });

  ws.on('close', () => {
    for (const sessionId of subscribedSessions) {
      const session = ptySessions.get(sessionId);
      if (session) {
        session.subscribers.delete(ws);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Antigravity IDE Server] Running on http://localhost:${PORT}`);
});
