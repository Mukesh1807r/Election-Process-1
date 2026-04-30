import React from 'react';
import { UserCircle2, CheckCircle2, Circle } from 'lucide-react';

/**
 * ProgressDashboard
 * Wrapped in React.memo to prevent re-renders when parent state
 * (e.g., chat input value) changes but userContext has not.
 */
function ProgressDashboard({ userContext }) {
  const { progress } = userContext;
  const percentage = (progress.completed / progress.total) * 100;

  return (
    <div className="glass-card progress-card">
      <div className="progress-header">
        <h3><UserCircle2 size={18} aria-hidden="true" /> {userContext.name}&apos;s Journey</h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }} aria-label={`${progress.completed} of ${progress.total} steps completed`}>
          {progress.completed} / {progress.total} Steps
        </span>
      </div>
      <div
        className="progress-bar-container"
        role="progressbar"
        aria-valuenow={Math.round(percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Voter journey progress"
      >
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="progress-steps">
        {progress.steps.map((step) => (
          <div key={step.name} className={`progress-step ${step.status}`}>
            {step.status === 'completed'
              ? <CheckCircle2 size={16} aria-label="Completed" />
              : <Circle size={16} aria-label="Pending" />}
            {step.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(ProgressDashboard);
