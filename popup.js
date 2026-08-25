const DEFAULTS = {
  mayaUrl: 'https://my-day-lovat.vercel.app',
  driftThresholdMinutes: 5,
  checkIntervalSeconds: 30,
  enabled: true,
  allowedDomains: [
    'notion.so', 'app.notion.com', 'vercel.com', 'github.com',
    'chat.openai.com', 'chatgpt.com', 'claude.ai',
    'docs.google.com', 'drive.google.com',
    'canva.com', 'figma.com', 'linkedin.com', 'upwork.com',
  ],
  blockedDomains: [
    'youtube.com', 'instagram.com', 'twitter.com', 'x.com',
    'reddit.com', 'facebook.com', 'twitch.tv',
    'netflix.com', 'primevideo.com', 'hotstar.com',
  ],
};

let settings = {};

async function load() {
  const result = await chrome.storage.local.get(['settings', 'lastDrift']);
  settings = { ...DEFAULTS, ...(result.settings || {}) };

  document.getElementById('enabled').checked = settings.enabled;
  document.getElementById('threshold').value = settings.driftThresholdMinutes;

  renderDomains('allowed-list', settings.allowedDomains, false);
  renderDomains('blocked-list', settings.blockedDomains, true);

  const drift = result.lastDrift;
  const statusEl = document.getElementById('status');
  if (drift) {
    const ago = Math.round((Date.now() - new Date(drift.time).getTime()) / 60000);
    statusEl.innerHTML = `<strong>Last drift:</strong> ${drift.domain} (${drift.minutes} min)`
      + (drift.commitment ? `<br><strong>Commitment:</strong> ${drift.commitment}` : '')
      + `<br><strong>When:</strong> ${ago < 60 ? ago + ' min ago' : Math.round(ago / 60) + ' hr ago'}`;
  } else {
    statusEl.textContent = 'No drift detected yet.';
  }
}

function renderDomains(containerId, domains, isBlocked) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  domains.forEach(d => {
    const chip = document.createElement('span');
    chip.className = 'chip' + (isBlocked ? ' blocked' : '');
    chip.innerHTML = `${d} <button data-domain="${d}">&times;</button>`;
    chip.querySelector('button').addEventListener('click', () => removeDomain(d, isBlocked));
    container.appendChild(chip);
  });
}

async function save() {
  await chrome.storage.local.set({ settings });
}

async function removeDomain(domain, isBlocked) {
  const key = isBlocked ? 'blockedDomains' : 'allowedDomains';
  settings[key] = settings[key].filter(d => d !== domain);
  await save();
  renderDomains(isBlocked ? 'blocked-list' : 'allowed-list', settings[key], isBlocked);
}

async function addDomain(inputId, isBlocked) {
  const input = document.getElementById(inputId);
  const domain = input.value.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
  if (!domain) return;

  const key = isBlocked ? 'blockedDomains' : 'allowedDomains';
  if (!settings[key].includes(domain)) {
    settings[key].push(domain);
    await save();
    renderDomains(isBlocked ? 'blocked-list' : 'allowed-list', settings[key], isBlocked);
  }
  input.value = '';
}

document.getElementById('enabled').addEventListener('change', async (e) => {
  settings.enabled = e.target.checked;
  await save();
});

document.getElementById('threshold').addEventListener('change', async (e) => {
  settings.driftThresholdMinutes = parseInt(e.target.value) || 5;
  await save();
});

document.getElementById('allowed-add').addEventListener('click', () => addDomain('allowed-input', false));
document.getElementById('allowed-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addDomain('allowed-input', false);
});

document.getElementById('blocked-add').addEventListener('click', () => addDomain('blocked-input', true));
document.getElementById('blocked-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addDomain('blocked-input', true);
});

load();
