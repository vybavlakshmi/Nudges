import React from 'react';
import type { Nudge } from '../types';
import { nudgeSummary, actionLabel, repeatLabel, timeAgo } from '../utils/helpers';

interface Props {
  nudge: Nudge;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function NudgeCard({ nudge, onToggle, onEdit, onDuplicate, onDelete }: Props) {
  const ifSummary = nudgeSummary(nudge.conditions, nudge.conditionOperator);
  const thenSummary =
    nudge.actions.length > 0
      ? nudge.actions
          .slice(0, 2)
          .map(actionLabel)
          .join(', ') + (nudge.actions.length > 2 ? ` +${nudge.actions.length - 2} more` : '')
      : 'No actions';

  return (
    <div className={`nudge-card ${nudge.enabled ? '' : 'disabled'}`}>
      <div className="nudge-card-top">
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className="nudge-card-name">{nudge.name}</span>
            <span className={`badge ${nudge.enabled ? 'badge-green' : 'badge-gray'}`}>
              {nudge.enabled ? 'On' : 'Off'}
            </span>
          </div>
          <div className="nudge-card-meta">
            <div className="nudge-card-row">
              <span className="meta-label">IF</span>
              <span className="meta-value">{ifSummary}</span>
            </div>
            <div className="nudge-card-row">
              <span className="meta-label">THEN</span>
              <span className="meta-value">{thenSummary}</span>
            </div>
            <div className="nudge-card-row">
              <span className="meta-label">REPEAT</span>
              <span className="meta-value">{repeatLabel(nudge.repeat)}</span>
            </div>
          </div>
        </div>
        <label className="toggle" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          <input type="checkbox" checked={nudge.enabled} readOnly />
          <span className="toggle-track" />
        </label>
      </div>

      <div className="nudge-card-footer">
        <span className="nudge-card-time">
          {nudge.stats.triggeredCount > 0
            ? `Triggered ${nudge.stats.triggeredCount}× · Last ${timeAgo(nudge.stats.lastTriggered)}`
            : 'Never triggered'}
        </span>
        <div className="nudge-card-actions">
          <button className="btn-icon" title="Edit" onClick={onEdit}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="btn-icon" title="Duplicate" onClick={onDuplicate}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
          <button className="btn-icon danger" title="Delete" onClick={onDelete}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
