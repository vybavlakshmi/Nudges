import type { Nudge, AppStats, AppSettings, StorageData } from '../types';

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  notificationsEnabled: true,
  checkIntervalSeconds: 30,
};

const DEFAULT_STATS: AppStats = {
  domainTime: {},
  totalNudgesTriggered: 0,
  totalAccepted: 0,
  totalIgnored: 0,
  totalSnoozed: 0,
};

// ─── Low-level helpers ────────────────────────────────────────────────────────

function get<T>(keys: string[]): Promise<{ [key: string]: T }> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(result as { [key: string]: T });
    });
  });
}

function set(data: Partial<StorageData>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve();
    });
  });
}

// ─── Nudges ───────────────────────────────────────────────────────────────────

export async function getNudges(): Promise<Nudge[]> {
  const result = await get<Nudge[]>(['nudges']);
  return result['nudges'] ?? [];
}

export async function saveNudges(nudges: Nudge[]): Promise<void> {
  await set({ nudges });
}

export async function getNudgeById(id: string): Promise<Nudge | undefined> {
  const nudges = await getNudges();
  return nudges.find((n) => n.id === id);
}

export async function upsertNudge(nudge: Nudge): Promise<void> {
  const nudges = await getNudges();
  const idx = nudges.findIndex((n) => n.id === nudge.id);
  if (idx >= 0) nudges[idx] = nudge;
  else nudges.push(nudge);
  await saveNudges(nudges);
}

export async function deleteNudge(id: string): Promise<void> {
  const nudges = await getNudges();
  await saveNudges(nudges.filter((n) => n.id !== id));
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getStats(): Promise<AppStats> {
  const result = await get<AppStats>(['stats']);
  return result['stats'] ?? { ...DEFAULT_STATS };
}

export async function saveStats(stats: AppStats): Promise<void> {
  await set({ stats });
}

export async function recordDomainTime(domain: string, seconds: number): Promise<void> {
  if (!domain || seconds <= 0) return;
  const stats = await getStats();
  const date = todayKey();
  if (!stats.domainTime[date]) stats.domainTime[date] = {};
  stats.domainTime[date][domain] = (stats.domainTime[date][domain] ?? 0) + seconds;
  // Keep only last 30 days
  const keys = Object.keys(stats.domainTime).sort();
  while (keys.length > 30) {
    delete stats.domainTime[keys.shift()!];
  }
  await saveStats(stats);
}

export async function incrementNudgeStat(
  nudgeId: string,
  field: 'triggeredCount' | 'acceptedCount' | 'ignoredCount' | 'snoozedCount',
): Promise<void> {
  const nudges = await getNudges();
  const stats = await getStats();
  const nudge = nudges.find((n) => n.id === nudgeId);
  if (nudge) {
    nudge.stats[field] = (nudge.stats[field] ?? 0) + 1;
    if (field === 'triggeredCount') {
      nudge.stats.lastTriggered = Date.now();
    }
    await saveNudges(nudges);
  }
  if (field === 'triggeredCount') stats.totalNudgesTriggered++;
  else if (field === 'acceptedCount') stats.totalAccepted++;
  else if (field === 'ignoredCount') stats.totalIgnored++;
  else if (field === 'snoozedCount') stats.totalSnoozed++;
  await saveStats(stats);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AppSettings> {
  const result = await get<AppSettings>(['settings']);
  return { ...DEFAULT_SETTINGS, ...(result['settings'] ?? {}) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set({ settings });
}

// ─── Runtime state ────────────────────────────────────────────────────────────

export async function getRuntimeState(): Promise<{
  activeTabDomain: string;
  domainSessionStart: number;
  continuousSeconds: number;
}> {
  const result = await get(['activeTabDomain', 'domainSessionStart', 'continuousSeconds']);
  return {
    activeTabDomain: (result['activeTabDomain'] as string) ?? '',
    domainSessionStart: (result['domainSessionStart'] as number) ?? Date.now(),
    continuousSeconds: (result['continuousSeconds'] as number) ?? 0,
  };
}

export async function setRuntimeState(state: {
  activeTabDomain?: string;
  domainSessionStart?: number;
  continuousSeconds?: number;
}): Promise<void> {
  await set(state as Partial<StorageData>);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
