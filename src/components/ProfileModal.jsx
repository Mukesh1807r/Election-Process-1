import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function ProfileModal({ userContext, onClose, onUpdate }) {
  const [name, setName] = useState(userContext.name);
  const [userType, setUserType] = useState(userContext.userType);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdate({ name, userType });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="glass-card modal-card"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Edit Profile</h2>
        <form onSubmit={handleSave}>
          <div>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Display Name</label>
            <input type="text" className="auth-input" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Voter Type</label>
            <select className="auth-input" value={userType} onChange={e => setUserType(e.target.value)}>
              <option value="first-time voter">First-Time Voter</option>
              <option value="returning voter">Returning Voter</option>
              <option value="senior citizen">Senior Citizen</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', cursor: 'pointer' }}>Save Changes</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
