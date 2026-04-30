import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Send, Mic, MapPin, ArrowRight, Activity, BookOpen, Users, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { generateAIResponse } from './utils/aiEngine';
import ProgressDashboard from './components/ProgressDashboard';

// Lazy Load Modals for Performance Optimization
const AuthModal = React.lazy(() => import('./components/AuthModal'));
const ProfileModal = React.lazy(() => import('./components/ProfileModal'));

export default function App() {
  // Theme State
  const [theme, setTheme] = useState('dark-mode');
  
  // Auth & User State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userContext, setUserContext] = useState({
    name: 'Guest',
    userType: 'first-time voter',
    progress: {
      total: 3,
      completed: 1,
      steps: [
        { name: 'Eligibility Checked', status: 'completed' },
        { name: 'Registered', status: 'pending' },
        { name: 'Voting Pending', status: 'pending' }
      ]
    }
  });

  // Chat State
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize Theme & Google Translate script
  useEffect(() => {
    document.body.className = theme;
    
    // Inject Google Translate script efficiently
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
      
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement({ pageLanguage: 'en', layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE }, 'google_translate_element');
      };
    }
  }, [theme]);

  // Scroll optimization
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isLoggedIn) scrollToBottom();
  }, [messages, isLoggedIn, scrollToBottom]);

  // Auth Handler
  const handleLogin = (name, email) => {
    setUserContext(prev => ({ ...prev, name }));
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        data: {
          type: 'greeting',
          title: `Welcome back ${name}! 🎉`,
          content: [
            "I'm Election Guide AI Antigravity.",
            `As a ${userContext.userType}, I will personalize this guide for you.`
          ],
          actions: ['Check Eligibility', 'Who are the candidates?', 'Where is my Polling Booth?']
        }
      }
    ]);
    setIsLoggedIn(true);
  };

  const handleProfileUpdate = (updates) => {
    setUserContext(prev => ({ ...prev, ...updates }));
    setShowProfileModal(false);
  };

  // Chat Handlers
  const processInput = async (text) => {
    if (!text.trim()) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setInputValue('');

    // Simulate thinking state to prevent UI blocking (Efficiency)
    setTimeout(async () => {
      const aiResponse = await generateAIResponse(text, userContext);
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', data: aiResponse }]);
      
      if (text.includes('Yes, I meet these criteria')) {
        setUserContext(prev => ({
          ...prev,
          progress: {
            ...prev.progress,
            completed: 2,
            steps: [
              { name: 'Eligibility Checked', status: 'completed' },
              { name: 'Registered', status: 'completed' },
              { name: 'Voting Pending', status: 'pending' }
            ]
          }
        }));
      }
    }, 500);
  };

  const handleSend = () => processInput(inputValue);

  // Web Speech API Integration
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e) => setInputValue(e.results[0][0].transcript);
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  // Component Renderer for structured messages
  const renderMessageContent = (msg) => {
    if (msg.sender === 'user') return <div className="message-content">{msg.text}</div>;

    const { data } = msg;
    return (
      <article className="message-content structured-response">
        {data.title && (
          <header className="structured-title">
            {data.type === 'correction' ? <Activity size={20} color="var(--warning)" aria-hidden="true" /> : 
             data.type === 'map' ? <MapPin size={20} color="var(--info)" aria-hidden="true" /> :
             data.type === 'candidates' ? <Users size={20} color="var(--info)" aria-hidden="true" /> :
             <BookOpen size={20} aria-hidden="true" />}
            {data.title}
          </header>
        )}
        
        {data.flow && (
          <nav className="structured-flow" aria-label="Process Flow">
            {data.flow.map((step, idx) => (
              <React.Fragment key={idx}>
                <span>{step}</span>
                {idx < data.flow.length - 1 && <ArrowRight size={14} color="var(--text-secondary)" aria-hidden="true" />}
              </React.Fragment>
            ))}
          </nav>
        )}

        {data.content && data.content.map((text, idx) => <p key={idx}>{text}</p>)}

        {data.type === 'map' && (
          <div style={{ width: '100%', height: '250px', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}>
            <iframe width="100%" height="100%" frameBorder="0" src="https://maps.google.com/maps?q=polling+booth+near+me&output=embed" title="Google Maps Polling Booth Location" allowFullScreen></iframe>
          </div>
        )}

        {data.type === 'candidates' && data.candidates && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }} role="list">
            {data.candidates.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px' }} role="listitem">
                <img src={c.image} alt={`Photo of candidate ${c.name}`} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.party}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {data.list && (
          <ul className="structured-list">
            {data.list.map((item, idx) => <li key={idx}><span aria-hidden="true">✔</span> {item}</li>)}
          </ul>
        )}

        {data.actions && (
          <div className="action-buttons">
            {data.actions.map((action, idx) => (
              <button key={idx} className="action-btn" onClick={() => processInput(action)}>
                {action}
              </button>
            ))}
          </div>
        )}
      </article>
    );
  };

  if (!isLoggedIn) {
    return (
      <main>
        <button 
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }} 
          className="icon-btn" 
          onClick={() => setTheme(theme === 'dark-mode' ? 'light-mode' : 'dark-mode')}
          aria-label="Toggle Theme"
        >
          {theme === 'dark-mode' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <Suspense fallback={<div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>Loading Portal...</div>}>
          <AuthModal onLogin={handleLogin} />
        </Suspense>
      </main>
    );
  }

  return (
    <>
      <Suspense fallback={null}>
        {showProfileModal && <ProfileModal userContext={userContext} onClose={() => setShowProfileModal(false)} onUpdate={handleProfileUpdate} />}
      </Suspense>
      
      {/* Sidebar Area */}
      <aside className="sidebar" aria-label="Dashboard Sidebar">
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <header className="header">
            <h1>Election AI</h1>
            <div className="header-controls">
              <button className="icon-btn" onClick={() => setTheme(theme === 'dark-mode' ? 'light-mode' : 'dark-mode')} aria-label="Toggle Theme" title="Toggle Theme">
                {theme === 'dark-mode' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="icon-btn" onClick={() => setShowProfileModal(true)} aria-label="Edit Profile" title="Edit Profile">
                <Settings size={18} />
              </button>
              <button className="icon-btn" onClick={() => setIsLoggedIn(false)} aria-label="Logout" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </header>
          
          <div id="google_translate_element" style={{ background: 'var(--input-bg)', borderRadius: '8px', padding: '5px' }}></div>

          <div className="live-status" role="status" aria-live="polite">
            <div className="status-dot active" aria-hidden="true"></div>
            Live: Campaign Active
          </div>

          <ProgressDashboard userContext={userContext} />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="main-content">
        <section className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-container" aria-live="polite" aria-atomic="false">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message ${msg.sender}`}
                >
                  {renderMessageContent(msg)}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} aria-label={isRecording ? "Stop voice command" : "Start voice command"} title="Voice Command">
              <Mic size={20} aria-hidden="true" />
            </button>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ask me anything about voting..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              aria-label="Chat Input"
            />
            <button className="send-btn" onClick={handleSend} aria-label="Send Message" title="Send Message">
              <Send size={20} aria-hidden="true" />
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
