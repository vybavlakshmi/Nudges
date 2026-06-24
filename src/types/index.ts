// ─── Conditions ──────────────────────────────────────────────────────────────

export type ConditionType =
  | 'website'
  | 'time_spent'
  | 'current_time'
  | 'day_of_week'
  | 'idle_time'
  | 'keyboard_idle'
  | 'mouse_idle';

export interface WebsiteParams {
  domains: string[]; // e.g. ['youtube.com', 'twitter.com']
}

export interface TimeSpentParams {
  minutes: number;
}

export interface CurrentTimeParams {
  time: string; // HH:MM (24-hour)
  toleranceMinutes?: number; // default 1
}

export interface DayOfWeekParams {
  days: number[]; // 0=Sun … 6=Sat  |  [1,2,3,4,5] = weekdays
}

export interface IdleTimeParams {
  minutes: number;
}

export type ConditionParams =
  | WebsiteParams
  | TimeSpentParams
  | CurrentTimeParams
  | DayOfWeekParams
  | IdleTimeParams;

export interface Condition {
  id: string;
  type: ConditionType;
  params: ConditionParams;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type ActionType =
  | 'notification'
  | 'play_sound'
  | 'open_url'
  | 'close_tab'
  | 'flash_window'
  | 'copy_text'
  | 'snooze'
  | 'ask_question';

export interface NotificationParams {
  title: string;
  message: string;
}

export type SoundName = 'gentle' | 'chime' | 'bell' | 'soft_ping';

export interface PlaySoundParams {
  sound: SoundName;
}

export interface OpenUrlParams {
  url: string;
}

export interface CloseTabParams {}
export interface FlashWindowParams {}

export interface CopyTextParams {
  text: string;
}

export interface SnoozeParams {
  minutes: number;
}

export interface AskQuestionParams {
  question: Question;
}

export type ActionParams =
  | NotificationParams
  | PlaySoundParams
  | OpenUrlParams
  | CloseTabParams
  | FlashWindowParams
  | CopyTextParams
  | SnoozeParams
  | AskQuestionParams;

export interface Action {
  id: string;
  type: ActionType;
  params: ActionParams;
}

// ─── Ask Question ─────────────────────────────────────────────────────────────

export interface Question {
  text: string;
  buttons: QuestionButton[];
}

export interface QuestionButton {
  id: string;
  label: string;
  icon?: string;
  actions: Action[];
}

// ─── Repeat ──────────────────────────────────────────────────────────────────

export type RepeatType = 'never' | 'interval' | 'hourly' | 'daily' | 'weekdays' | 'custom';

export interface RepeatConfig {
  type: RepeatType;
  intervalMinutes?: number;
}

// ─── Nudge ───────────────────────────────────────────────────────────────────

export interface NudgeStats {
  triggeredCount: number;
  acceptedCount: number;
  ignoredCount: number;
  snoozedCount: number;
  lastTriggered?: number; // Unix ms
}

export interface Nudge {
  id: string;
  name: string;
  enabled: boolean;
  conditions: Condition[];
  conditionOperator: 'AND' | 'OR';
  actions: Action[];
  repeat: RepeatConfig;
  stats: NudgeStats;
  snoozedUntil?: number; // Unix ms — skip triggering until this time
  lastCheckedTime?: string; // HH:MM — used for time-based dedup
  createdAt: number;
  updatedAt: number;
}

// ─── App Stats ───────────────────────────────────────────────────────────────

export interface DomainDay {
  [domain: string]: number; // seconds spent
}

export interface AppStats {
  domainTime: { [date: string]: DomainDay }; // date = YYYY-MM-DD
  totalNudgesTriggered: number;
  totalAccepted: number;
  totalIgnored: number;
  totalSnoozed: number;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AppSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  checkIntervalSeconds: number; // how often rule engine runs (default 30)
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface StorageData {
  nudges: Nudge[];
  stats: AppStats;
  settings: AppSettings;
  // runtime state
  activeTabDomain?: string;
  domainSessionStart?: number; // Unix ms
  continuousSeconds?: number; // seconds on current domain this session
}

// ─── Rule Engine State ────────────────────────────────────────────────────────

export interface EngineState {
  currentDomain: string;
  continuousSeconds: number; // seconds on this domain continuously
  currentTime: string; // HH:MM
  dayOfWeek: number; // 0–6
  idleSeconds: number;
}
