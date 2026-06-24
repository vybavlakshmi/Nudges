import type {
  Nudge,
  Condition,
  EngineState,
  WebsiteParams,
  TimeSpentParams,
  CurrentTimeParams,
  DayOfWeekParams,
  IdleTimeParams,
} from '../types';

// ─── Condition Evaluators ─────────────────────────────────────────────────────

function evalWebsite(params: WebsiteParams, state: EngineState): boolean {
  return params.domains.some((d) => {
    const clean = d.replace(/^www\./, '').toLowerCase();
    const cur = state.currentDomain.toLowerCase();
    return cur === clean || cur.endsWith('.' + clean);
  });
}

function evalTimeSpent(params: TimeSpentParams, state: EngineState): boolean {
  return state.continuousSeconds >= params.minutes * 60;
}

function evalCurrentTime(params: CurrentTimeParams, state: EngineState): boolean {
  const tolerance = params.toleranceMinutes ?? 1;
  const [hh, mm] = params.time.split(':').map(Number);
  const target = hh * 60 + mm;
  const [ch, cm] = state.currentTime.split(':').map(Number);
  const current = ch * 60 + cm;
  return Math.abs(current - target) <= tolerance;
}

function evalDayOfWeek(params: DayOfWeekParams, state: EngineState): boolean {
  return params.days.includes(state.dayOfWeek);
}

function evalIdle(params: IdleTimeParams, state: EngineState): boolean {
  return state.idleSeconds >= params.minutes * 60;
}

function evaluateCondition(condition: Condition, state: EngineState): boolean {
  try {
    switch (condition.type) {
      case 'website':
        return evalWebsite(condition.params as WebsiteParams, state);
      case 'time_spent':
        return evalTimeSpent(condition.params as TimeSpentParams, state);
      case 'current_time':
        return evalCurrentTime(condition.params as CurrentTimeParams, state);
      case 'day_of_week':
        return evalDayOfWeek(condition.params as DayOfWeekParams, state);
      case 'idle_time':
      case 'keyboard_idle':
      case 'mouse_idle':
        return evalIdle(condition.params as IdleTimeParams, state);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ─── Nudge Evaluation ─────────────────────────────────────────────────────────

export function shouldTrigger(nudge: Nudge, state: EngineState): boolean {
  if (!nudge.enabled) return false;
  if (nudge.conditions.length === 0) return false;

  // Respect snooze
  if (nudge.snoozedUntil && Date.now() < nudge.snoozedUntil) return false;

  // Evaluate conditions
  const results = nudge.conditions.map((c) => evaluateCondition(c, state));
  const satisfied =
    nudge.conditionOperator === 'AND' ? results.every(Boolean) : results.some(Boolean);

  if (!satisfied) return false;

  // Cooldown: respect the repeat config to avoid re-triggering too fast
  if (!nudge.stats.lastTriggered) return true;

  const elapsed = Date.now() - nudge.stats.lastTriggered;
  const r = nudge.repeat;

  if (r.type === 'never') return false; // triggered once, never again
  if (r.type === 'interval' || r.type === 'custom') {
    return elapsed >= (r.intervalMinutes ?? 30) * 60_000;
  }
  if (r.type === 'hourly') return elapsed >= 3_600_000;
  if (r.type === 'daily') return elapsed >= 86_400_000;
  if (r.type === 'weekdays') {
    // Only trigger on weekdays, once per day
    const day = state.dayOfWeek;
    if (day === 0 || day === 6) return false;
    return elapsed >= 86_400_000;
  }

  return true;
}

// ─── Build Engine State ───────────────────────────────────────────────────────

export async function buildEngineState(
  domain: string,
  continuousSeconds: number,
): Promise<EngineState> {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');

  // Query idle state from chrome.idle
  let idleSeconds = 0;
  try {
    const idleState = await new Promise<chrome.idle.IdleState>((resolve) => {
      chrome.idle.queryState(60, resolve);
    });
    if (idleState === 'idle' || idleState === 'locked') {
      // Use a rough estimate: if idle, assume at least 5 min
      idleSeconds = 5 * 60;
    }
  } catch {
    idleSeconds = 0;
  }

  return {
    currentDomain: domain,
    continuousSeconds,
    currentTime: `${hh}:${mm}`,
    dayOfWeek: now.getDay(),
    idleSeconds,
  };
}
