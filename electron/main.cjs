const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

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

    const defaultWorkspace = process.env.WORKSPACE_ROOT || path.join(__dirname, '..');
    const serverPath = path.join(__dirname, '..', 'server', 'index.js');
    serverProcess = spawn(process.execPath, [serverPath], {
      cwd: defaultWorkspace,
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: PORT.toString(),
        WORKSPACE_ROOT: defaultWorkspace
      },
      stdio: 'inherit'
    });

    serverProcess.on('error', (err) => {
      console.error('[BlackHat Server Process Error]:', err);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`[BlackHat Server Process Exited]: code ${code}, signal ${signal}`);
    });
  }

  function createWindow() {
    const isMac = process.platform === 'darwin';
    const isWindows = process.platform === 'win32';

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
      // In development, load the Vite dev server URL
      mainWindow.loadURL('http://localhost:5173');
    } else {
      // In production, load the built index.html
      mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`[BlackHat UI Load Failure] Code: ${errorCode}, Description: ${errorDescription}, URL: ${validatedURL}`);
    });

    // DevTools shortcut (F12 or Cmd+Alt+I)
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i') || (input.meta && input.alt && input.key.toLowerCase() === 'i')) {
        mainWindow.webContents.toggleDevTools();
      }
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

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await startBackendServer();
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
