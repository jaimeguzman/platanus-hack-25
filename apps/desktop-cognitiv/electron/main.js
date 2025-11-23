import { app, BrowserWindow, Menu, globalShortcut, Tray, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let tray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    titleBarStyle: 'hiddenInset',
    resizable: true,
    minimizable: true,
    maximizable: true,
    show: false,
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, '../public/icon.png')
  });

  if (isDev) {
    const tryPorts = async () => {
      const ports = [5173, 5174, 5175, 5176];
      const http = await import('http');
      for (const port of ports) {
        const ok = await new Promise((resolve) => {
          const req = http.request({
            hostname: 'localhost',
            port,
            method: 'HEAD',
            timeout: 800
          }, (res) => {
            resolve(res.statusCode === 200);
          });
          req.on('error', () => resolve(false));
          req.on('timeout', () => { req.destroy(); resolve(false); });
          req.end();
        });
        if (ok) {
          mainWindow.loadURL(`http://localhost:${port}`);
          mainWindow.webContents.openDevTools();
          return;
        }
      }
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools();
    };
    tryPorts();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createTray() {
  const trayIconPath = path.join(__dirname, '../public/tray-icon.png');
  tray = new Tray(trayIconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Mostrar Cognitiv',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Ocultar Cognitiv',
      click: () => {
        if (mainWindow) {
          mainWindow.hide();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Cognitiv - Segundo Cerebro Digital');

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function createMenu() {
  const template = [
    {
      label: 'Cognitiv',
      submenu: [
        {
          label: 'Acerca de Cognitiv',
          click: () => {
            shell.openExternal('https://github.com/platanus-hack/cognitiv');
          }
        },
        { type: 'separator' },
        {
          label: 'Ocultar Cognitiv',
          accelerator: 'Command+H',
          click: () => {
            if (mainWindow) mainWindow.hide();
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectall', label: 'Seleccionar Todo' }
      ]
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload', label: 'Recargar' },
        { role: 'forceReload', label: 'Forzar Recarga' },
        { role: 'toggleDevTools', label: 'Herramientas de Desarrollo' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Normal' },
        { role: 'zoomIn', label: 'Acercar' },
        { role: 'zoomOut', label: 'Alejar' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Pantalla Completa' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'close', label: 'Cerrar' },
        { type: 'separator' },
        { role: 'front', label: 'Traer al Frente' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setupGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

function setupIpcHandlers() {
  ipcMain.handle('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.handle('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.handle('close-window', () => {
    if (mainWindow) mainWindow.close();
  });

  ipcMain.handle('set-auto-launch', (event, enabled) => {
    app.setLoginItemSettings({
      openAtLogin: !!enabled,
      openAsHidden: false,
      args: []
    });
    return !!enabled;
  });

  ipcMain.handle('get-auto-launch', () => {
    const settings = app.getLoginItemSettings();
    return !!settings.openAtLogin;
  });

  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}

app.whenReady().then(() => {
  createWindow();
  // createTray(); // Comentado - System tray deshabilitado
  createMenu();
  setupGlobalShortcuts();
  setupIpcHandlers();

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

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
