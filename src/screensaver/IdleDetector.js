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

    this.bindEvents();
    this.resetTimer();
  }

  bindEvents() {
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'pointermove'];
    
    this.handleUserActivity = () => {
      if (!this.enabled) return;

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
