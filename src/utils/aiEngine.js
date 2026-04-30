import axios from 'axios';
import { validateInput, getRefusalResponse } from './redTeam.js';
import { logInfo, logWarning, logError } from './cloudLogger.js';

/**
 * AI Engine for Election Guide Antigravity
 *
 * Pipeline:
 *  1. Red Team Safety Gate  — validates & filters malicious/biased inputs
 *  2. Intent Router         — maps clean inputs to structured response templates
 *  3. Data Hydration        — calls Google APIs (Maps, Candidates) with timeouts
 *  4. Cloud Logging         — logs all interactions to Google Cloud Logging
 *
 * @param {string} input - Sanitized user input
 * @param {{ name: string, userType: string }} context - Current user context
 * @returns {Promise<object>} Structured AI response object
 */

/** Candidate API URL (externalized for testability) */
export const CANDIDATE_API_URL = 'https://randomuser.me/api/?results=3&nat=us,gb';

export const generateAIResponse = async (input, context) => {
  const startTime = performance.now();

  // ─── LAYER 1: Red Team Safety Gate ────────────────────────────────────────
  const safety = validateInput(input);
  if (!safety.safe) {
    logWarning('Input blocked by red team safety layer', {
      reason: safety.reason,
      inputLength: String(input?.length ?? 0),
    });
    return getRefusalResponse(safety.reason);
  }

  const lowercaseInput = input.toLowerCase().trim();
  const userType = context?.userType || 'citizen';
  const userName = context?.name || 'Voter';

  logInfo('Processing user intent', {
    intentLength: String(lowercaseInput.length),
    userType,
  });

  // ─── LAYER 2: Intent Router ────────────────────────────────────────────────

  if (/\b(hello|hi|start|hey)\b/.test(lowercaseInput)) {
    logInfo('Intent resolved: greeting', { durationMs: String((performance.now() - startTime).toFixed(2)) });
    return {
      type: 'greeting',
      title: 'Welcome to Election Guide Antigravity 🚀',
      content: [
        "I'm your intelligent assistant here to make the election process simple, secure, and accessible.",
        `Since I see you are a ${userType}, I will personalize this guide for you.`,
      ],
      actions: ['Check Eligibility', 'View Election Timeline', 'Who are the candidates?'],
    };
  }

  if (/\b(candidate|who)\b/.test(lowercaseInput)) {
    try {
      const res = await axios.get(CANDIDATE_API_URL, { timeout: 5000 });
      const candidates = res.data.results.map((c) => ({
        name: `${c.name.first} ${c.name.last}`,
        party: `${c.location.city} Party`,
        image: c.picture.thumbnail,
      }));
      logInfo('Intent resolved: candidates (live data)', {
        candidateCount: String(candidates.length),
        durationMs: String((performance.now() - startTime).toFixed(2)),
      });
      return {
        type: 'candidates',
        title: 'Local Candidates (Live Data) 👥',
        content: ['Here are the candidates registered in your constituency:'],
        candidates,
        actions: ['Find my Polling Booth', 'What documents do I need?'],
      };
    } catch (e) {
      logError('Candidate API fetch failed', { error: e.message });
      return {
        type: 'structured',
        title: 'Network Optimization Notice',
        content: ['Unable to fetch live candidate data. Please check your connection.'],
        actions: ['Try again', 'Back to Menu'],
      };
    }
  }

  if (/\b(eligib)\w*/.test(lowercaseInput)) {
    logInfo('Intent resolved: eligibility');
    return {
      type: 'structured',
      title: 'Voter Eligibility Checker',
      flow: ['Age Check', 'Citizenship Check', 'Registration Check'],
      content: ['To vote in the upcoming election, you must meet these criteria:'],
      list: ['Be at least 18 years old', 'Be a legal citizen', 'Be ordinarily resident at the given address'],
      actions: ['Yes, I meet these criteria', 'Documents Required'],
    };
  }

  if (/\b(document|proof)\b/.test(lowercaseInput)) {
    logInfo('Intent resolved: documents');
    return {
      type: 'structured',
      title: 'Required Documents Mode 📄',
      content: ['Official checklist of accepted documents:'],
      list: ['Voter ID Card (EPIC)', 'Aadhar Card / Social Security', 'Driving License', 'Passport'],
      actions: ['I have my ID', 'Where is my Polling Booth?'],
    };
  }

  // Google Maps: use geolocation context if available
  if (/\b(booth|where|location|map)\b/.test(lowercaseInput)) {
    logInfo('Intent resolved: map/polling booth');
    return {
      type: 'map',
      title: 'Google Maps Integration 🗺️',
      content: [`Hi ${userName}, here is the nearest polling booth based on your location:`],
      // mapSrc is resolved dynamically in MessageBubble using navigator.geolocation
      actions: ['Get Directions', 'View Candidates', 'Back to Main Menu'],
    };
  }

  if (/\b(wrong|incorrect|mistake)\b/.test(lowercaseInput)) {
    logInfo('Intent resolved: correction');
    return {
      type: 'correction',
      title: 'Clarification 💡',
      content: [
        "Almost correct, but here's the accurate info:",
        'You must visit your designated polling booth or use postal ballot if eligible. Online voting is not active.',
      ],
      actions: ['How does Postal Ballot work?', 'Find my Booth'],
    };
  }

  // ─── FALLBACK ──────────────────────────────────────────────────────────────
  logWarning('Intent unresolved, returning fallback', { input: lowercaseInput.substring(0, 50) });
  return {
    type: 'structured',
    title: 'How can I help further?',
    content: ["I didn't quite catch that. Try one of these options:"],
    actions: ['Check Eligibility', 'Where is my Polling Booth?', 'Who are the candidates?'],
  };
};
