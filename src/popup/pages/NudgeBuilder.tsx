import React, { useState } from 'react';
import type { Nudge, RepeatConfig, RepeatType } from '../../types';
import { generateId } from '../../storage';
import ConditionBuilder from '../../components/ConditionBuilder';
import ActionBuilder from '../../components/ActionBuilder';

interface Props {
  nudge: Nudge | null; // null = creating new
  onSave: (nudge: Nudge) => void;
  onCancel: () => void;
}

const REPEAT_OPTIONS: { label: string; type: RepeatType }[] = [
  { label: 'Once', type: 'never' },
  { label: 'Every hour', type: 'hourly' },
  { label: 'Daily', type: 'daily' },
  { label: 'Weekdays', type: 'weekdays' },
  { label: 'Every N min', type: 'interval' },
];

function makeBlankNudge(): Nudge {
  const now = Date.now();
  return {
    id: generateId(),
    name: '',
    enabled: true,
    conditionOperator: 'AND',
    conditions: [],
    actions: [],
    repeat: { type: 'interval', intervalMinutes: 30 },
    stats: { triggeredCount: 0, acceptedCount: 0, ignoredCount: 0, snoozedCount: 0 },
    createdAt: now,
    updatedAt: now,
  };
}

export default function NudgeBuilder({ nudge: initial, onSave, onCancel }: Props) {
  const [nudge, setNudge] = useState<Nudge>(() =>
    initial ? JSON.parse(JSON.stringify(initial)) : makeBlankNudge(),
  );
  const [errors, setErrors] = useState<string[]>([]);

  const update = (partial: Partial<Nudge>) =>
    setNudge((prev) => ({ ...prev, ...partial, updatedAt: Date.now() }));

  const validate = (): boolean => {
    const errs: string[] = [];
    if (!nudge.name.trim()) errs.push('Give your nudge a name.');
    if (nudge.conditions.length === 0) errs.push('Add at least one IF condition.');
    if (nudge.actions.length === 0) errs.push('Add at least one THEN action.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSave = () => {
    if (validate()) onSave(nudge);
  };

  const isEditing = !!initial;

  return (
    <div className="builder-overlay">
      {/* Header */}
      <div className="builder-header">
        <button className="btn-icon" onClick={onCancel} title="Back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <span className="builder-title">{isEditing ? 'Edit Nudge' : 'New Nudge'}</span>
        <label className="toggle" title={nudge.enabled ? 'Enabled' : 'Disabled'}>
          <input
            type="checkbox"
            checked={nudge.enabled}
            onChange={(e) => update({ enabled: e.target.checked })}
          />
          <span className="toggle-track" />
        </label>
      </div>

      {/* Body */}
      <div className="builder-body">
        {/* Name */}
        <input
          className="nudge-name-input"
          placeholder="Name this nudge…"
          value={nudge.name}
          onChange={(e) => update({ name: e.target.value })}
          autoFocus
        />

        {/* IF section */}
        <div className="builder-section">
          <div className="builder-section-header">
            <span className="builder-section-title">IF</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              When these conditions are met
            </span>
          </div>
          <ConditionBuilder
            conditions={nudge.conditions}
            operator={nudge.conditionOperator}
            onChange={(conditions) => update({ conditions })}
            onOperatorChange={(conditionOperator) => update({ conditionOperator })}
          />
        </div>

        {/* THEN section */}
        <div className="builder-section">
          <div className="builder-section-header">
            <span className="builder-section-title">THEN</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              Run these actions in order
            </span>
          </div>
          <ActionBuilder
            actions={nudge.actions}
            onChange={(actions) => update({ actions })}
          />
        </div>

        {/* REPEAT section */}
        <div className="builder-section">
          <div className="builder-section-header">
            <span className="builder-section-title">REPEAT</span>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              How often this nudge can fire
            </span>
          </div>
          <RepeatBuilder
            repeat={nudge.repeat}
            onChange={(repeat) => update({ repeat })}
          />
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div style={{
            background: 'var(--danger-light)',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '10px 14px',
            marginTop: 12,
          }}>
            {errors.map((e, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--danger)', marginBottom: i < errors.length - 1 ? 4 : 0 }}>
                • {e}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="builder-footer">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {isEditing ? 'Save changes' : 'Create Nudge'}
        </button>
      </div>
    </div>
  );
}

// ─── Repeat builder ────────────────────────────────────────────────────────────

function RepeatBuilder({
  repeat,
  onChange,
}: {
  repeat: RepeatConfig;
  onChange: (r: RepeatConfig) => void;
}) {
  return (
    <div>
      <div className="repeat-options">
        {REPEAT_OPTIONS.map(({ label, type }) => (
          <button
            key={type}
            className={`repeat-pill ${repeat.type === type ? 'selected' : ''}`}
            onClick={() => onChange({ type, intervalMinutes: repeat.intervalMinutes ?? 30 })}
          >
            {label}
          </button>
        ))}
      </div>

      {(repeat.type === 'interval' || repeat.type === 'custom') && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Every</span>
          <input
            type="number"
            className="inline-num"
            min={5}
            max={1440}
            value={repeat.intervalMinutes ?? 30}
            onChange={(e) =>
              onChange({ ...repeat, intervalMinutes: Number(e.target.value) })
            }
            style={{ width: 70 }}
          />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>minutes</span>
        </div>
      )}

      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5 }}>
        {repeat.type === 'never' && 'This nudge fires once and then stops.'}
        {repeat.type === 'interval' && `Fires every ${repeat.intervalMinutes ?? 30} minutes while conditions are met.`}
        {repeat.type === 'hourly' && 'Fires at most once per hour.'}
        {repeat.type === 'daily' && 'Fires at most once per day.'}
        {repeat.type === 'weekdays' && 'Fires on weekdays only, at most once per day.'}
      </div>
    </div>
  );
}
