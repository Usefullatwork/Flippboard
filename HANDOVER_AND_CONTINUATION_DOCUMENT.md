# Flippboard Studio — Comprehensive Handover & Project Continuation Document

**Project Path:** `c:\Users\MadsF\Desktop\Flippboard`  
**Current Tech Stack:** Vite 5, ES Modules, HTML5, Vanilla CSS3 (Fluid Container Queries & 3D Perspective), Web Audio API, LocalStorage.  
**Live Server Endpoint:** `http://localhost:5000`

---

## 📋 Executive Project Context & Summary

**Flippboard Studio** is a split-flap mechanical messaging display and ambient screensaver application. It allows users to display curated quote playlists, daily quotes of the day, live flip clock time, and custom compositions on any screen, desktop monitor, tablet, or Smart TV.

### Key Features Built to Date:
1. **Fluid 3D Split-Flap Engine** (`src/components/Board.js`, `src/styles/vestaboard.css`):
   - Standard 6 rows × 22 columns matrix (132 flaps total).
   - High-contrast, ultra-legible typography using Google Fonts (**Outfit Bold**, **Inter Ultra**, **Space Grotesk**, **Roboto Mono**).
   - 7 signature Vestaboard color tiles (`{red}`, `{orange}`, `{yellow}`, `{green}`, `{blue}`, `{violet}`, `{white}`, `{black}`).
   - Fluid responsive percentage sizing with container queries (`container-type: inline-size`).

2. **Web Audio Sound Synthesizer** (`src/audio/FlapAudioEngine.js`):
   - Procedurally synthesizes plastic flap clacks and mechanical solenoid thuds with micro-pitch randomization per flap.

3. **Display Modes & Scheduling** (`src/core/FlippboardEngine.js`, `src/components/Controls.js`):
   - **Sequential Mode**: Cycles through quote playlists in order.
   - **Random Mode**: Shuffles quotes automatically on custom timer intervals (5s to 300s).
   - **Daily Quote Mode**: Uses calendar date hashing (`YYYY-MM-DD`) for deterministic daily quote displays.
   - **Flip Clock Mode**: Live mechanical time & date display.
   - **Quick Message**: Instant live board text entry.

4. **Quote Management & Composer Suite** (`src/components/QuoteManager.js`):
   - Curated collections (*Inspirational*, *Tech*, *Family*, *Focus*, *Humor*, *Color Flags*).
   - Saved custom messages in LocalStorage with inline Edit (`✏️`) and Delete (`🗑️`).
   - 6×22 mini-grid preview, color tile picker, and JSON export/import.
   - Shareable URL Hash (`http://localhost:5000/#msg=YOUR%20MESSAGE`).

5. **Desktop Screensaver & Ambient Backdrops** (`src/screensaver/IdleDetector.js`, `src/screensaver/AmbientBackdrop.js`):
   - Automatic inactivity detector (15s to 10m idle timeout).
   - 5 Wall Backdrops: *Dark Studio*, *Warm Lamp*, *Gallery Slate*, *Neon Glow*, *OLED Pitch-Black*.
   - 4 Frame Finishes: *Obsidian Black*, *Walnut Wood*, *Brushed Aluminum*, *Neon Cyberpunk*.

---

## 🛠️ Complete Codebase Architecture & File Index

```text
c:\Users\MadsF\Desktop\Flippboard\
├── index.html                           # App shell, modal markup, Google Font imports
├── package.json                         # Vite project config & scripts
├── src/
│   ├── main.js                          # Main application controller & state orchestrator
│   ├── core/
│   │   └── FlippboardEngine.js          # Matrix layout, auto-centering, word wrapping, clock & daily quote engines
│   ├── audio/
│   │   └── FlapAudioEngine.js           # Procedural Web Audio mechanical clack synthesizer
│   ├── components/
│   │   ├── Board.js                     # 6x22 split-flap DOM renderer & flip animation manager
│   │   ├── Controls.js                  # Mode selector, playback timer, quick input, kiosk controls
│   │   ├── QuoteManager.js              # Quote library modal, composer form, mini-grid preview, JSON import/export
│   │   └── SettingsModal.js             # Typography selector, backdrop themes, frame finishes, sound controls
│   ├── screensaver/
│   │   ├── IdleDetector.js              # User activity detector for automatic screensaver mode
│   │   └── AmbientBackdrop.js           # Room lighting & wall backdrop manager
│   └── styles/
│       └── vestaboard.css               # Design tokens, fluid responsive CSS grid, 3D flap flip animations
└── vestaboard_core.py                   # Python standalone core reference script (CLI & REST API driver)
```

---

## 🎯 Next Phase Objectives & User Feedback

1. **Board Size & Expansion ("Board is not big enough")**:
   - Add a **Display Scale & Board Zoom Slider** (e.g. 100% to 250% matrix scaling) in Settings to fill ultra-wide 4K/8K wall screens.
   - Add **Custom Matrix Dimensions Support**: Options to select matrix grid size:
     - Standard (6 rows × 22 columns = 132 flaps)
     - Compact (4 rows × 15 columns = 60 flaps)
     - Large Widescreen (8 rows × 30 columns = 240 flaps)
     - Giant Wall Display (10 rows × 40 columns = 400 flaps)
   - Add **Fill Viewport Mode**: Automatically expands board width to occupy 95% of browser viewport width.

2. **Advanced Content Integrations**:
   - Live Weather RSS Feed module.
   - Live News Ticker & Crypto/Stock price flip updates.
   - Local Network Webhook Receiver to accept incoming messages from phone or home automation (Home Assistant).

---

## 🚀 Ready-to-Copy Carryover Prompt

Copy and paste the prompt below into your next chat session to resume development immediately with full context:

```markdown
### 📌 CARRYOVER PROMPT — FLIPPBOARD STUDIO CONTINUATION

We are building **Flippboard Studio** in `c:\Users\MadsF\Desktop\Flippboard` — a split-flap mechanical messaging display and ambient desktop screensaver.

#### Current Codebase Architecture:
- Tech Stack: Vite 5, ES Modules, Vanilla CSS3 (3D split-flap perspective), Web Audio API.
- Core Files: `index.html`, `src/main.js`, `src/core/FlippboardEngine.js`, `src/components/Board.js`, `src/components/Controls.js`, `src/components/QuoteManager.js`, `src/components/SettingsModal.js`, `src/styles/vestaboard.css`.
- Running on: Dedicated server at `http://localhost:5000`.

#### Priority Goal for this Session:
Make the Flippboard significantly bigger and customizable for large displays:
1. Add a **Board Scale / Matrix Zoom Slider** in Settings (100% to 250% size multiplier).
2. Add a **Viewport Fill Toggle** to expand the board to fill 95% of large screen widths.
3. Add **Custom Matrix Size Presets**: Standard (6x22), Compact (4x15), Widescreen (8x30), and Giant Wall (10x40).
4. Update the matrix layout and word-wrapping algorithms in `FlippboardEngine.js` to dynamically format text for whichever matrix size is selected!

Let's inspect the files and implement these board sizing & scaling enhancements step-by-step!
```
