import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Send, Mic, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FocusLock from 'react-focus-lock';

import { generateAIResponse } from './utils/aiEngine';
import { speak, responseToSpeech } from './utils/ttsService';
import { logInfo, logError } from './utils/cloudLogger';
import ProgressDashboard from './components/ProgressDashboard';
import MessageBubble from './components/MessageBubble';

// Lazy Load Modals for Performance Optimization (code splitting)
const AuthModal = React.lazy(() => import('./components/AuthModal'));
const ProfileModal = React.lazy(() => import('./components/ProfileModal'));

// ─── Toast Notification (replaces alert() — non-blocking UI) ─────────────────
function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        background: 'var(--danger)', color: 'white', padding: '0.75rem 1.5rem',
        borderRadius: '12px', zIndex: 9999, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {message}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState('dark-mode');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toast, setToast] = useState(null);

  const [userContext, setUserContext] = useState({
    name: 'Guest',
    userType: 'first-time voter',
    progress: {
      total: 3,
      completed: 1,
      steps: [
        { name: 'Eligibility Checked', status: 'completed' },
        { name: 'Registered', status: 'pending' },
        { name: 'Voting Pending', status: 'pending' },
      ],
    },
  });

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // ─── Theme & Google Translate ─────────────────────────────────────────────
  useEffect(() => {
    document.body.className = theme;

    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE },
          'google_translate_element'
        );
      };
    }
  }, [theme]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isLoggedIn) scrollToBottom();
  }, [messages, isLoggedIn, scrollToBottom]);

  // ─── Auth Handler (fixed stale closure — userType passed from AuthModal) ──
  const handleLogin = useCallback((name, _email, userType) => {
    const resolvedType = userType || 'first-time voter';
    setUserContext((prev) => ({ ...prev, name, userType: resolvedType }));
    setMessages([
      {
        id: crypto.randomUUID(),
        sender: 'ai',
        data: {
          type: 'greeting',
          title: `Welcome back ${name}! 🎉`,
          content: [
            "I'm Election Guide AI Antigravity.",
            `As a ${resolvedType}, I will personalize this guide for you.`,
          ],
          actions: ['Check Eligibility', 'Who are the candidates?', 'Where is my Polling Booth?'],
        },
      },
    ]);
    setIsLoggedIn(true);
    logInfo('User logged in', { userType: resolvedType });
  }, []);

  const handleProfileUpdate = (updates) => {
    setUserContext((prev) => ({ ...prev, ...updates }));
    setShowProfileModal(false);
  };

  // ─── Chat Handler ─────────────────────────────────────────────────────────
  const processInput = useCallback(async (text) => {
    if (!text.trim() || isThinking) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: 'user', text }]);
    setInputValue('');
    setIsThinking(true);
    logInfo('User message sent', { userType: userContext.userType });

    try {
      const aiResponse = await generateAIResponse(text, userContext);

      // Geolocation: enrich map response with real user coordinates
      if (aiResponse.type === 'map' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            aiResponse.mapSrc = `https://maps.google.com/maps?q=polling+booth&ll=${latitude},${longitude}&output=embed`;
          },
          () => {
            // Permission denied or unavailable — use generic fallback
            aiResponse.mapSrc = 'https://maps.google.com/maps?q=polling+booth+near+me&output=embed';
          }
        );
      }

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), sender: 'ai', data: aiResponse }]);
      speak(responseToSpeech(aiResponse));

      if (text === 'Yes, I meet these criteria') {
        setUserContext((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            completed: 2,
            steps: [
              { name: 'Eligibility Checked', status: 'completed' },
              { name: 'Registered', status: 'completed' },
              { name: 'Voting Pending', status: 'pending' },
            ],
          },
        }));
      }
    } catch (err) {
      logError('AI response generation failed', { error: err.message });
      setToast('Something went wrong. Please try again.');
    } finally {
      setIsThinking(false);
    }
  }, [isThinking, userContext]);

  const handleSend = () => processInput(inputValue);

  // ─── Voice Input ──────────────────────────────────────────────────────────
  const toggleRecording = () => {
    if (isRecording) { setIsRecording(false); return; }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Non-blocking toast instead of alert()
      setToast('Voice recognition is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e) => setInputValue(e.results[0][0].transcript);
    recognition.onerror = () => { setIsRecording(false); setToast('Voice input failed. Please try again.'); };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  // ─── Auth Screen ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <main id="main-content">
        {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        <button
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }}
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark-mode' ? 'light-mode' : 'dark-mode')}
          aria-label={`Switch to ${theme === 'dark-mode' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark-mode' ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
        </button>
        <Suspense fallback={
          <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
            Loading Portal...
          </div>
        }>
          <FocusLock>
            <AuthModal onLogin={handleLogin} />
          </FocusLock>
        </Suspense>
      </main>
    );
  }

  // ─── Main Dashboard ───────────────────────────────────────────────────────
  return (
    <>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      <Suspense fallback={null}>
        {showProfileModal && (
          <FocusLock>
            <ProfileModal
              userContext={userContext}
              onClose={() => setShowProfileModal(false)}
              onUpdate={handleProfileUpdate}
            />
          </FocusLock>
        )}
      </Suspense>

      {/* Sidebar */}
      <aside className="sidebar" aria-label="Dashboard Sidebar">
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <header className="header">
            <h1>Election AI</h1>
            <div className="header-controls">
              <button
                className="icon-btn"
                onClick={() => setTheme(theme === 'dark-mode' ? 'light-mode' : 'dark-mode')}
                aria-label={`Switch to ${theme === 'dark-mode' ? 'light' : 'dark'} mode`}
                title="Toggle Theme"
              >
                {theme === 'dark-mode' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              </button>
              <button className="icon-btn" onClick={() => setShowProfileModal(true)} aria-label="Edit Profile" title="Edit Profile">
                <Settings size={18} aria-hidden="true" />
              </button>
              <button className="icon-btn" onClick={() => setIsLoggedIn(false)} aria-label="Logout" title="Logout">
                <LogOut size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          <div id="google_translate_element" style={{ background: 'var(--input-bg)', borderRadius: '8px', padding: '5px' }} />

          <div className="live-status" role="status" aria-live="polite">
            <div className="status-dot active" aria-hidden="true" />
            Live: Campaign Active
          </div>

          <ProgressDashboard userContext={userContext} />
        </div>
      </aside>

      {/* Main Chat */}
      <main id="main-content" className="main-content">
        <section className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-container" aria-live="polite" aria-atomic="false" aria-label="Conversation">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message ${msg.sender}`}
                >
                  <MessageBubble msg={msg} onAction={processInput} />
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <div className="message ai" aria-label="AI is thinking" aria-live="polite">
                <div className="message-content" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Thinking…
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <button
              className={`mic-btn ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              aria-label={isRecording ? 'Stop voice command' : 'Start voice command'}
              title="Voice Command"
            >
              <Mic size={20} aria-hidden="true" />
            </button>
            <input
              type="text"
              className="input-field"
              placeholder="Ask me anything about voting…"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              aria-label="Chat Input"
              disabled={isThinking}
            />
            <button
              className="send-btn"
              onClick={handleSend}
              aria-label="Send Message"
              title="Send Message"
              disabled={isThinking}
            >
              <Send size={20} aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
