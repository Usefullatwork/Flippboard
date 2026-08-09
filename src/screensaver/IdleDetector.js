/**
 * IdleDetector - Automatic Desktop Screensaver Trigger Engine
 * Monitors user inactivity (mouse movement, keyboard, touch, scroll)
 * and automatically triggers Full-Screen Ambient Vestaboard Screensaver.
 */
export class IdleDetector {
  constructor(options = {}) {
    this.idleTimeoutSeconds = options.idleTimeoutSeconds || 60; // Default 60s
    this.onIdleStart = options.onIdleStart;
    this.onIdleEnd = options.onIdleEnd;
    this.enabled = options.enabled !== undefined ? options.enabled : true;

    this.timer = null;
    this.isIdle = false;
    this._graceUntil = 0;

    this.bindEvents();
    this.resetTimer();
  }

  bindEvents() {
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'pointermove'];

    this.handleUserActivity = () => {
      if (!this.enabled) return;
      // Entering fullscreen can synthesize a mousemove; ignore activity for a
      // short grace window after going idle so the screensaver isn't
      // instantly dismissed by its own entry
      if (this.isIdle && Date.now() < this._graceUntil) return;

      if (this.isIdle) {
        this.isIdle = false;
        if (this.onIdleEnd) this.onIdleEnd();
      }

      this.resetTimer();
    };

    activityEvents.forEach(eventType => {
      window.addEventListener(eventType, this.handleUserActivity, { passive: true });
    });
  }

  resetTimer() {
    if (this.timer) clearTimeout(this.timer);

    if (!this.enabled || this.idleTimeoutSeconds <= 0) return;

    this.timer = setTimeout(() => {
      this.isIdle = true;
      if (this.onIdleStart) this.onIdleStart();
    }, this.idleTimeoutSeconds * 1000);
  }

  /**
   * Marks the detector idle regardless of how the screensaver was entered
   * (auto-timeout or the manual kiosk button), so the next real user
   * activity exits it. All entry paths must route through this.
   */
  markIdle() {
    this.isIdle = true;
    this._graceUntil = Date.now() + 1500;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  markActive() {
    this.isIdle = false;
    this.resetTimer();
  }

  setIdleTimeout(seconds) {
    this.idleTimeoutSeconds = seconds;
    this.resetTimer();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled && this.isIdle) {
      this.isIdle = false;
      if (this.onIdleEnd) this.onIdleEnd();
    }
    this.resetTimer();
  }
}
