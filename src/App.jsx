import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, MapPin, ArrowRight, Activity, BookOpen, Users, Sun, Moon, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { generateAIResponse } from './utils/aiEngine';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ProgressDashboard from './components/ProgressDashboard';

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
      <div className="message-content structured-response">
        {data.title && (
          <div className="structured-title">
            {data.type === 'correction' ? <Activity size={20} color="var(--warning)" /> : 
             data.type === 'map' ? <MapPin size={20} color="var(--info)" /> :
             data.type === 'candidates' ? <Users size={20} color="var(--info)" /> :
             <BookOpen size={20} />}
            {data.title}
          </div>
        )}
        
        {data.flow && (
          <div className="structured-flow">
            {data.flow.map((step, idx) => (
              <React.Fragment key={idx}>
                <span>{step}</span>
                {idx < data.flow.length - 1 && <ArrowRight size={14} color="var(--text-secondary)" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {data.content && data.content.map((text, idx) => <p key={idx}>{text}</p>)}

        {data.type === 'map' && (
          <div style={{ width: '100%', height: '250px', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}>
            <iframe width="100%" height="100%" frameBorder="0" src="https://maps.google.com/maps?q=polling+booth+near+me&output=embed" title="Google Maps" allowFullScreen></iframe>
          </div>
        )}

        {data.type === 'candidates' && data.candidates && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {data.candidates.map((c, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px' }}>
                <img src={c.image} alt={c.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
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
            {data.list.map((item, idx) => <li key={idx}><span>✔</span> {item}</li>)}
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
      </div>
    );
  };

  if (!isLoggedIn) {
    return (
      <>
        <button 
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 1000 }} 
          className="icon-btn" 
          onClick={() => setTheme(theme === 'dark-mode' ? 'light-mode' : 'dark-mode')}
        >
          {theme === 'dark-mode' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <AuthModal onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      {showProfileModal && <ProfileModal userContext={userContext} onClose={() => setShowProfileModal(false)} onUpdate={handleProfileUpdate} />}
      
      {/* Sidebar Area */}
      <div className="sidebar">
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="header">
            <h1>Election AI</h1>
            <div className="header-controls">
              <button className="icon-btn" onClick={() => setTheme(theme === 'dark-mode' ? 'light-mode' : 'dark-mode')} title="Toggle Theme">
                {theme === 'dark-mode' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="icon-btn" onClick={() => setShowProfileModal(true)} title="Edit Profile">
                <Settings size={18} />
              </button>
              <button className="icon-btn" onClick={() => setIsLoggedIn(false)} title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
          
          <div id="google_translate_element" style={{ background: 'var(--input-bg)', borderRadius: '8px', padding: '5px' }}></div>

          <div className="live-status">
            <div className="status-dot active"></div>
            Live: Campaign Active
          </div>

          <ProgressDashboard userContext={userContext} />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="main-content">
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="chat-container">
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
            <button className={`mic-btn ${isRecording ? 'recording' : ''}`} onClick={toggleRecording} title="Voice Command">
              <Mic size={20} />
            </button>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ask me anything about voting..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="send-btn" onClick={handleSend} title="Send Message">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
