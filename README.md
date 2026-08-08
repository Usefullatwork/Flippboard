# Flippboard Studio

![Flippboard Studio](https://raw.githubusercontent.com/MadsF/Flippboard/main/public/preview.png) *(Add a screenshot here)*

**Flippboard Studio** is a stunning, web-based mechanical split-flap messaging display and ambient screensaver. It mimics the beautiful aesthetic and satisfying "click-clack" sound of classic physical split-flap boards (like departure boards at retro train stations), but gives you total control to customize, automate, and display messages on any screen—from your desktop monitor to a giant smart TV.

## ✨ Features

- **Fluid 3D Split-Flap Engine**: Ultra-legible typography using premium fonts with accurate 3D rotation and drop-shadows.
- **Customizable Layouts**: Supports standard (6x22), compact (4x15), widescreen (8x30), and giant wall (10x40) matrices.
- **Responsive & Immersive**: Dynamically scales to fit any display. Toggle the "Fill Viewport" or enter "Fullscreen" for a true kiosk/screensaver mode.
- **Playback Modes**: 
  - **Sequential / Random**: Cycle through your quote library.
  - **Daily Quote**: Deterministic "Quote of the Day" that changes at midnight.
  - **Live Flip Clock**: Real-time accurate clock layout.
- **Web Audio Sound Effects**: Synthesized mechanical click-clack sounds for realistic immersion.
- **Quote Library Manager**: Save, edit, and organize custom quotes using a visual block editor with color tile support.
- **Ambient Room Themes**: Change the digital wall backdrop and the physical frame material (Obsidian, Walnut, Brushed Aluminum, Neon).
- **Local Webhook Support**: Push priority alerts instantly to your board from Home Assistant, curl, or iOS Shortcuts.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
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
   This will start both the Vite frontend server and the local Express webhook server. Open your browser and navigate to `http://localhost:5000` (or whichever port Vite gives you).

### Building for Production

To create a static production build:
```bash
npm run build
```
The optimized files will be generated in the `dist` directory, ready to be hosted on any static file server (Vercel, Netlify, GitHub Pages, etc.).

## 🔌 Using the Local Webhook Receiver

Flippboard Studio runs a local server alongside the frontend, allowing you to push messages to the board from other devices on your network (like a smart home hub).

**Send a message via `curl`:**
```bash
curl -X POST http://localhost:5000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello from the terminal!"}'
```
*Note: Make sure your `server.js` backend is running for webhooks to work.*

## 🎨 Technology Stack

- **Frontend**: HTML5, Vanilla CSS (Fluid Container Queries, 3D Transforms), Vanilla JavaScript (ES Modules).
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Backend / Webhooks**: Node.js + Express (Server-Sent Events)

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check out the [issues page](https://github.com/yourusername/Flippboard/issues).

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
