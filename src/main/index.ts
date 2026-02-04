import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { writeFileSync } from 'fs';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { initStorage, getData, saveParticipants, saveArchive, saveSessionsHistory, saveSessionTemplates, saveSettings, saveDateMarkers } from './storage';

let mainWindow: BrowserWindow | null = null;

// Chemin de l'icône selon l'environnement
function getIconPath(): string {
  if (is.dev) {
    return join(__dirname, '../../resources/icon.ico');
  }
  return join(process.resourcesPath, 'resources/icon.ico');
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: getIconPath(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
  });

  // Charge le renderer
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Initialisation de l'app
app.whenReady().then(() => {
  // Initialise le stockage
  initStorage();

  // Défini l'app ID pour Windows
  electronApp.setAppUserModelId('com.crunchthenumbers.app');

  // Optimisations par défaut
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Handlers IPC
  ipcMain.handle('get-data', () => {
    return getData();
  });

  ipcMain.handle('save-participants', (_, participants) => {
    saveParticipants(participants);
    return true;
  });

  ipcMain.handle('save-archive', (_, archive) => {
    saveArchive(archive);
    return true;
  });

  ipcMain.handle('save-sessions-history', (_, history) => {
    saveSessionsHistory(history);
    return true;
  });

  ipcMain.handle('save-session-templates', (_, templates) => {
    saveSessionTemplates(templates);
    return true;
  });

  ipcMain.handle('save-settings', (_, settings) => {
    saveSettings(settings);
    return true;
  });

  ipcMain.handle('save-date-markers', (_, markers) => {
    saveDateMarkers(markers);
    return true;
  });

  ipcMain.handle('show-save-dialog', async (_, options) => {
    if (!mainWindow) return { canceled: true };
    return dialog.showSaveDialog(mainWindow, options);
  });

  ipcMain.handle('save-file', (_, filePath: string, content: string | Uint8Array, encoding: 'utf-8' | 'binary') => {
    try {
      if (encoding === 'binary') {
        writeFileSync(filePath, Buffer.from(content as Uint8Array));
      } else {
        writeFileSync(filePath, content as string, 'utf-8');
      }
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
