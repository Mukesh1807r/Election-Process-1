/**
 * Red Teaming Safety Layer
 * Prevents election misinformation, bias, and prompt injection attacks.
 * This module runs BEFORE the AI engine processes any user input.
 */

// List of disallowed patterns: misinformation, bias, prompt injection attempts
const BLOCKED_PATTERNS = [
  /vote\s+for\s+\w+/i,           // Direct candidate endorsement
  /don'?t\s+vote/i,              // Voter suppression
  /election\s+is\s+rigged/i,     // Election integrity misinformation
  /ignore\s+(all\s+)?(previous|above|prior)\s+instructions/i, // Prompt injection
  /jailbreak/i,
  /act\s+as\s+(a\s+)?different/i,
  /bypass/i,
  /fake\s+(election|vote|ballot)/i,
  /illegal\s+voting/i,
];

// Bias detection: one-sided political statements
const BIAS_PATTERNS = [
  /\b(democrats?|republicans?|bjp|congress|aap)\s+(are|is)\s+(always|never|best|worst|corrupt|great)/i,
  /only\s+\w+\s+party\s+(is|are)\s+good/i,
];

/**
 * Validates user input against red team safety rules.
 * @param {string} input - Raw user input
 * @returns {{ safe: boolean, reason?: string }}
 */
export const validateInput = (input) => {
  if (!input || typeof input !== 'string') {
    return { safe: false, reason: 'INVALID_TYPE' };
  }

  const trimmed = input.trim();

  // Enforce max input length (prevents DoS via huge inputs)
  if (trimmed.length > 500) {
    return { safe: false, reason: 'INPUT_TOO_LONG' };
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: 'MISINFORMATION_OR_INJECTION' };
    }
  }

  for (const pattern of BIAS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { safe: false, reason: 'POLITICAL_BIAS' };
    }
  }

  return { safe: true };
};

/**
 * Generates a safe, standardized refusal response for flagged inputs.
 * @param {string} reason - The reason code from validateInput
 * @returns {object} - Structured AI response object
 */
export const getRefusalResponse = (reason) => {
  const messages = {
    INVALID_TYPE: 'Please provide a valid text question.',
    INPUT_TOO_LONG: 'Your question is too long. Please keep it under 500 characters.',
    MISINFORMATION_OR_INJECTION: "I can only provide factual, unbiased election guidance. I can't process that request.",
    POLITICAL_BIAS: "I'm a neutral, non-partisan assistant. I cannot make political judgments about any party.",
  };

  return {
    type: 'correction',
    title: '⚠️ Safety Notice',
    content: [messages[reason] || 'That input could not be processed safely.'],
    actions: ['Check Eligibility', 'Find Polling Booth', 'Back to Menu'],
  };
};
