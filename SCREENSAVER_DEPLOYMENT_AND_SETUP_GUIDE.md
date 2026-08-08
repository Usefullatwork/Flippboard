# Vestaboard Desktop Screensaver & Ambient Display Setup Guide

Transform any computer, monitor, tablet, or smart TV into a physical split-flap **Vestaboard Screensaver**.

---

## 🖥️ How to Run on Any Screen or TV

### Method 1: Web-Based Auto Screensaver (Zero Installation)
1. Open the running app at `http://localhost:3000` (or host it on a local web server / Raspberry Pi).
2. Go to **Settings** (`⚙️`) and configure your **Auto-Launch Timeout** (e.g. 60 seconds).
3. Select your preferred **Wall Backdrop & Room Lighting** (Dark Studio, Warm Lamp, Gallery Slate, Neon Glow, or Pitch Black).
4. Leave the browser tab open. Whenever you stop moving your mouse/keyboard, Vestaboard automatically enters full-screen ambient screensaver mode!
5. Move your mouse or press `Esc` to return to desktop/controls.

---

### Method 2: Windows System Screensaver (.scr Native Integration)
To set this up as a true native Windows screensaver (triggers when PC is locked or idle):

1. **Option A: WebScreenSaver Wrapper**
   - Download the free open-source **WebScreenSaver** utility (or **HTML Screensaver** for Windows).
   - Point the Screensaver URL to `http://localhost:3000` (or `file:///C:/Users/MadsF/Desktop/Flippboard/dist/index.html`).
   - Right-click `.scr` file -> **Install** -> Select as your default Windows screensaver!

2. **Option B: Standalone Electron Executable App**
   - Run `npx electron-builder` to package into a standalone single-file `.exe` desktop executable.

---

### Method 3: Smart TV & Ambient Wall Monitor Setup
1. Copy the contents of the `dist/` folder to any home NAS, Raspberry Pi, or local web server.
2. Open the URL in your Smart TV browser or Firestick / Apple TV browser.
3. Press **Launch Screensaver** (`F11` for full-screen).
4. Select **Flip Clock** or **Daily Quote** mode for ambient 24/7 display!

---

## 🎨 Customizable Features Summary
- **5 Wall Lighting Environments**: Dark Studio, Warm Lamp, Gallery Slate, Neon Glow, OLED Black.
- **4 Frame Finishes**: Obsidian Black, Walnut Wood, Brushed Aluminum, Neon Cyberpunk.
- **Mechanical Sound Synthesizer**: Click-clack sound enabled with volume controls.
- **Quote Ingestion & Composer**: Custom message builder with 7 signature color accent tiles (`{red}`, `{yellow}`, `{blue}`, etc.).
