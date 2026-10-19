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
  },
  native: {
    listFiles: (workspace) => ipcRenderer.invoke('native:list-files', workspace),
    readFile: (filePath, workspace) => ipcRenderer.invoke('native:read-file', filePath, workspace),
    writeFile: (filePath, content, workspace) => ipcRenderer.invoke('native:write-file', filePath, content, workspace),
    createFile: (filePath, isDirectory, content, workspace) => ipcRenderer.invoke('native:create-file', filePath, isDirectory, content, workspace),
    deleteFile: (filePath, workspace) => ipcRenderer.invoke('native:delete-file', filePath, workspace),
    renameFile: (oldPath, newPath, workspace) => ipcRenderer.invoke('native:rename-file', oldPath, newPath, workspace),
    duplicateFile: (filePath, workspace) => ipcRenderer.invoke('native:duplicate-file', filePath, workspace),
    gitStatus: (workspace) => ipcRenderer.invoke('native:git-status', workspace),
    gitCommit: (message, workspace) => ipcRenderer.invoke('native:git-commit', message, workspace),
    gitDiff: (filePath, workspace) => ipcRenderer.invoke('native:git-diff', filePath, workspace),
    search: (query, caseSensitive, isRegex, workspace) => ipcRenderer.invoke('native:search', query, caseSensitive, isRegex, workspace),
    runTerminal: (command, cwd) => ipcRenderer.invoke('native:run-terminal', command, cwd),
    createProject: (projectPath, projectName, template) => ipcRenderer.invoke('native:create-project', projectPath, projectName, template),
    validateProject: (path) => ipcRenderer.invoke('native:validate-project', path),
    workspaceInfo: (workspace) => ipcRenderer.invoke('native:workspace-info', workspace)
  }
});
