// Set enabled to false after the festival to remove the effect and replay control.
export const DIWALI_CONFIG = {
  enabled: true,
  // Local development: preview again after a full reload. Production stays once per session.
  previewOnReload: import.meta.env.DEV,
  durationMs: 5000,
  sessionKey: "praavi:diwali:played:v2",
};
