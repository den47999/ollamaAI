// preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('[Preload] Script starting execution.');

try {
    if (process.contextIsolated) {
        contextBridge.exposeInMainWorld('electronAPI', {
            // Старые методы (без изменений)
            loadInitialData: () => ipcRenderer.invoke('load-initial-data'),
            saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
            savePrompts: (prompts) => ipcRenderer.invoke('save-prompts', prompts),
            clearHistory: () => ipcRenderer.invoke('clear-history'),
            sendMessage: (data) => ipcRenderer.send('send-message', data),
            onMessageChunk: (callback) => { const listener = (_event, chunk) => callback(chunk); ipcRenderer.on('message-chunk', listener); return () => ipcRenderer.removeListener('message-chunk', listener); },
            onMessageEnd: (callback) => { const listener = (_event, result) => callback(result); ipcRenderer.on('message-end', listener); return () => ipcRenderer.removeListener('message-end', listener); },
            onMessageError: (callback) => { const listener = (_event, error) => callback(error); ipcRenderer.on('message-error', listener); return () => ipcRenderer.removeListener('message-error', listener); },

            // Новые методы для поиска и управления ключом
            searchInternet: (query) => { console.log('[Preload] Invoking search-internet'); return ipcRenderer.invoke('search-internet', query); },
            saveApiKey: (key) => { console.log('[Preload] Invoking save-api-key'); return ipcRenderer.invoke('save-api-key', key); },
            loadApiKey: () => { console.log('[Preload] Invoking load-api-key'); return ipcRenderer.invoke('load-api-key'); },

            // Методы для управления моделями
            downloadModel: (modelName) => ipcRenderer.invoke('download-model', modelName),
            onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, progress) => callback(progress)),
            getModels: () => ipcRenderer.invoke('get-models'),
            deleteModel: (modelName) => ipcRenderer.invoke('delete-model', modelName)
        });
        console.log('[Preload] contextBridge.exposeInMainWorld executed successfully. electronAPI should be available.');
    } else {
        console.error('[Preload] Error: contextIsolation is not enabled! contextBridge cannot be used securely.');
    }
} catch (error) {
    console.error('[Preload] Error executing contextBridge.exposeInMainWorld:', error);
}

console.log('[Preload] Script finished execution.');