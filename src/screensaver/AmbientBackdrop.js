/**
 * AmbientBackdrop - Wall Environment & Ambient Lighting Manager
 * Renders realistic wall textures, room lighting, and halo glows behind the board.
 */
export class AmbientBackdrop {
  constructor(containerElement) {
    this.container = containerElement;
    this.currentTheme = 'dark-studio';
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    document.body.classList.remove(
      'backdrop-dark-studio',
      'backdrop-warm-living-room',
      'backdrop-modern-gallery',
      'backdrop-neon-cyberpunk',
      'backdrop-pitch-black'
    );
    document.body.classList.add(`backdrop-${themeName}`);
  }
}
