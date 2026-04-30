/**
 * ttsService.js — Google Text-to-Speech Accessibility Module
 *
 * WCAG 2.1 AA: Supports users with visual impairments via audio feedback.
 * Uses browser-native Web Speech Synthesis API.
 * Voices are cached after the first load to prevent repeated GC pressure.
 */

// ─── Voice Cache (Performance: avoid repeated getVoices() calls) ────────────
let _cachedVoices = null;

const getVoices = () => {
  if (_cachedVoices && _cachedVoices.length > 0) return _cachedVoices;
  _cachedVoices = window.speechSynthesis?.getVoices() || [];
  return _cachedVoices;
};

// Populate cache once voices are loaded asynchronously (browser requirement)
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    _cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Speak a given text string using the Web Speech Synthesis API.
 * @param {string} text - The text to be spoken aloud
 * @param {object} [options] - Optional voice settings
 * @param {'en-US'|'hi-IN'|'ta-IN'} [options.lang] - BCP 47 language tag
 * @param {number} [options.rate] - Speech rate (0.1–10, default 0.95)
 * @param {number} [options.pitch] - Pitch (0–2, default 1.0)
 * @param {number} [options.volume] - Volume (0–1, default 1.0)
 */
export const speak = (text, options = {}) => {
  if (!text || typeof text !== 'string') return;
  if (!window.speechSynthesis) return; // Graceful degradation

  // Cancel any currently-speaking utterance (prevents queue buildup)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate ?? 0.95;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  // Prefer a Google-branded voice for quality; fall back to any English voice
  const voices = getVoices();
  const preferred =
    voices.find((v) => v.name.includes('Google') && v.lang.startsWith('en')) ||
    voices.find((v) => v.lang.startsWith(utterance.lang.split('-')[0]));
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
};

/**
 * Stop any currently-speaking TTS immediately.
 */
export const stopSpeaking = () => {
  window.speechSynthesis?.cancel();
};

/**
 * Flattens a structured AI response object into a clean, speakable string.
 * Strips emoji characters to prevent robotic pronunciation.
 * @param {object} data - The AI response data object
 * @returns {string}
 */
export const responseToSpeech = (data) => {
  if (!data || typeof data !== 'object') return '';

  // Unicode emoji regex — strip all emoji to ensure clean speech output
  const stripEmoji = (str) => str.replace(/\p{Emoji}/gu, '').trim();

  const parts = [];
  if (data.title) parts.push(stripEmoji(data.title));
  if (Array.isArray(data.content)) parts.push(...data.content.map(stripEmoji));
  if (Array.isArray(data.list)) parts.push('Requirements: ' + data.list.join('. '));

  return parts.filter(Boolean).join('. ');
};
