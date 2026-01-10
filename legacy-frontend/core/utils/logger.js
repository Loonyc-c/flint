/**
 * Production-safe logger utility
 * Logs only in development mode, silent in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    // Always show warnings, even in production
    console.warn(...args);
  },

  error: (...args) => {
    // Always show errors, even in production
    console.error(...args);
  },

  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  table: (...args) => {
    if (isDevelopment) {
      console.table(...args);
    }
  },
};

export default logger;

