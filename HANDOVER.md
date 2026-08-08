# Flippboard Studio — Handover & Continuation Guide

> **Instructions for the Next Agent:**
> The user is opening a new session to reset the context window. Your primary goal is to **review the existing codebase, conduct a full bug test, and focus on design improvements and polish.** Do not attempt to add external API integrations (like live weather, crypto, or news) unless explicitly requested.

## Project Overview
**Flippboard Studio** is a web-based, 3D mechanical split-flap display and screensaver. It renders a beautiful, physics-based grid of mechanical flaps (like a retro train station board) and cycles through quotes, a live clock, or custom messages. 

It is designed to run in a browser and has a "Screensaver / Kiosk Mode" that uses the Fullscreen API to act as a desktop or smart TV display. It also includes a local Express server (`server.js`) to receive network webhooks.

## Architecture
- **Vanilla JS + Vite**: No React/Vue. Built with ES modules, raw HTML, and highly optimized vanilla CSS.
- **CSS 3D Engine (`vestaboard.css`)**: The split-flap animation uses CSS 3D transforms (`rotateX(-180deg)`), `aspect-ratio: 42/60`, and `container-type: inline-size` for fluid typography.
- **Core Engine (`FlippboardEngine.js`)**: Handles text tokenization, inserting color tiles (e.g., `{red}`), and wrapping text to fit the dynamic matrix sizes (6x22, 4x15, 8x30, 10x40).
- **Component Controllers**:
  - `Board.js`: Renders the DOM grid and manages the staggered cascading flip animations.
  - `main.js`: The central orchestrator, managing the timer loop, idle detection, and event listeners.
  - `QuoteManager.js`: A visual editor for composing custom messages and saving them to `localStorage`.

## Current State & Recently Solved Issues
The core mechanics are fully functional, but the project recently went through intense CSS layout debugging:
1. **Responsive Scaling**: The board now dynamically scales to perfectly fill 95% of the viewport width or height in Kiosk Mode, utilizing a pre-computed `--board-aspect-ratio` to prevent CSS parsing bugs in strict browsers.
2. **Typography Alignment**: The letters on the split-flaps were previously clipping. This was fixed by using a robust `transform: translateY(-50%)` anchor on the lower flaps instead of `top: -100%`, ensuring perfect alignment across the physical hinge.
3. **Dynamic Font Sizing**: The font size inside the flaps uses `cqw` and divides by `--board-cols` to ensure the text perfectly fills the tile regardless of whether the user is on a 22-column or 40-column matrix.

## Goals for the Next Session
1. **Code Review & Bug Sweep**: Conduct a full audit of `Board.js` and `main.js` to identify race conditions in the flip animation or state mismatches when switching modes (e.g., from Clock to Daily Quote).
2. **Design Polish**: Elevate the UI/UX of the bottom control dock and modal windows. Ensure the layout feels premium, sleek, and high-end.
3. **Animation Physics**: Refine the flip timings, staggering delays, and audio synchronization to make the mechanical "click-clack" feel as realistic and satisfying as possible.
4. **GitHub Prep**: Ensure the code is clean, linted, and completely ready to be published as a polished open-source repository.

> **To the Next Agent:** Start by reviewing `index.html`, `vestaboard.css`, and `Board.js`. Ask the user if they've spotted any specific visual glitches or if they want to prioritize the UI design or the animation physics first.
