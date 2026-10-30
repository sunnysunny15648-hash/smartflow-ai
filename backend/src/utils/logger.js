export const logger = {
  info: (msg, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, Object.keys(meta).length ? meta : '');
  },
  warn: (msg, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, Object.keys(meta).length ? meta : '');
  },
  error: (msg, err = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err);
  },
  audit: (action, details = {}) => {
    console.log(`[AUDIT] ${new Date().toISOString()} - ${action}`, details);
  },
};

