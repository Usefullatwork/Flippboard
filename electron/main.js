import { app, BrowserWindow, dialog } from 'electron';
import electronUpdater from 'electron-updater'; // CJS package — no named ESM exports
import { startServer, webApp } from '../server.js';

const PORT = 5000; // client SSE hardcodes :5000 — no fallback port possible

// Update state, exposed to the renderer over the local server (no preload/IPC
// needed — the Express app runs in this same process). Renderer triggers the
// check (so the on-launch toggle lives in its localStorage settings) and polls
// status; downloaded updates install on quit (electron-updater default).
const { autoUpdater } = electronUpdater;
const updateStatus = { current: app.getVersion(), state: 'idle', available: null, message: null };
autoUpdater.on('checking-for-update', () => { updateStatus.state = 'checking'; });
autoUpdater.on('update-available', (info) => { updateStatus.state = 'downloading'; updateStatus.available = info.version; });
autoUpdater.on('update-not-available', () => { updateStatus.state = 'up-to-date'; });
autoUpdater.on('update-downloaded', (info) => { updateStatus.state = 'ready'; updateStatus.available = info.version; });
autoUpdater.on('error', (err) => { updateStatus.state = 'error'; updateStatus.message = err.message; });

webApp.get('/api/update/status', (req, res) => res.json(updateStatus));
webApp.post('/api/update/check', (req, res) => {
  if (!app.isPackaged) {
    updateStatus.state = 'dev';
  } else {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {}); // errors surface via 'error' event
  }
  res.json(updateStatus);
});

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
    // Launch update check is triggered by the renderer (initUpdates in
    // src/main.js) so the user's on-launch toggle is respected.
  });
});

// Server dies with the process — no explicit close (would hang on open SSE sockets)
app.on('window-all-closed', () => app.quit());
