import { app, BrowserWindow, dialog } from 'electron';
import electronUpdater from 'electron-updater'; // CJS package — no named ESM exports
import { startServer } from '../server.js';

const PORT = 5000; // client SSE hardcodes :5000 — no fallback port possible

app.whenReady().then(() => {
  const server = startServer(PORT);

  server.on('error', (err) => {
    dialog.showErrorBox('Flippboard',
      err.code === 'EADDRINUSE'
        ? `Port ${PORT} is already in use. Close the other Flippboard (or server on ${PORT}) and try again.`
        : `Server failed to start: ${err.message}`);
    app.quit();
  });

  server.on('listening', () => {
    const win = new BrowserWindow({ fullscreen: true, autoHideMenuBar: true });
    win.loadURL(`http://localhost:${PORT}`);

    // Auto-update from GitHub Releases; downloads in background, installs on
    // quit. Must never take the app down — offline/rate-limited is normal.
    if (app.isPackaged) {
      electronUpdater.autoUpdater.checkForUpdatesAndNotify().catch((err) => {
        console.log('Update check failed (offline?):', err.message);
      });
    }
  });
});

// Server dies with the process — no explicit close (would hang on open SSE sockets)
app.on('window-all-closed', () => app.quit());
