const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  revealInFinder: (filePath) => ipcRenderer.send('reveal-in-finder', filePath),
  clearAppCache: () => ipcRenderer.invoke('clear-app-cache'),
  onMenuCommand: (callback) => {
    const handler = (_, cmd) => callback(cmd);
    ipcRenderer.on('menu-command', handler);
    return () => ipcRenderer.removeListener('menu-command', handler);
  }
});
