import type { Condition, Action, ConditionType, ActionType, RepeatConfig } from '../types';

export function extractDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export function formatTime(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatSeconds(sec: number): string {
  return formatTime(sec * 1000);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function conditionLabel(c: Condition): string {
  switch (c.type) {
    case 'website': {
      const p = c.params as { domains: string[] };
      return `Website is ${p.domains.join(' or ')}`;
    }
    case 'time_spent': {
      const p = c.params as { minutes: number };
      return `Time on site ≥ ${p.minutes} min`;
    }
    case 'current_time': {
      const p = c.params as { time: string };
      return `Time is ${p.time}`;
    }
    case 'day_of_week': {
      const p = c.params as { days: number[] };
      const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      if (JSON.stringify(p.days.sort()) === JSON.stringify([1, 2, 3, 4, 5]))
        return 'Day is Weekday';
      if (JSON.stringify(p.days.sort()) === JSON.stringify([0, 6]))
        return 'Day is Weekend';
      return `Day is ${p.days.map((d) => names[d]).join(', ')}`;
    }
    case 'idle_time':
    case 'keyboard_idle':
    case 'mouse_idle': {
      const p = c.params as { minutes: number };
      const label =
        c.type === 'idle_time'
          ? 'Idle'
          : c.type === 'keyboard_idle'
          ? 'Keyboard idle'
          : 'Mouse idle';
      return `${label} ≥ ${p.minutes} min`;
    }
    default:
      return 'Unknown condition';
  }
}

export function actionLabel(a: Action): string {
  switch (a.type) {
    case 'notification': {
      const p = a.params as { title: string; message: string };
      return `Notify: "${p.title || p.message}"`;
    }
    case 'play_sound': {
      const p = a.params as { sound: string };
      return `Play ${p.sound} sound`;
    }
    case 'open_url': {
      const p = a.params as { url: string };
      return `Open ${p.url}`;
    }
    case 'close_tab':
      return 'Close active tab';
    case 'flash_window':
      return 'Flash browser window';
    case 'copy_text': {
      const p = a.params as { text: string };
      return `Copy "${p.text.slice(0, 30)}${p.text.length > 30 ? '…' : ''}"`;
    }
    case 'snooze': {
      const p = a.params as { minutes: number };
      return `Snooze ${p.minutes} min`;
    }
    case 'ask_question': {
      const p = a.params as { question: { text: string } };
      return `Ask: "${p.question.text}"`;
    }
    default:
      return 'Unknown action';
  }
}

export function repeatLabel(r: RepeatConfig): string {
  switch (r.type) {
    case 'never':
      return 'Once';
    case 'interval':
      return `Every ${r.intervalMinutes} min`;
    case 'hourly':
      return 'Every hour';
    case 'daily':
      return 'Daily';
    case 'weekdays':
      return 'Weekdays only';
    case 'custom':
      return `Every ${r.intervalMinutes} min`;
    default:
      return 'Unknown';
  }
}

export function nudgeSummary(conditions: Condition[], operator: 'AND' | 'OR'): string {
  if (conditions.length === 0) return 'No conditions';
  return conditions.map(conditionLabel).join(` ${operator} `);
}

export function conditionTypeLabel(type: ConditionType): string {
  const map: Record<ConditionType, string> = {
    website: 'Active website',
    time_spent: 'Time on site',
    current_time: 'Current time',
    day_of_week: 'Day of week',
    idle_time: 'Idle time',
    keyboard_idle: 'Keyboard idle',
    mouse_idle: 'Mouse idle',
  };
  return map[type] ?? type;
}

export function actionTypeLabel(type: ActionType): string {
  const map: Record<ActionType, string> = {
    notification: 'Desktop notification',
    play_sound: 'Play sound',
    open_url: 'Open URL',
    close_tab: 'Close active tab',
    flash_window: 'Flash window',
    copy_text: 'Copy text',
    snooze: 'Snooze',
    ask_question: 'Ask a question',
  };
  return map[type] ?? type;
}

export function timeAgo(ms?: number): string {
  if (!ms) return 'Never';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}
