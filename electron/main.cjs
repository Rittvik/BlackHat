const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const http = require('http');
const os = require('os');

// Enforce single instance lock to prevent runaway window cascades and duplicate instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('[BlackHat] Another instance is already running. Quitting.');
  app.quit();
} else {
  let mainWindow = null;
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
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('menu-command', cmd);
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
            label: 'Open File / Quick Open...',
            accelerator: 'CmdOrCtrl+O',
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

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1440,
      height: 920,
      minWidth: 1080,
      minHeight: 680,
      title: 'BlackHat',
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

    if (isDev) {
      mainWindow.loadURL('http://localhost:5173');
    } else {
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`[BlackHat UI Load Failure] Code: ${errorCode}, Description: ${errorDescription}, URL: ${validatedURL}`);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  }

  // Window control IPCs
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
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
