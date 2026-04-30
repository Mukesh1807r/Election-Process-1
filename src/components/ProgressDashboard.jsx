import React from 'react';
import { UserCircle2, CheckCircle2, Circle } from 'lucide-react';

export default function ProgressDashboard({ userContext }) {
  const { progress } = userContext;
  const percentage = (progress.completed / progress.total) * 100;

  return (
    <div className="glass-card progress-card">
      <div className="progress-header">
        <h3><UserCircle2 size={18} /> {userContext.name}'s Journey</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {progress.completed} / {progress.total} Steps
        </span>
      </div>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="progress-steps">
        {progress.steps.map((step, idx) => (
          <div key={idx} className={`progress-step ${step.status}`}>
            {step.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            {step.name}
          </div>
        ))}
      </div>
    </div>
  );
}
