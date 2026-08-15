import { app, BrowserWindow, dialog } from 'electron';
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
  });
});

// Server dies with the process — no explicit close (would hang on open SSE sockets)
app.on('window-all-closed', () => app.quit());
