const { app, BrowserWindow, ipcMain, shell, Menu, dialog } = require('electron');
const path = require('path');
const http = require('http');
const os = require('os');
const fs = require('fs/promises');
const fsSync = require('fs');
const { exec } = require('child_process');

// Enforce single instance lock to prevent runaway window cascades and duplicate instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[BlackHat] Another instance is already running. Quitting.');
  app.quit();
} else {
  let mainWindow = null;
  const openWindows = new Set();
  let serverProcess = null;

  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;
  const PORT = 3001;
  const isMac = process.platform === 'darwin';
  const isWindows = process.platform === 'win32';

  const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || (process.cwd() === '/' ? path.join(os.homedir(), 'BlackHat') : process.cwd());

  function checkServerRunning(port) {
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/api/files`, (res) => {
        resolve(true);
      });
      req.on('error', () => {
        resolve(false);
      });
      req.setTimeout(500, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  async function startBackendServer() {
    const isRunning = await checkServerRunning(PORT);
    if (isRunning) {
      console.log(`[BlackHat] Backend server is already running on port ${PORT}`);
      return;
    }

    try {
      const serverPath = path.join(__dirname, '..', 'server', 'index.js');
      const { pathToFileURL } = require('url');
      const serverUrl = pathToFileURL(serverPath).href;
      await import(serverUrl);
      console.log(`[BlackHat] Backend server started successfully in-process`);
    } catch (err) {
      console.error('[BlackHat Server Startup Error]:', err);
    }
  }

  function sendMenuCommand(cmd) {
    const targetWin = BrowserWindow.getFocusedWindow() || mainWindow;
    if (targetWin && targetWin.webContents) {
      targetWin.webContents.send('menu-command', cmd);
    }
  }

  function setupApplicationMenu() {
    const template = [
      ...(isMac ? [{
        label: 'BlackHat',
        submenu: [
          { label: 'About BlackHat IDE', role: 'about' },
          { type: 'separator' },
          {
            label: 'Preferences / Settings...',
            accelerator: 'CmdOrCtrl+,',
            click: () => sendMenuCommand('open-settings')
          },
          {
            label: 'AI Subscriptions & Accounts...',
            click: () => sendMenuCommand('open-account')
          },
          { type: 'separator' },
          { role: 'services' },
          { type: 'separator' },
          { role: 'hide' },
          { role: 'hideOthers' },
          { role: 'unhide' },
          { type: 'separator' },
          { role: 'quit' }
        ]
      }] : []),
      {
        label: 'File',
        submenu: [
          {
            label: 'New Window',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => createWindow()
          },
          {
            label: 'Open Folder / Project...',
            accelerator: 'CmdOrCtrl+O',
            click: async () => {
              const targetWin = BrowserWindow.getFocusedWindow() || mainWindow;
              const result = await dialog.showOpenDialog(targetWin || null, {
                title: 'Open Existing Project or Create New Folder',
                buttonLabel: 'Open Folder',
                properties: ['openDirectory', 'createDirectory']
              });
              if (!result.canceled && result.filePaths.length > 0) {
                const folderPath = result.filePaths[0];
                if (targetWin && targetWin.webContents) {
                  targetWin.webContents.send('open-project-folder', folderPath);
                } else {
                  createWindow(folderPath);
                }
              }
            }
          },
          {
            label: 'New Window with Folder...',
            click: async () => {
              const targetWin = BrowserWindow.getFocusedWindow() || mainWindow;
              const result = await dialog.showOpenDialog(targetWin || null, {
                title: 'Select Folder for New Window',
                buttonLabel: 'Open in New Window',
                properties: ['openDirectory', 'createDirectory']
              });
              if (!result.canceled && result.filePaths.length > 0) {
                createWindow(result.filePaths[0]);
              }
            }
          },
          {
            label: 'Create New Project...',
            click: () => sendMenuCommand('create-new-project')
          },
          { type: 'separator' },
          {
            label: 'New Text File',
            accelerator: 'CmdOrCtrl+N',
            click: () => sendMenuCommand('new-file')
          },
          {
            label: 'New Folder...',
            click: () => sendMenuCommand('new-folder')
          },
          { type: 'separator' },
          {
            label: 'Quick Open...',
            accelerator: 'CmdOrCtrl+P',
            click: () => sendMenuCommand('command-palette')
          },
          { type: 'separator' },
          {
            label: 'Save',
            accelerator: 'CmdOrCtrl+S',
            click: () => sendMenuCommand('save-file')
          },
          {
            label: 'Save All',
            accelerator: 'CmdOrCtrl+Alt+S',
            click: () => sendMenuCommand('save-all')
          },
          { type: 'separator' },
          {
            label: 'Close Editor',
            accelerator: 'CmdOrCtrl+W',
            click: () => sendMenuCommand('close-active-tab')
          },
          {
            label: 'Close Window',
            accelerator: 'CmdOrCtrl+Shift+W',
            click: () => {
              const targetWin = BrowserWindow.getFocusedWindow() || mainWindow;
              if (targetWin) targetWin.close();
            }
          },
          {
            label: 'Close All Editors',
            click: () => sendMenuCommand('close-all-tabs')
          },
          { type: 'separator' },
          isMac ? { role: 'close' } : { role: 'quit' }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Find in Files...',
            accelerator: 'CmdOrCtrl+Shift+F',
            click: () => sendMenuCommand('view-search')
          }
        ]
      },
      {
        label: 'Selection',
        submenu: [
          { role: 'selectAll' },
          {
            label: 'Expand Selection',
            click: () => sendMenuCommand('expand-selection')
          },
          {
            label: 'Shrink Selection',
            click: () => sendMenuCommand('shrink-selection')
          }
        ]
      },
      {
        label: 'View',
        submenu: [
          {
            label: 'Command Palette...',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: () => sendMenuCommand('command-palette')
          },
          { type: 'separator' },
          {
            label: 'Explorer',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => sendMenuCommand('view-explorer')
          },
          {
            label: 'Search',
            accelerator: 'CmdOrCtrl+Shift+F',
            click: () => sendMenuCommand('view-search')
          },
          {
            label: 'Source Control (Git)',
            accelerator: 'CmdOrCtrl+Shift+G',
            click: () => sendMenuCommand('view-source-control')
          },
          {
            label: 'Run and Debug',
            accelerator: 'CmdOrCtrl+Shift+D',
            click: () => sendMenuCommand('view-run-debug')
          },
          {
            label: 'Extensions Store (Open VSX)',
            accelerator: 'CmdOrCtrl+Shift+X',
            click: () => sendMenuCommand('view-extensions')
          },
          { type: 'separator' },
          {
            label: 'Toggle Primary SideBar',
            accelerator: 'CmdOrCtrl+B',
            click: () => sendMenuCommand('toggle-sidebar')
          },
          {
            label: 'Toggle Agent Studio',
            accelerator: 'CmdOrCtrl+Alt+B',
            click: () => sendMenuCommand('toggle-agent-window')
          },
          {
            label: 'Toggle Integrated Terminal',
            accelerator: 'Ctrl+`',
            click: () => sendMenuCommand('toggle-terminal')
          },
          { type: 'separator' },
          { role: 'resetZoom' },
          { role: 'zoomIn' },
          { role: 'zoomOut' },
          { type: 'separator' },
          { role: 'togglefullscreen' },
          {
            label: 'Toggle Developer Tools',
            accelerator: 'Alt+CmdOrCtrl+I',
            click: () => {
              if (mainWindow) mainWindow.webContents.toggleDevTools();
            }
          }
        ]
      },
      {
        label: 'Go',
        submenu: [
          {
            label: 'Go to File...',
            accelerator: 'CmdOrCtrl+P',
            click: () => sendMenuCommand('command-palette')
          },
          {
            label: 'Next Editor Tab',
            accelerator: 'Ctrl+Tab',
            click: () => sendMenuCommand('next-tab')
          },
          {
            label: 'Previous Editor Tab',
            accelerator: 'Ctrl+Shift+Tab',
            click: () => sendMenuCommand('prev-tab')
          }
        ]
      },
      {
        label: 'Run',
        submenu: [
          {
            label: 'Start Debugging / Run Target',
            accelerator: 'F5',
            click: () => sendMenuCommand('run-debug-target')
          },
          {
            label: 'Run Dev Server',
            click: () => sendMenuCommand('run-dev-server')
          },
          {
            label: '⚡ Run All AI Agents Concurrently',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => sendMenuCommand('run-all-agents')
          }
        ]
      },
      {
        label: 'Terminal',
        submenu: [
          {
            label: 'New Terminal',
            accelerator: 'Ctrl+Shift+`',
            click: () => sendMenuCommand('new-terminal')
          },
          {
            label: 'Clear Terminal Output',
            click: () => sendMenuCommand('clear-terminal')
          }
        ]
      },
      {
        label: 'Window',
        submenu: [
          { role: 'minimize' },
          { role: 'zoom' },
          ...(isMac ? [
            { type: 'separator' },
            { role: 'front' }
          ] : [
            { role: 'close' }
          ])
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'BlackHat Documentation',
            click: () => shell.openExternal('https://github.com/Rittvik/BlackHat')
          },
          {
            label: 'Open VSX Registry Marketplace',
            click: () => shell.openExternal('https://open-vsx.org')
          },
          { type: 'separator' },
          {
            label: 'AI Provider Settings...',
            click: () => sendMenuCommand('open-settings')
          },
          {
            label: 'Keyboard Shortcuts (Cmd+P)',
            click: () => sendMenuCommand('command-palette')
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  function createWindow(targetWorkspace) {
    const iconPath = path.join(__dirname, '..', 'build', isMac ? 'icon.icns' : 'icon.png');
    const win = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 1080,
      minHeight: 680,
      title: 'BlackHat',
      icon: iconPath,
      backgroundColor: '#090b0e',
      titleBarStyle: isMac ? 'hiddenInset' : (isWindows ? 'hidden' : 'default'),
      ...(isMac && { trafficLightPosition: { x: 14, y: 11 } }),
      ...(isWindows && {
        titleBarOverlay: {
          color: '#090b0e',
          symbolColor: '#94a3b8',
          height: 36
        }
      }),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        spellcheck: false
      }
    });

    openWindows.add(win);
    mainWindow = win;

    if (isMac && app.dock) {
      const dockPng = path.join(__dirname, '..', 'build', 'icon.png');
      try {
        app.dock.setIcon(dockPng);
      } catch (err) {
        console.error('Failed to set dock icon:', err);
      }
    }

    const queryParams = targetWorkspace ? `?workspace=${encodeURIComponent(targetWorkspace)}` : '';
    if (isDev) {
      win.loadURL(`http://localhost:5173${queryParams}`);
    } else {
      win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
        search: targetWorkspace ? `workspace=${encodeURIComponent(targetWorkspace)}` : ''
      });
    }

    win.webContents.on('did-finish-load', () => {
      if (targetWorkspace) {
        win.webContents.send('workspace-init', targetWorkspace);
      }
    });

    win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`[BlackHat UI Load Failure] Code: ${errorCode}, Description: ${errorDescription}, URL: ${validatedURL}`);
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    win.on('closed', () => {
      openWindows.delete(win);
      if (mainWindow === win) {
        mainWindow = openWindows.size > 0 ? Array.from(openWindows)[0] : null;
      }
    });

    return win;
  }

  // Window control IPCs (properly routed per window)
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }
    }
  });

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    if (win) win.close();
  });

  ipcMain.handle('window-is-maximized', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    return win ? win.isMaximized() : false;
  });

  // Open native OS folder chooser dialog
  ipcMain.handle('open-folder-dialog', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender) || mainWindow;
    const result = await dialog.showOpenDialog(win || null, {
      title: 'Open Existing Project or Create New Folder',
      buttonLabel: 'Select Folder',
      properties: ['openDirectory', 'createDirectory']
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Create new window with optional workspace path
  ipcMain.handle('create-new-window', async (_, workspacePath) => {
    createWindow(workspacePath);
    return true;
  });

  ipcMain.on('open-external', (_, url) => {
    shell.openExternal(url);
  });

  // Reveal in OS File Manager (Finder / Explorer)
  ipcMain.on('reveal-in-finder', (_, relPath) => {
    try {
      const fullPath = path.resolve(WORKSPACE_ROOT, relPath || '');
      shell.showItemInFolder(fullPath);
    } catch (e) {
      console.error('Error revealing in finder:', e);
    }
  });

  // Clear App Cache and Session Storage
  ipcMain.handle('clear-app-cache', async () => {
    try {
      if (mainWindow && mainWindow.webContents && mainWindow.webContents.session) {
        await mainWindow.webContents.session.clearStorageData();
        await mainWindow.webContents.session.clearCache();
        console.log('[BlackHat] Electron app session and storage cache cleared.');
        return true;
      }
    } catch (err) {
      console.error('Failed to clear electron cache:', err);
    }
    return false;
  });

  // -------------------------------------------------------------
  // Native Direct IPC Operations (100% Native, No HTTP / Port Dependency)
  // -------------------------------------------------------------
  const resolveTargetRoot = (workspace) => {
    if (!workspace) return WORKSPACE_ROOT;
    const candidate = workspace.startsWith('~') ? path.join(os.homedir(), workspace.slice(1)) : workspace;
    return path.resolve(candidate);
  };

  const buildNativeFileTree = async (dir, rootDir) => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nodes = [];
    for (const entry of entries) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.DS_Store') {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath);
      if (entry.isDirectory()) {
        const children = await buildNativeFileTree(fullPath, rootDir);
        nodes.push({
          id: relPath,
          name: entry.name,
          path: relPath,
          isDirectory: true,
          children
        });
      } else {
        nodes.push({
          id: relPath,
          name: entry.name,
          path: relPath,
          isDirectory: false
        });
      }
    }
    return nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  ipcMain.handle('native:list-files', async (_, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const tree = await buildNativeFileTree(root, root);
      return { success: true, tree };
    } catch (err) {
      return { success: false, error: err.message, tree: [] };
    }
  });

  ipcMain.handle('native:read-file', async (_, filePath, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      return { success: true, content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:write-file', async (_, filePath, content, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:create-file', async (_, filePath, isDirectory, content, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
      if (isDirectory) {
        await fs.mkdir(fullPath, { recursive: true });
      } else {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content || '', 'utf8');
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:delete-file', async (_, filePath, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
      await fs.rm(fullPath, { recursive: true, force: true });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:rename-file', async (_, oldPath, newPath, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const fullOld = path.isAbsolute(oldPath) ? oldPath : path.resolve(root, oldPath);
      const fullNew = path.isAbsolute(newPath) ? newPath : path.resolve(root, newPath);
      await fs.mkdir(path.dirname(fullNew), { recursive: true });
      await fs.rename(fullOld, fullNew);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:duplicate-file', async (_, filePath, workspace) => {
    const root = resolveTargetRoot(workspace);
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(root, filePath);
      const ext = path.extname(fullPath);
      const dir = path.dirname(filePath);
      const base = path.basename(filePath, ext);
      const newName = `${base}_copy${ext}`;
      const newRelPath = dir === '.' ? newName : path.join(dir, newName);
      const fullNew = path.resolve(root, newRelPath);
      await fs.copyFile(fullPath, fullNew);
      return { success: true, newPath: newRelPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:git-status', async (_, workspace) => {
    const root = resolveTargetRoot(workspace);
    return new Promise((resolve) => {
      exec('git status --porcelain=v1 && git branch --show-current', { cwd: root }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ success: false, error: stderr || error.message, files: [], branch: 'main' });
        }
        const lines = stdout.trim().split('\n');
        const branch = lines.pop() || 'main';
        const files = lines
          .filter(l => l.trim().length > 0)
          .map(line => ({
            code: line.substring(0, 2).trim(),
            path: line.substring(3).trim()
          }));
        resolve({ success: true, branch, files });
      });
    });
  });

  ipcMain.handle('native:git-commit', async (_, message, workspace) => {
    const root = resolveTargetRoot(workspace);
    return new Promise((resolve) => {
      exec(`git add -A && git commit -m "${(message || '').replace(/"/g, '\\"')}"`, { cwd: root }, (error, stdout, stderr) => {
        if (error) {
          return resolve({ success: false, error: stderr || error.message });
        }
        resolve({ success: true, stdout });
      });
    });
  });

  ipcMain.handle('native:git-diff', async (_, filePath, workspace) => {
    const root = resolveTargetRoot(workspace);
    return new Promise((resolve) => {
      exec(`git diff ${filePath || ''}`, { cwd: root }, (error, stdout) => {
        resolve({ success: !error, diff: stdout || '' });
      });
    });
  });

  ipcMain.handle('native:search', async (_, query, caseSensitive, isRegex, workspace) => {
    const root = resolveTargetRoot(workspace);
    if (!query) return { success: true, results: [], total: 0 };
    const results = [];
    const searchDir = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.DS_Store') continue;
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            await searchDir(fullPath);
          } else {
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                let match = false;
                if (isRegex) {
                  try {
                    const regex = new RegExp(query, caseSensitive ? 'g' : 'gi');
                    match = regex.test(line);
                  } catch {
                    match = false;
                  }
                } else {
                  match = caseSensitive ? line.includes(query) : line.toLowerCase().includes(query.toLowerCase());
                }
                if (match) {
                  results.push({
                    path: path.relative(root, fullPath),
                    line: idx + 1,
                    content: line.trim()
                  });
                }
              });
            } catch {
              // skip binary or unreadable files
            }
          }
        }
      } catch (e) {
        // ignore
      }
    };
    await searchDir(root);
    return { success: true, results, total: results.length };
  });

  ipcMain.handle('native:run-terminal', async (_, command, reqCwd) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? (process.env.COMSPEC || 'powershell.exe') : (process.env.SHELL || '/bin/zsh');
    let executionCwd = WORKSPACE_ROOT;
    if (reqCwd) {
      const candidate = reqCwd.startsWith('~') ? path.join(os.homedir(), reqCwd.slice(1)) : reqCwd;
      executionCwd = path.isAbsolute(candidate) ? candidate : path.resolve(WORKSPACE_ROOT, candidate);
    }
    try {
      const s = await fs.stat(executionCwd);
      if (!s.isDirectory()) executionCwd = WORKSPACE_ROOT;
    } catch {
      executionCwd = WORKSPACE_ROOT;
    }

    const cwdMarker = `___BLACKHAT_CWD_${Date.now()}___`;
    let wrappedCommand;
    if (isWindows) {
      wrappedCommand = `${command}; Write-Output "${cwdMarker}$((Get-Location).Path)"`;
    } else {
      wrappedCommand = `${command}; echo "${cwdMarker}$(pwd)"`;
    }

    return new Promise((resolve) => {
      exec(wrappedCommand, { cwd: executionCwd, shell, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        let finalCwd = executionCwd;
        let cleanStdout = stdout || '';
        if (cleanStdout.includes(cwdMarker)) {
          const parts = cleanStdout.split(cwdMarker);
          cleanStdout = parts[0];
          const extracted = parts[1]?.trim().split(/\r?\n/)[0];
          if (extracted && fsSync.existsSync(extracted)) {
            finalCwd = extracted;
          }
        }
        resolve({
          success: !error || error.code === 0,
          stdout: cleanStdout,
          stderr: stderr || '',
          exitCode: error ? (error.code ?? 1) : 0,
          cwd: finalCwd
        });
      });
    });
  });

  ipcMain.handle('native:create-project', async (_, projectPath, projectName, template) => {
    const baseDir = projectPath ? path.resolve(projectPath) : path.join(os.homedir(), projectName || 'project');
    try {
      await fs.mkdir(baseDir, { recursive: true });
      const entries = await fs.readdir(baseDir);
      if (entries.length === 0) {
        const safeName = (projectName || path.basename(baseDir)).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
        if (template === 'react-ts' || template === 'typescript') {
          await fs.writeFile(path.join(baseDir, 'package.json'), JSON.stringify({
            name: safeName,
            version: '1.0.0',
            private: true,
            type: 'module',
            scripts: { dev: 'vite', build: 'tsc && vite build' }
          }, null, 2));
          await fs.mkdir(path.join(baseDir, 'src'), { recursive: true });
          await fs.writeFile(path.join(baseDir, 'src', 'index.ts'), `// Entry point for ${projectName || path.basename(baseDir)}\nconsole.log('Welcome to ${projectName || path.basename(baseDir)} built with BlackHat IDE');\n`);
          await fs.writeFile(path.join(baseDir, 'README.md'), `# ${projectName || path.basename(baseDir)}\n\nProject initialized in BlackHat IDE.\n`);
        } else if (template === 'python') {
          await fs.writeFile(path.join(baseDir, 'main.py'), `# Entry point for ${projectName || path.basename(baseDir)}\ndef main():\n    print("Hello from BlackHat IDE!")\n\nif __name__ == "__main__":\n    main()\n`);
          await fs.writeFile(path.join(baseDir, 'requirements.txt'), `# Project dependencies\n`);
          await fs.writeFile(path.join(baseDir, 'README.md'), `# ${projectName || path.basename(baseDir)}\n\nPython project created in BlackHat IDE.\n`);
        } else if (template === 'node') {
          await fs.writeFile(path.join(baseDir, 'package.json'), JSON.stringify({
            name: safeName,
            version: '1.0.0',
            main: 'index.js',
            type: 'module'
          }, null, 2));
          await fs.writeFile(path.join(baseDir, 'index.js'), `// ${projectName || path.basename(baseDir)}\nconsole.log('Node.js service running in BlackHat IDE');\n`);
          await fs.writeFile(path.join(baseDir, 'README.md'), `# ${projectName || path.basename(baseDir)}\n\nNode.js project created in BlackHat IDE.\n`);
        } else {
          await fs.writeFile(path.join(baseDir, 'README.md'), `# ${projectName || path.basename(baseDir)}\n\nWorkspace created in BlackHat IDE.\n`);
        }
      }
      return { success: true, projectPath: baseDir };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('native:validate-project', async (_, target) => {
    if (!target || typeof target !== 'string') return { valid: false, error: 'Path is required' };
    try {
      const resolved = path.resolve(target.startsWith('~') ? path.join(os.homedir(), target.slice(1)) : target);
      const exists = fsSync.existsSync(resolved);
      const isDir = exists && fsSync.statSync(resolved).isDirectory();
      return { valid: exists && isDir, path: resolved, exists, isDirectory: isDir };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  });

  ipcMain.handle('native:workspace-info', async (_, workspace) => {
    const root = resolveTargetRoot(workspace);
    return {
      workspaceRoot: root,
      workspaceName: path.basename(root),
      username: os.userInfo().username || 'developer',
      hostname: os.hostname().split('.')[0] || 'localhost',
      platform: process.platform
    };
  });

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await startBackendServer();
    setupApplicationMenu();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  function cleanupServer() {
    if (serverProcess) {
      try {
        serverProcess.kill('SIGTERM');
      } catch (e) {
        // ignore
      }
      serverProcess = null;
    }
  }

  app.on('before-quit', cleanupServer);
  app.on('will-quit', cleanupServer);
}
