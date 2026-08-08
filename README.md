# Flippboard Studio 🎞️

> A 3D mechanical split-flap display software & ambient desktop screensaver. Inspired by classic retro train station departure boards, Vestaboard, and airport messaging matrixes.

[![Vite Build](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![JavaScript](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=flat-square&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/CSS3-3D_Transforms_&_Container_Queries-1572B6?style=flat-square&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)

---

## ✨ Features

- ⚙️ **Pure CSS 3D Mechanical Engine**: Physics-based split-flap leaves using `rotateX(-180deg)` 3D transforms, container queries (`cqw`), mechanical hinge pins, and light reflections.
- 📐 **Multiple Matrix Presets**:
  - **Standard**: 6 rows × 22 columns (132 flaps)
  - **Compact**: 4 rows × 15 columns (60 flaps)
  - **Widescreen**: 8 rows × 30 columns (240 flaps)
  - **Giant Wall**: 10 rows × 40 columns (400 flaps)
- ⏱️ **4 Playback Modes**:
  - **Sequential / Random**: Cycle through curated or custom quote collections.
  - **Daily Quote**: Deterministic "Quote of the Day" powered by date hashing.
  - **Live Flip Clock**: Real-time 1-second precision split-flap clock.
- 🎨 **Visual Quote Composer & Color Tiles**:
  - Insert vibrant accent tiles (`{red}`, `{orange}`, `{yellow}`, `{green}`, `{blue}`, `{violet}`, `{white}`, `{black}`).
  - Dynamic mini-board preview grid syncing with current matrix size.
- 🔊 **Procedural Web Audio Synthesizer**: Organic multi-layer plastic slap, mid-range body resonance, and low-frequency solenoid thud with pitch/volume jitter per click.
- 🖥️ **Desktop Screensaver & Kiosk Mode**: Fullscreen API support with mouse move & Esc key exit triggers.
- 🏠 **Local Network Webhook Integration**: Push immediate priority alerts via HTTP POST JSON requests from Home Assistant, Node-RED, `curl`, or iOS Shortcuts.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v16.0 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/Flippboard.git
   cd Flippboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```
   *Runs Vite frontend at `http://localhost:5173`.*

4. **Start the local Webhook Server (Optional for network notifications):**
   ```bash
   npm run server
   ```
   *Runs Express backend at `http://localhost:5000`.*

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

---

## 🏗️ Building for Production

To create an optimized production bundle:
```bash
npm run build
```
Output files will be generated in the `dist/` directory, ready to be deployed to Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

---

## 🎹 Keyboard & Mouse Shortcuts

- **Esc**: Exit Screensaver / Fullscreen mode
- **Enter**: Send Quick Message (in control dock input)
- **Click**: Unlock Web Audio context & interact with control dock buttons

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

