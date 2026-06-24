import React, { useRef } from 'react';
import type { Action, ActionType, Question, QuestionButton } from '../types';
import { generateId } from '../storage';
import { actionTypeLabel } from '../utils/helpers';
import QuestionBuilder from './QuestionBuilder';

interface Props {
  actions: Action[];
  onChange: (actions: Action[]) => void;
}

const ALL_ACTION_TYPES: ActionType[] = [
  'notification',
  'play_sound',
  'open_url',
  'close_tab',
  'flash_window',
  'copy_text',
  'snooze',
  'ask_question',
];

function defaultParams(type: ActionType): Record<string, unknown> {
  switch (type) {
    case 'notification':
      return { title: 'Nudge', message: '' };
    case 'play_sound':
      return { sound: 'gentle' };
    case 'open_url':
      return { url: 'https://' };
    case 'close_tab':
      return {};
    case 'flash_window':
      return {};
    case 'copy_text':
      return { text: '' };
    case 'snooze':
      return { minutes: 20 };
    case 'ask_question':
      return {
        question: {
          text: '',
          buttons: [
            { id: generateId(), label: 'Yes', icon: '✓', actions: [] },
            { id: generateId(), label: 'No', icon: '✕', actions: [] },
          ] as QuestionButton[],
        } as Question,
      };
    default:
      return {};
  }
}

export default function ActionBuilder({ actions, onChange }: Props) {
  const dragIdx = useRef<number | null>(null);

  const addAction = () => {
    const action: Action = {
      id: generateId(),
      type: 'notification',
      params: defaultParams('notification') as never,
    };
    onChange([...actions, action]);
  };

  const update = (idx: number, action: Action) => {
    const next = [...actions];
    next[idx] = action;
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(actions.filter((_, i) => i !== idx));
  };

  const changeType = (idx: number, type: ActionType) => {
    update(idx, { ...actions[idx], type, params: defaultParams(type) as never });
  };

  // Simple drag-to-reorder
  const onDragStart = (idx: number) => {
    dragIdx.current = idx;
  };
  const onDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx.current === null || dragIdx.current === idx) return;
    const next = [...actions];
    const [dragged] = next.splice(dragIdx.current, 1);
    next.splice(idx, 0, dragged);
    dragIdx.current = idx;
    onChange(next);
  };
  const onDragEnd = () => { dragIdx.current = null; };

  return (
    <div>
      {actions.map((action, idx) => (
        <div
          key={action.id}
          className="action-item"
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragOver={(e) => onDragOver(e, idx)}
          onDragEnd={onDragEnd}
        >
          {/* Drag handle */}
          <div className="drag-handle" title="Drag to reorder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <circle cx="3" cy="6" r="1" fill="currentColor" stroke="none" />
              <circle cx="3" cy="12" r="1" fill="currentColor" stroke="none" />
              <circle cx="3" cy="18" r="1" fill="currentColor" stroke="none" />
            </svg>
          </div>

          <div className="action-body">
            <div className="action-row">
              <select
                className="action-type-select"
                value={action.type}
                onChange={(e) => changeType(idx, e.target.value as ActionType)}
              >
                {ALL_ACTION_TYPES.map((t) => (
                  <option key={t} value={t}>{actionTypeLabel(t)}</option>
                ))}
              </select>
            </div>

            <ActionParamEditor
              action={action}
              onChange={(a) => update(idx, a)}
            />
          </div>

          <button className="btn-icon danger" onClick={() => remove(idx)} title="Remove">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}

      <button className="add-btn" onClick={addAction}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add action
      </button>
    </div>
  );
}

// ─── Action param editor ──────────────────────────────────────────────────────

function ActionParamEditor({
  action,
  onChange,
}: {
  action: Action;
  onChange: (a: Action) => void;
}) {
  const p = action.params as Record<string, unknown>;
  const set = (partial: Record<string, unknown>) =>
    onChange({ ...action, params: { ...p, ...partial } as never });

  switch (action.type) {
    case 'notification':
      return (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            className="form-input"
            placeholder="Title"
            value={p.title as string}
            onChange={(e) => set({ title: e.target.value })}
          />
          <textarea
            className="form-textarea"
            placeholder="Message…"
            value={p.message as string}
            onChange={(e) => set({ message: e.target.value })}
            rows={2}
            style={{ minHeight: 50 }}
          />
        </div>
      );

    case 'play_sound':
      return (
        <div style={{ marginTop: 8 }}>
          <select
            className="form-select"
            value={p.sound as string}
            onChange={(e) => set({ sound: e.target.value })}
          >
            <option value="gentle">Gentle chime</option>
            <option value="chime">Rising chime</option>
            <option value="bell">Bell</option>
            <option value="soft_ping">Soft ping</option>
          </select>
        </div>
      );

    case 'open_url':
      return (
        <div style={{ marginTop: 8 }}>
          <input
            className="form-input"
            placeholder="https://example.com"
            value={p.url as string}
            onChange={(e) => set({ url: e.target.value })}
          />
        </div>
      );

    case 'close_tab':
    case 'flash_window':
      return (
        <div style={{ marginTop: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {action.type === 'close_tab' ? 'Closes the currently active tab.' : 'Flashes the browser window to draw attention.'}
          </span>
        </div>
      );

    case 'copy_text':
      return (
        <div style={{ marginTop: 8 }}>
          <textarea
            className="form-textarea"
            placeholder="Text to copy to clipboard…"
            value={p.text as string}
            onChange={(e) => set({ text: e.target.value })}
            rows={2}
            style={{ minHeight: 50 }}
          />
        </div>
      );

    case 'snooze':
      return (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            className="inline-num"
            min={1}
            max={1440}
            value={p.minutes as number}
            onChange={(e) => set({ minutes: Number(e.target.value) })}
          />
          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>minutes</span>
        </div>
      );

    case 'ask_question': {
      const q = (p.question as Question) ?? { text: '', buttons: [] };
      return (
        <div style={{ marginTop: 8 }}>
          <QuestionBuilder
            question={q}
            onChange={(updated) => set({ question: updated })}
          />
        </div>
      );
    }

    default:
      return null;
  }
}
