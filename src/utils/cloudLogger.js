/**
 * Google Cloud Logging Client (Browser-compatible mock wrapper)
 * In production, logs are sent to a secure Cloud Function endpoint
 * which forwards to Google Cloud Logging (Structured JSON Logs).
 * 
 * Severity levels follow GCP conventions: DEFAULT, DEBUG, INFO, WARNING, ERROR, CRITICAL
 */

const LOG_ENDPOINT = import.meta.env.VITE_LOG_ENDPOINT || null;
const IS_PRODUCTION = import.meta.env.PROD;

/**
 * Sends a structured log entry to Google Cloud Logging via a Cloud Function proxy.
 * Falls back to console in development mode.
 * @param {'INFO' | 'WARNING' | 'ERROR'} severity
 * @param {string} message
 * @param {object} labels - Metadata labels attached to the log
 */
export const cloudLog = async (severity, message, labels = {}) => {
  const logEntry = {
    severity,
    message,
    timestamp: new Date().toISOString(),
    labels: {
      service: 'election-ai-frontend',
      environment: IS_PRODUCTION ? 'production' : 'development',
      ...labels,
    },
  };

  if (!IS_PRODUCTION || !LOG_ENDPOINT) {
    // Development: log to console using GCP severity convention
    const consoleFn = severity === 'ERROR' ? console.error : severity === 'WARNING' ? console.warn : console.info;
    consoleFn(`[GCP-LOG][${severity}]`, logEntry);
    return;
  }

  // Production: send to secure Cloud Function proxy (avoids exposing GCP credentials)
  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry),
      signal: AbortSignal.timeout(3000), // Non-blocking: 3s max
    });
  } catch {
    // Silently fail — logging must never break the user experience
    console.warn('[CloudLog] Failed to send log to GCP, falling back silently.');
  }
};

// Convenience wrappers matching GCP severity levels
export const logInfo = (msg, labels) => cloudLog('INFO', msg, labels);
export const logWarning = (msg, labels) => cloudLog('WARNING', msg, labels);
export const logError = (msg, labels) => cloudLog('ERROR', msg, labels);
