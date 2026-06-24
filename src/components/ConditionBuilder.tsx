import React from 'react';
import type { Condition, ConditionType } from '../types';
import { generateId } from '../storage';
import { conditionTypeLabel } from '../utils/helpers';

interface Props {
  conditions: Condition[];
  operator: 'AND' | 'OR';
  onChange: (conditions: Condition[]) => void;
  onOperatorChange: (op: 'AND' | 'OR') => void;
}

const CONDITION_TYPES: ConditionType[] = [
  'website',
  'time_spent',
  'current_time',
  'day_of_week',
  'idle_time',
  'keyboard_idle',
  'mouse_idle',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function defaultParams(type: ConditionType): Record<string, unknown> {
  switch (type) {
    case 'website':
      return { domains: [''] };
    case 'time_spent':
      return { minutes: 20 };
    case 'current_time':
      return { time: '09:00', toleranceMinutes: 2 };
    case 'day_of_week':
      return { days: [1, 2, 3, 4, 5] };
    case 'idle_time':
    case 'keyboard_idle':
    case 'mouse_idle':
      return { minutes: 5 };
    default:
      return {};
  }
}

function addCondition(conditions: Condition[]): Condition[] {
  return [
    ...conditions,
    { id: generateId(), type: 'website' as ConditionType, params: defaultParams('website') as never },
  ];
}

export default function ConditionBuilder({ conditions, operator, onChange, onOperatorChange }: Props) {
  const update = (idx: number, updated: Condition) => {
    const next = [...conditions];
    next[idx] = updated;
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(conditions.filter((_, i) => i !== idx));
  };

  const changeType = (idx: number, type: ConditionType) => {
    update(idx, { ...conditions[idx], type, params: defaultParams(type) as never });
  };

  return (
    <div>
      {conditions.map((cond, idx) => (
        <div key={cond.id}>
          <div className="condition-item">
            <div className="condition-body">
              <div className="condition-row">
                <select
                  className="condition-type-select"
                  value={cond.type}
                  onChange={(e) => changeType(idx, e.target.value as ConditionType)}
                >
                  {CONDITION_TYPES.map((t) => (
                    <option key={t} value={t}>{conditionTypeLabel(t)}</option>
                  ))}
                </select>
                <ConditionParams
                  condition={cond}
                  onChange={(p) => update(idx, { ...cond, params: p as never })}
                />
              </div>
            </div>
            <button
              className="btn-icon danger"
              onClick={() => remove(idx)}
              title="Remove condition"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {idx < conditions.length - 1 && (
            <div style={{ margin: '4px 0 4px 8px' }}>
              <span
                className="operator-pill"
                onClick={() => onOperatorChange(operator === 'AND' ? 'OR' : 'AND')}
                title="Click to toggle AND/OR"
              >
                {operator}
              </span>
            </div>
          )}
        </div>
      ))}

      <button className="add-btn" onClick={() => onChange(addCondition(conditions))}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add condition
      </button>
    </div>
  );
}

// ─── Per-condition param editor ───────────────────────────────────────────────

function ConditionParams({
  condition,
  onChange,
}: {
  condition: Condition;
  onChange: (params: Record<string, unknown>) => void;
}) {
  const p = condition.params as unknown as Record<string, unknown>;

  switch (condition.type) {
    case 'website': {
      const domains = (p.domains as string[]) ?? [''];
      return (
        <div style={{ flex: 1 }}>
          {domains.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, marginBottom: i < domains.length - 1 ? 4 : 0 }}>
              <input
                className="condition-param-input"
                placeholder="e.g. youtube.com"
                value={d}
                onChange={(e) => {
                  const next = [...domains];
                  next[i] = e.target.value;
                  onChange({ ...p, domains: next });
                }}
              />
              {domains.length > 1 && (
                <button
                  className="btn-icon danger"
                  onClick={() => onChange({ ...p, domains: domains.filter((_, j) => j !== i) })}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            style={{ marginTop: 4, fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', fontFamily: 'var(--font)', fontWeight: 500 }}
            onClick={() => onChange({ ...p, domains: [...domains, ''] })}
          >
            + Add domain
          </button>
        </div>
      );
    }

    case 'time_spent':
    case 'idle_time':
    case 'keyboard_idle':
    case 'mouse_idle': {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number"
            className="inline-num"
            min={1}
            value={p.minutes as number}
            onChange={(e) => onChange({ ...p, minutes: Number(e.target.value) })}
          />
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>min</span>
        </div>
      );
    }

    case 'current_time': {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="time"
            className="condition-param-input"
            style={{ width: 110 }}
            value={p.time as string}
            onChange={(e) => onChange({ ...p, time: e.target.value })}
          />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>±</span>
          <input
            type="number"
            className="inline-num"
            min={1}
            max={30}
            value={(p.toleranceMinutes as number) ?? 2}
            onChange={(e) => onChange({ ...p, toleranceMinutes: Number(e.target.value) })}
          />
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>min</span>
        </div>
      );
    }

    case 'day_of_week': {
      const selected = (p.days as number[]) ?? [];
      return (
        <div className="day-pills">
          {DAYS.map((name, i) => (
            <button
              key={i}
              className={`day-pill ${selected.includes(i) ? 'selected' : ''}`}
              onClick={() => {
                const next = selected.includes(i)
                  ? selected.filter((d) => d !== i)
                  : [...selected, i];
                onChange({ ...p, days: next });
              }}
            >
              {name}
            </button>
          ))}
        </div>
      );
    }

    default:
      return null;
  }
}
