const DEFAULTS = {
  mayaUrl: 'https://my-day-lovat.vercel.app',
  driftThresholdMinutes: 5,
  checkIntervalSeconds: 30,
  enabled: true,
  allowedDomains: [
    'notion.so',
    'app.notion.com',
    'vercel.com',
    'github.com',
    'chat.openai.com',
    'chatgpt.com',
    'claude.ai',
    'docs.google.com',
    'drive.google.com',
    'canva.com',
    'figma.com',
    'linkedin.com',
    'upwork.com',
  ],
  blockedDomains: [
    'youtube.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'reddit.com',
    'facebook.com',
    'twitch.tv',
    'netflix.com',
    'primevideo.com',
    'hotstar.com',
  ],
};

let state = {
  currentDomain: null,
  domainStartTime: null,
  lastNudgeTime: null,
  activeCommitment: null,
  lastCommitmentFetch: null,
};

async function getSettings() {
  const result = await chrome.storage.local.get('settings');
  return { ...DEFAULTS, ...(result.settings || {}) };
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isInternalPage(url) {
  return !url || url.startsWith('chrome://') || url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') || url.startsWith('about:') || url.startsWith('devtools://');
}

async function fetchActiveCommitment(mayaUrl) {
  const now = Date.now();
  if (state.activeCommitment && state.lastCommitmentFetch &&
      now - state.lastCommitmentFetch < 60000) {
    return state.activeCommitment;
  }

  try {
    const res = await fetch(`${mayaUrl}/status`);
    if (!res.ok) return null;
    const data = await res.json();
    state.activeCommitment = data.commitment || data.active || null;
    state.lastCommitmentFetch = now;
    return state.activeCommitment;
  } catch {
    return state.activeCommitment;
  }
}

function isDomainAllowed(domain, settings) {
  return settings.allowedDomains.some(d => domain === d || domain.endsWith('.' + d));
}

function isDomainBlocked(domain, settings) {
  return settings.blockedDomains.some(d => domain === d || domain.endsWith('.' + d));
}

async function checkDrift() {
  const settings = await getSettings();
  if (!settings.enabled) return;

  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url || isInternalPage(tab.url)) return;

  const domain = extractDomain(tab.url);
  if (!domain) return;

  if (domain !== state.currentDomain) {
    state.currentDomain = domain;
    state.domainStartTime = Date.now();
    state.lastNudgeTime = null;
    return;
  }

  if (isDomainAllowed(domain, settings)) return;

  const minutesOnDomain = (Date.now() - state.domainStartTime) / 60000;
  if (minutesOnDomain < settings.driftThresholdMinutes) return;

  if (state.lastNudgeTime && Date.now() - state.lastNudgeTime < settings.driftThresholdMinutes * 60000) return;

  const commitment = await fetchActiveCommitment(settings.mayaUrl);
  const isBlocked = isDomainBlocked(domain, settings);

  let title, message;

  if (isBlocked) {
    title = 'Drift detected';
    message = commitment
      ? `You've been on ${domain} for ${Math.round(minutesOnDomain)} min. Your active commitment is "${commitment}". Is this helping?`
      : `You've been on ${domain} for ${Math.round(minutesOnDomain)} min. Is this what you should be doing right now?`;
  } else {
    title = 'Still here?';
    message = commitment
      ? `${Math.round(minutesOnDomain)} min on ${domain}. Active commitment: "${commitment}". Related or drifting?`
      : `${Math.round(minutesOnDomain)} min on ${domain}. Intentional?`;
  }

  chrome.notifications.create(`nudge-${Date.now()}`, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: isBlocked ? 2 : 1,
    requireInteraction: isBlocked,
  });

  state.lastNudgeTime = Date.now();

  try {
    await chrome.storage.local.set({
      lastDrift: { domain, minutes: Math.round(minutesOnDomain), commitment, time: new Date().toISOString() }
    });
  } catch {}
}

chrome.alarms.create('drift-check', { periodInMinutes: 0.5 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'drift-check') checkDrift();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !isInternalPage(tab.url)) {
      const domain = extractDomain(tab.url);
      if (domain !== state.currentDomain) {
        state.currentDomain = domain;
        state.domainStartTime = Date.now();
        state.lastNudgeTime = null;
      }
    }
  } catch {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active && !isInternalPage(changeInfo.url)) {
    const domain = extractDomain(changeInfo.url);
    if (domain !== state.currentDomain) {
      state.currentDomain = domain;
      state.domainStartTime = Date.now();
      state.lastNudgeTime = null;
    }
  }
});

chrome.idle.onStateChanged.addListener((idleState) => {
  if (idleState === 'active') {
    state.domainStartTime = Date.now();
    state.lastNudgeTime = null;
  }
});

chrome.idle.setDetectionInterval(300);
