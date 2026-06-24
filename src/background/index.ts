import { getNudges, saveNudges, getSettings, setRuntimeState } from '../storage';
import { createSampleNudges } from '../utils/sampleNudges';
import { tick, handleTabChange, getCurrentTabUrl } from './timeTracker';
import { shouldTrigger, buildEngineState } from './ruleEngine';
import { triggerNudge, handleNotificationButtonClick, handleNotificationClosed } from './notificationManager';
import { extractDomain } from '../utils/helpers';

const ALARM_NAME = 'nudge-tick';

// ─── Install / Startup ────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Seed with sample nudges on first install
    const existing = await getNudges();
    if (existing.length === 0) {
      const samples = createSampleNudges();
      await saveNudges(samples);
    }
  }
  await setupAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await setupAlarm();
  const url = await getCurrentTabUrl();
  if (url) await handleTabChange(url);
});

async function setupAlarm(): Promise<void> {
  const settings = await getSettings();
  const periodInMinutes = settings.checkIntervalSeconds / 60;
  chrome.alarms.clear(ALARM_NAME, () => {
    chrome.alarms.create(ALARM_NAME, {
      delayInMinutes: periodInMinutes,
      periodInMinutes,
    });
  });
}

// ─── Alarm Tick ───────────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;

  try {
    const { domain, continuousSeconds } = await tick();
    const state = await buildEngineState(domain, continuousSeconds);
    const nudges = await getNudges();

    // Evaluate each nudge
    const triggered: string[] = [];
    for (const nudge of nudges) {
      if (shouldTrigger(nudge, state)) {
        triggered.push(nudge.id);
      }
    }

    // Fire triggered nudges
    const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });
    const tabId = tabs[0]?.id;

    for (const id of triggered) {
      const nudge = nudges.find((n) => n.id === id)!;
      await triggerNudge(nudge, tabId);
    }
  } catch (err) {
    console.error('[Nudges] Tick error:', err);
  }
});

// ─── Tab Events ───────────────────────────────────────────────────────────────

chrome.tabs.onActivated.addListener(async (info) => {
  try {
    const tab = await new Promise<chrome.tabs.Tab>((resolve) => {
      chrome.tabs.get(info.tabId, resolve);
    });
    await handleTabChange(tab.url);
  } catch {}
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  try {
    const activeTabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });
    if (activeTabs[0]?.id === tabId) {
      await handleTabChange(tab.url);
    }
  } catch {}
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    await setRuntimeState({ activeTabDomain: '', continuousSeconds: 0 });
    return;
  }
  const url = await getCurrentTabUrl();
  await handleTabChange(url);
});

// ─── Notification Events ──────────────────────────────────────────────────────

chrome.notifications.onButtonClicked.addListener((notifId, buttonIndex) => {
  handleNotificationButtonClick(notifId, buttonIndex);
});

chrome.notifications.onClosed.addListener((notifId, byUser) => {
  handleNotificationClosed(notifId, byUser);
});

// ─── Message Bridge (popup ↔ background) ─────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_DOMAIN_INFO') {
    getCurrentTabUrl()
      .then((url) => {
        sendResponse({ domain: extractDomain(url), url });
      })
      .catch(() => sendResponse({ domain: '', url: '' }));
    return true; // async
  }

  if (message.type === 'TRIGGER_NUDGE') {
    getNudges()
      .then(async (nudges) => {
        const nudge = nudges.find((n) => n.id === message.nudgeId);
        if (nudge) {
          await triggerNudge(nudge);
          sendResponse({ ok: true });
        } else {
          sendResponse({ ok: false });
        }
      })
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (message.type === 'RELOAD_ALARM') {
    setupAlarm().then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
});
