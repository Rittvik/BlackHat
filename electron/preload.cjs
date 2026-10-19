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
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  createNewWindow: (workspacePath) => ipcRenderer.invoke('create-new-window', workspacePath),
  onOpenProjectFolder: (callback) => {
    const handler = (_, folderPath) => callback(folderPath);
    ipcRenderer.on('open-project-folder', handler);
    return () => ipcRenderer.removeListener('open-project-folder', handler);
  },
  onWorkspaceInit: (callback) => {
    const handler = (_, folderPath) => callback(folderPath);
    ipcRenderer.on('workspace-init', handler);
    return () => ipcRenderer.removeListener('workspace-init', handler);
  },
  onMenuCommand: (callback) => {
    const handler = (_, cmd) => callback(cmd);
    ipcRenderer.on('menu-command', handler);
    return () => ipcRenderer.removeListener('menu-command', handler);
  }
});
