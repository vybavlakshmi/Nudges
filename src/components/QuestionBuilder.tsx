import React from 'react';
import type { Question, QuestionButton, Action, ActionType } from '../types';
import { generateId } from '../storage';
import { actionTypeLabel } from '../utils/helpers';

interface Props {
  question: Question;
  onChange: (q: Question) => void;
}

const SIMPLE_ACTION_TYPES: ActionType[] = [
  'notification',
  'open_url',
  'close_tab',
  'snooze',
  'play_sound',
];

function defaultActionParams(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'notification': return { title: 'Nudge', message: '' };
    case 'open_url': return { url: 'https://' };
    case 'close_tab': return {};
    case 'snooze': return { minutes: 20 };
    case 'play_sound': return { sound: 'gentle' };
    default: return {};
  }
}

export default function QuestionBuilder({ question, onChange }: Props) {
  const updateText = (text: string) => onChange({ ...question, text });

  const addButton = () => {
    const btn: QuestionButton = {
      id: generateId(),
      label: 'Option',
      actions: [],
    };
    onChange({ ...question, buttons: [...question.buttons, btn] });
  };

  const updateButton = (idx: number, btn: QuestionButton) => {
    const next = [...question.buttons];
    next[idx] = btn;
    onChange({ ...question, buttons: next });
  };

  const removeButton = (idx: number) => {
    onChange({ ...question, buttons: question.buttons.filter((_, i) => i !== idx) });
  };

  return (
    <div className="question-card">
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Question text</label>
        <textarea
          className="form-textarea"
          placeholder="What would you like to ask?"
          value={question.text}
          onChange={(e) => updateText(e.target.value)}
          rows={2}
        />
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>
        BUTTONS
      </div>

      {question.buttons.map((btn, idx) => (
        <QuestionButtonEditor
          key={btn.id}
          button={btn}
          onChange={(b) => updateButton(idx, b)}
          onRemove={() => removeButton(idx)}
        />
      ))}

      <button className="add-btn" onClick={addButton} style={{ marginTop: 8 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add button
      </button>
    </div>
  );
}

function QuestionButtonEditor({
  button,
  onChange,
  onRemove,
}: {
  button: QuestionButton;
  onChange: (b: QuestionButton) => void;
  onRemove: () => void;
}) {
  const addAction = () => {
    const action: Action = {
      id: generateId(),
      type: 'notification',
      params: defaultActionParams('notification') as never,
    };
    onChange({ ...button, actions: [...button.actions, action] });
  };

  const updateAction = (idx: number, action: Action) => {
    const next = [...button.actions];
    next[idx] = action;
    onChange({ ...button, actions: next });
  };

  const removeAction = (idx: number) => {
    onChange({ ...button, actions: button.actions.filter((_, i) => i !== idx) });
  };

  return (
    <div className="question-btn-item">
      <div className="question-btn-header">
        <input
          className="question-btn-label-input"
          placeholder="Button label"
          value={button.label}
          onChange={(e) => onChange({ ...button, label: e.target.value })}
        />
        <input
          style={{ width: 36, padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 16, textAlign: 'center', background: 'var(--surface)', outline: 'none' }}
          placeholder="🎯"
          value={button.icon ?? ''}
          onChange={(e) => onChange({ ...button, icon: e.target.value })}
          title="Optional emoji icon"
          maxLength={2}
        />
        <button className="btn-icon danger" onClick={onRemove}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="sub-actions">
        <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>ACTIONS</div>
        {button.actions.map((action, idx) => (
          <MiniActionRow
            key={action.id}
            action={action}
            onChange={(a) => updateAction(idx, a)}
            onRemove={() => removeAction(idx)}
          />
        ))}
        <button className="add-btn" onClick={addAction} style={{ marginTop: 4 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add action
        </button>
      </div>
    </div>
  );
}

function MiniActionRow({
  action,
  onChange,
  onRemove,
}: {
  action: Action;
  onChange: (a: Action) => void;
  onRemove: () => void;
}) {
  const p = action.params as Record<string, unknown>;

  const changeType = (type: ActionType) => {
    onChange({ ...action, type, params: defaultActionParams(type) as never });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
      <div style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 8px' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="condition-type-select"
            value={action.type}
            onChange={(e) => changeType(e.target.value as ActionType)}
          >
            {SIMPLE_ACTION_TYPES.map((t) => (
              <option key={t} value={t}>{actionTypeLabel(t)}</option>
            ))}
          </select>

          {action.type === 'notification' && (
            <input
              className="condition-param-input"
              placeholder="Message…"
              value={p.message as string}
              onChange={(e) => onChange({ ...action, params: { ...p, message: e.target.value } as never })}
              style={{ flex: 1 }}
            />
          )}
          {action.type === 'open_url' && (
            <input
              className="condition-param-input"
              placeholder="https://"
              value={p.url as string}
              onChange={(e) => onChange({ ...action, params: { ...p, url: e.target.value } as never })}
              style={{ flex: 1 }}
            />
          )}
          {action.type === 'snooze' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                className="inline-num"
                min={1}
                value={p.minutes as number}
                onChange={(e) => onChange({ ...action, params: { ...p, minutes: Number(e.target.value) } as never })}
              />
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>min</span>
            </div>
          )}
          {action.type === 'play_sound' && (
            <select
              className="condition-type-select"
              value={p.sound as string}
              onChange={(e) => onChange({ ...action, params: { ...p, sound: e.target.value } as never })}
            >
              <option value="gentle">Gentle</option>
              <option value="chime">Chime</option>
              <option value="bell">Bell</option>
              <option value="soft_ping">Soft ping</option>
            </select>
          )}
        </div>
      </div>
      <button className="btn-icon danger" onClick={onRemove} style={{ marginTop: 2 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
