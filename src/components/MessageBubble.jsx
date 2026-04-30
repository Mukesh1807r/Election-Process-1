/**
 * MessageBubble Component
 * Extracted from App.jsx for modularity and testability.
 * Renders structured AI responses or plain user messages.
 * 
 * WCAG 2.1 AA: Uses semantic <article>, <header>, <nav> markup.
 * All decorative icons have aria-hidden="true".
 */
import React from 'react';
import { Activity, MapPin, Users, BookOpen, ArrowRight, Volume2 } from 'lucide-react';
import { speak, responseToSpeech } from '../utils/ttsService';
import { processInput } from '../utils/inputProcessor';

const ICON_MAP = {
  correction: <Activity size={20} color="var(--warning)" aria-hidden="true" />,
  map: <MapPin size={20} color="var(--info)" aria-hidden="true" />,
  candidates: <Users size={20} color="var(--info)" aria-hidden="true" />,
};

export default function MessageBubble({ msg, onAction }) {
  if (msg.sender === 'user') {
    return (
      <div className="message-content" role="note" aria-label={`You said: ${msg.text}`}>
        {msg.text}
      </div>
    );
  }

  const { data } = msg;

  return (
    <article className="message-content structured-response" aria-label="AI response">
      {data.title && (
        <header
          className="structured-title"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {ICON_MAP[data.type] || <BookOpen size={20} aria-hidden="true" />}
            {data.title}
          </span>
          <button
            onClick={() => speak(responseToSpeech(data))}
            aria-label="Read response aloud"
            title="Read aloud (Accessibility)"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
          >
            <Volume2 size={16} aria-hidden="true" />
          </button>
        </header>
      )}

      {data.flow && (
        <nav className="structured-flow" aria-label="Process Flow">
          {data.flow.map((step, idx) => (
            <React.Fragment key={step}>
              <span>{step}</span>
              {idx < data.flow.length - 1 && <ArrowRight size={14} color="var(--text-secondary)" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </nav>
      )}

      {data.content && data.content.map((text, idx) => <p key={idx}>{text}</p>)}

      {data.type === 'map' && (
        <div style={{ width: '100%', height: '250px', borderRadius: '12px', overflow: 'hidden', marginTop: '10px' }}>
          <iframe
            id="polling-booth-map"
            width="100%"
            height="100%"
            frameBorder="0"
            src={data.mapSrc || 'https://maps.google.com/maps?q=polling+booth+near+me&output=embed'}
            title="Google Maps Polling Booth Location"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {data.type === 'candidates' && data.candidates && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }} role="list">
          {data.candidates.map((c) => (
            <div
              key={c.name}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--input-bg)', padding: '10px', borderRadius: '8px' }}
              role="listitem"
            >
              <img
                src={c.image}
                alt={`Photo of candidate ${c.name}`}
                loading="lazy"
                width="40"
                height="40"
                style={{ borderRadius: '50%' }}
              />
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
          {data.list.map((item) => (
            <li key={item}><span aria-hidden="true">✔</span> {item}</li>
          ))}
        </ul>
      )}

      {data.actions && (
        <div className="action-buttons">
          {data.actions.map((action) => (
            <button key={action} className="action-btn" onClick={() => onAction(action)}>
              {action}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
