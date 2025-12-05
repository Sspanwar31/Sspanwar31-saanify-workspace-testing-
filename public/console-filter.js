/**
 * Console Filter Initialization Script
 * Add this script to your page to filter out unwanted console logs
 */

(function() {
  'use strict';

  // Only run in browser environment
  if (typeof window === 'undefined') return;

  // Store original console methods
  const originalConsole = {
    log: window.console.log,
    warn: window.console.warn,
    error: window.console.error,
    info: window.console.info,
    debug: window.console.debug,
    table: window.console.table
  };

  // Configuration
  const config = {
    enabled: true,
    showFilteredLogs: false, // Set to true to see what's being filtered
    filters: [
      'mcp data',
      'metadata: {…}',
      '{metadata: {…}}',
      'CbxGpD3N.js',
      'chrome-extension',
      'moz-extension',
      'extension'
    ]
  };

  /**
   * Check if a log should be filtered
   */
  function shouldFilter(message) {
    if (!config.enabled) return false;

    return config.filters.some(filter => {
      try {
        return message.toLowerCase().includes(filter.toLowerCase());
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Get message from arguments
   */
  function getMessage(args) {
    return args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    }).join(' ');
  }

  /**
   * Create filtered console methods
   */
  function createFilteredConsole() {
    return {
      log: function(...args) {
        const message = getMessage(args);
        if (shouldFilter(message)) {
          if (config.showFilteredLogs) {
            originalConsole.log('🔒 FILTERED:', ...args);
          }
          return;
        }
        return originalConsole.log.apply(window.console, args);
      },

      warn: function(...args) {
        const message = getMessage(args);
        if (shouldFilter(message)) {
          if (config.showFilteredLogs) {
            originalConsole.log('🔒 FILTERED WARN:', ...args);
          }
          return;
        }
        return originalConsole.warn.apply(window.console, args);
      },

      error: function(...args) {
        const message = getMessage(args);
        if (shouldFilter(message)) {
          if (config.showFilteredLogs) {
            originalConsole.log('🔒 FILTERED ERROR:', ...args);
          }
          return;
        }
        return originalConsole.error.apply(window.console, args);
      },

      info: function(...args) {
        const message = getMessage(args);
        if (shouldFilter(message)) {
          if (config.showFilteredLogs) {
            originalConsole.log('🔒 FILTERED INFO:', ...args);
          }
          return;
        }
        return originalConsole.info.apply(window.console, args);
      },

      debug: function(...args) {
        const message = getMessage(args);
        if (shouldFilter(message)) {
          if (config.showFilteredLogs) {
            originalConsole.log('🔒 FILTERED DEBUG:', ...args);
          }
          return;
        }
        return originalConsole.debug.apply(window.console, args);
      },

      table: function(...args) {
        const message = getMessage(args);
        if (shouldFilter(message)) {
          if (config.showFilteredLogs) {
            originalConsole.log('🔒 FILTERED TABLE:', ...args);
          }
          return;
        }
        return originalConsole.table.apply(window.console, args);
      }
    };
  }

  /**
   * Initialize console filtering
   */
  function initConsoleFilter() {
    // Apply filtered console methods
    Object.assign(window.console, createFilteredConsole());

    // Add global methods for managing the filter
    window.consoleFilter = {
      enable: () => {
        config.enabled = true;
        Object.assign(window.console, createFilteredConsole());
      },
      disable: () => {
        config.enabled = false;
        Object.assign(window.console, originalConsole);
      },
      toggle: () => {
        config.enabled = !config.enabled;
        if (config.enabled) {
          Object.assign(window.console, createFilteredConsole());
        } else {
          Object.assign(window.console, originalConsole);
        }
      },
      addFilter: (filter) => {
        config.filters.push(filter);
      },
      removeFilter: (index) => {
        config.filters.splice(index, 1);
      },
      getFilters: () => [...config.filters],
      showFiltered: (show) => {
        config.showFilteredLogs = show;
      },
      isEnabled: () => config.enabled
    };

    // Log initialization
    originalConsole.log('🔧 Console Filter initialized - MCP data and extension logs will be filtered');
    originalConsole.log('💡 Use window.consoleFilter.toggle() to enable/disable filtering');
  }

  // Initialize immediately
  initConsoleFilter();

})();