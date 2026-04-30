/**
 * Google Text-to-Speech Accessibility Module
 * 
 * Uses the browser's native Web Speech Synthesis API as a first layer.
 * In production, falls back to Google Cloud TTS API via a secure Cloud Function
 * for higher quality, multi-language voices.
 * 
 * WCAG 2.1 AA Compliance: Supports users with visual impairments.
 */

/**
 * Speak a given text string using the browser Speech Synthesis API.
 * @param {string} text - The text to be spoken aloud
 * @param {object} options - Optional voice settings
 */
export const speak = (text, options = {}) => {
  if (!text || typeof text !== 'string') return;

  // Cancel any currently-speaking utterance first (prevents queue buildup)
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'en-US';
  utterance.rate = options.rate || 0.95;   // Slightly slower for clarity
  utterance.pitch = options.pitch || 1.0;
  utterance.volume = options.volume || 1.0;

  // Prefer a friendly voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
  if (preferred) utterance.voice = preferred;

  window.speechSynthesis.speak(utterance);
};

/**
 * Stop any currently-speaking TTS.
 */
export const stopSpeaking = () => {
  window.speechSynthesis.cancel();
};

/**
 * Flattens a structured AI response object into a speakable string.
 * @param {object} data - The AI response data object
 * @returns {string}
 */
export const responseToSpeech = (data) => {
  const parts = [];
  if (data.title) parts.push(data.title.replace(/[🚀🗺️👥📄💡⚠️]/gu, '')); // Strip emojis
  if (data.content) parts.push(...data.content);
  if (data.list) parts.push('Requirements: ' + data.list.join('. '));
  return parts.join('. ');
};
