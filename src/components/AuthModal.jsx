import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AuthModal({ onLogin }) {
  const [authMode, setAuthMode] = useState('login');
  const [authData, setAuthData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic Security: Sanitize and validate inputs
    if (!authData.email.includes('@')) {
      alert("Invalid email format");
      return;
    }
    
    const userName = authMode === 'signup' && authData.name ? authData.name : (authData.email.split('@')[0] || 'Voter');
    onLogin(userName, authData.email);
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        className="glass-card modal-card"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 'bold' }}>Election AI</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Secure Portal</p>
        </div>

        <div className="auth-tabs">
          <div className={`auth-tab ${authMode === 'login' ? 'active' : ''}`} onClick={() => setAuthMode('login')}>Log In</div>
          <div className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`} onClick={() => setAuthMode('signup')}>Sign Up</div>
        </div>

        <form onSubmit={handleSubmit}>
          {authMode === 'signup' && (
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
              <input type="text" className="auth-input" value={authData.name} onChange={e => setAuthData({...authData, name: e.target.value})} required />
            </div>
          )}
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email</label>
            <input type="email" className="auth-input" value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} required />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
            <input type="password" className="auth-input" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} required />
          </div>
          <button type="submit" className="auth-submit">
            {authMode === 'login' ? 'Secure Login' : 'Create Voter Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
