const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Определяем путь к файлу настроек в папке данных пользователя
const settingsPath = path.join(app.getPath('userData'), 'settings.json');
console.log('Settings path:', settingsPath);

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        show: false, // Скрываем окно до полной загрузки
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    win.loadFile('app.html');
    win.setMenu(null);

    // Показываем и максимизируем окно, когда оно готово
    win.once('ready-to-show', () => {
        win.maximize();
        win.show();
        win.focus();
    });
}

app.whenReady().then(() => {
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

// --- Обработчики IPC ---

// Загрузка начальных данных
ipcMain.handle('load-initial-data', async () => {
    try {
        console.log('Loading settings from:', settingsPath);
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            console.log('Settings loaded:', data);
            return JSON.parse(data);
        } else {
            console.log('Settings file does not exist');
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    return null;
});

// Сохранение настроек
ipcMain.handle('save-settings', async (event, settings) => {
    try {
        console.log('Saving settings to:', settingsPath);
        console.log('Settings data:', JSON.stringify(settings, null, 2));
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('Settings saved successfully');
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
});

// Сохранение промптов
ipcMain.handle('save-prompts', async (event, prompts) => {
    try {
        // Предполагаем, что промпты являются частью основных настроек
        const settingsData = fs.readFileSync(settingsPath, 'utf-8');
        const settings = settingsData ? JSON.parse(settingsData) : {};
        settings.prompts = prompts;
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Failed to save prompts:', error);
    }
});


// Получение списка моделей
ipcMain.handle('get-models', async () => {
    return new Promise((resolve, reject) => {
        exec('ollama list', (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return reject(error);
            }
            if (stderr && !stderr.includes("warning: failed to get console mode")) {
                console.error(`stderr: ${stderr}`);
            }
            const lines = stdout.trim().split('\n');
            if (lines.length < 2) {
                return resolve([]);
            }
            const models = lines.slice(1).map(line => {
                const parts = line.split(/\s+/);
                return { name: parts[0] };
            });
            resolve(models);
        });
    });
});

// Загрузка модели
ipcMain.handle('download-model', async (event, modelName) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    return new Promise((resolve) => {
        const command = `ollama pull ${modelName}`;
        console.log(`Executing: ${command}`);
        const process = exec(command);

        process.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
            win.webContents.send('download-progress', data.toString());
        });

        process.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            win.webContents.send('download-progress', data.toString());
        });

        process.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
            if (code === 0) {
                resolve({ success: true });
            } else {
                resolve({ success: false, error: `Process exited with code ${code}` });
            }
        });
    });
});

// Удаление модели
ipcMain.handle('delete-model', async (event, modelName) => {
    return new Promise((resolve) => {
        const command = `ollama rm "${modelName}"`;
        console.log(`Executing: ${command}`);
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                resolve({ success: false, error: stderr || error.message });
                return;
            }
            console.log(`stdout: ${stdout}`);
            resolve({ success: true });
        });
    });
});

// Другие обработчики, которые могут понадобиться вашему приложению
ipcMain.handle('clear-history', async () => {
    // Логика для очистки истории, если она хранится на стороне main процесса
    return { success: true };
});

ipcMain.handle('save-api-key', async (event, key) => {
    // Логика для сохранения ключа API
    console.log('API Key saved (placeholder):', key);
    return { success: true };
});

ipcMain.handle('load-api-key', async () => {
    // Логика для загрузки ключа API
    console.log('API Key loaded (placeholder)');
    return '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'; // Возвращаем ключ, который вы предоставили
});

ipcMain.handle('search-internet', async (event, query) => {
    // Логика для поиска в интернете
    console.log('Searching internet (placeholder):', query);
    return { results: `Search results for "${query}"` };
});
