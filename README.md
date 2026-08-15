# Flippboard Studio 🎞️

> A 3D mechanical split-flap display software & ambient desktop screensaver. Inspired by classic retro train station departure boards, Vestaboard, and airport messaging matrices.

[![Vite Build](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-3D_Transforms_&_Container_Queries-1572B6?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Download](https://img.shields.io/github/v/release/Usefullatwork/Flippboard?style=flat-square&label=Download&color=f4b41a)](https://github.com/Usefullatwork/Flippboard/releases/latest)
[![CI](https://github.com/Usefullatwork/Flippboard/actions/workflows/ci.yml/badge.svg)](https://github.com/Usefullatwork/Flippboard/actions/workflows/ci.yml)

![Flippboard split-flap animation](docs/media/flip.gif)

---

## 📥 Download & Install (Windows)

No Node.js, no terminal — grab a ready-to-run build from
**[Releases](https://github.com/Usefullatwork/Flippboard/releases/latest)**:

| File | What it does |
|------|--------------|
| `Flippboard Setup <version>.exe` | One-click installer. Double-click → installs → opens straight into the board fullscreen. Adds a desktop shortcut. |
| `Flippboard <version>.exe` | Portable — no install, just run it. |

First launch: Windows Defender may ask to allow network access — that's the
local webhook server (see below); allow it on private networks, or press
Cancel and everything except webhooks still works. Settings and custom
quotes persist in `%APPDATA%\Flippboard`.

![Flippboard Studio](docs/media/studio.png)

---

## ✨ Features

- ⚙️ **Pure CSS 3D Mechanical Engine**: Physics-based split-flap leaves using `rotateX(-180deg)` 3D transforms, container queries (`cqw`), mechanical hinge pins, and light reflections.
- 📐 **7 Matrix Presets**: Compact 4×15 · Standard 6×22 · Wide 6×30 · Tall 8×22 · Widescreen 8×30 · Giant Wall 10×40 · Mega Wall 12×48.
- ⏱️ **4 Playback Modes**:
  - **Sequential / Random**: Cycle through curated or custom quote collections.
  - **Daily Quote**: Deterministic "Quote of the Day" powered by date hashing.
  - **Live Flip Clock**: Real-time 1-second precision split-flap clock.
- 🎨 **Visual Quote Composer & Color Tiles**:
  - Insert vibrant accent tiles (`{red}`, `{orange}`, `{yellow}`, `{green}`, `{blue}`, `{violet}`, `{white}`, `{black}`).
  - Dynamic mini-board preview grid syncing with current matrix size.
- 🔊 **Procedural Web Audio Synthesizer**: Organic multi-layer plastic slap, mid-range body resonance, and low-frequency solenoid thud with pitch/volume jitter per click.
- 🖥️ **Desktop Screensaver & Kiosk Mode**: Auto-launches fullscreen after a configurable idle timeout (15s–10min, or manual-only); exits only on Esc or a click — hotkeys keep controlling playback without waking it.
- 🌌 **5 Ambient Wall Backdrops**: Dark Studio, Warm Living Room, Modern Gallery, Neon Cyberpunk, and OLED Pitch Black — plus 4 frame finishes (Obsidian, Walnut, Silver, Neon).
- 💾 **Persistent Settings**: Matrix size, zoom, fonts, themes, sound, and screensaver timing survive reloads via localStorage — set it once on your wall display.
- ✅ **Quote Validation**: The composer warns live when a message won't fit the board, uses characters that don't exist on the flap drum, or duplicates an existing quote — imports are checked too.
- 🏠 **Local Network Webhook Integration**: Push immediate priority alerts via HTTP POST JSON requests from Home Assistant, Node-RED, `curl`, or iOS Shortcuts.
- 🔗 **Shareable Message Links**: Open `http://localhost:5173/#msg=YOUR%20MESSAGE` to flip a message straight onto the board.

---

## ⚙️ Settings & Quote Manager

Everything lives in the two modals — flap font, matrix size (4×15 up to
12×48), zoom, backdrops, screensaver idle timer, and the webhook receiver
info in **Settings**; curated collections, your saved messages, and the
composer with live board preview + validation in **Quote Library**.

| Settings | Compose with live validation |
|----------|------------------------------|
| ![Settings modal](docs/media/settings.png) | ![Quote composer](docs/media/compose.png) |

Fullscreen screensaver / kiosk mode (auto-launches after idle, `F` to toggle):

![Kiosk mode](docs/media/kiosk.png)

---

## 🚀 Quick Start (from source)

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0 or higher — required by Express 5)
- npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Usefullatwork/Flippboard.git
   cd Flippboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run it (production, one command):**
   ```bash
   npm start
   ```
   *Builds the app and serves it with the webhook backend at `http://localhost:5000`.*

### Development

```bash
npm run dev      # Vite dev server with hot reload at http://localhost:5173
npm run server   # Express webhook/SSE backend at http://localhost:5000 (run alongside dev)
npm test         # Vitest suite: engine, board spinner, settings persistence
npm run electron # Build and open the desktop app (Electron)
npm run dist     # Build Windows installer + portable exe into release/
```

> `npm run server` alone serves whatever is in `dist/` — run `npm run build` first
> (or just use `npm start`, which always builds fresh).

---

## 🔌 Local Network Webhook Receiver

Flippboard Studio includes a lightweight Node.js Server-Sent Events (SSE) backend (`server.js`) that allows smart home systems or custom scripts to push live messages to the board.

**Send a message via `curl`:**
```bash
curl -X POST http://localhost:5000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "MEETING IN 5 MINUTES"}'
```

**Home Assistant REST Command:**
```yaml
rest_command:
  flippboard_alert:
    url: "http://YOUR_PC_IP:5000/api/webhook"
    method: POST
    payload: '{"text": "{{ message }}"}'
    content_type: 'application/json'
```

**Security notes (LAN posture):**
- The payload must be `{"text": "..."}` with 1–500 characters; anything else is rejected with `400`.
- The endpoint has no authentication by default and CORS is open — intended for trusted home networks only. To require a shared secret, start the server with `WEBHOOK_TOKEN=yoursecret` and send an `x-webhook-token` header with every request.
- The page connects to the SSE stream on port 5000 of *the host that served it* — webhooks only work when the page and the Express server run on the same machine.

---

## 🏗️ Building for Production

To create an optimized production bundle:
```bash
npm run build
```
Output files land in `dist/`. The board, quotes, clock, and screensaver are fully static and can be deployed to Vercel, Netlify, Cloudflare Pages, or GitHub Pages — **but the webhook/SSE integration requires the Node server**, so on static hosts that feature is disabled. For the full experience on a wall display, use `npm start` on a machine on your LAN.

### Releasing (auto-update)

The desktop app checks GitHub Releases on launch (electron-updater) and installs updates on quit. For that to work, every release **must** include the three files `npm run dist` writes to `release/`: `Flippboard Setup <version>.exe`, the matching `.blockmap`, and `latest.yml` — a release with only the exe breaks auto-update. Bump `version` in `package.json` first; the portable exe never auto-updates.

---

## 🎹 Keyboard & Mouse Shortcuts

| Key | Action |
|-----|--------|
| `D` / `N` / `→` | Next quote |
| `A` / `←` | Previous quote |
| `W` / `↑` | Jump to next category |
| `S` / `↓` / `Space` | Play / pause auto-flip |
| `F` | Toggle fullscreen screensaver / kiosk mode |
| `Esc` | Exit screensaver — in the desktop app, a second `Esc` closes the program |
| `Enter` | Send Quick Message (in control dock input) |
| Click | Unlock Web Audio context & interact with controls |

Hotkeys keep working **inside screensaver mode** — flip quotes, switch
category, or pause without waking it. Only `Esc` or a mouse click exits the
screensaver (mouse movement is ignored). Hotkeys are disabled while typing
in an input or while a modal is open.

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

