import { getRuntimeState, setRuntimeState, recordDomainTime } from '../storage';
import { extractDomain } from '../utils/helpers';

// Called when a tab becomes active or the URL changes
export async function handleTabChange(url: string | undefined): Promise<void> {
  const domain = url ? extractDomain(url) : '';
  const state = await getRuntimeState();

  // Flush time for the previous domain
  if (state.activeTabDomain && state.domainSessionStart) {
    const elapsed = Math.round((Date.now() - state.domainSessionStart) / 1000);
    if (elapsed > 0) {
      await recordDomainTime(state.activeTabDomain, elapsed);
    }
  }

  // Start tracking the new domain
  await setRuntimeState({
    activeTabDomain: domain,
    domainSessionStart: Date.now(),
    continuousSeconds: 0,
  });
}

// Called every tick (alarm). Returns seconds continuously on the current domain.
export async function tick(): Promise<{ domain: string; continuousSeconds: number }> {
  const state = await getRuntimeState();

  if (!state.activeTabDomain || !state.domainSessionStart) {
    return { domain: '', continuousSeconds: 0 };
  }

  const elapsed = Math.round((Date.now() - state.domainSessionStart) / 1000);
  const continuousSeconds = elapsed;

  // Record incremental domain time
  const TICK_SECONDS = 30;
  await recordDomainTime(state.activeTabDomain, TICK_SECONDS);

  return { domain: state.activeTabDomain, continuousSeconds };
}

// Get the current active tab's URL from the browser
export async function getCurrentTabUrl(): Promise<string> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]?.url ?? '');
    });
  });
}

export async function closeTab(tabId?: number): Promise<void> {
  if (tabId) {
    chrome.tabs.remove(tabId);
    return;
  }
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) chrome.tabs.remove(tabs[0].id);
  });
}

export async function flashWindow(): Promise<void> {
  chrome.windows.getCurrent((win) => {
    if (!win.id) return;
    // Draw attention by updating the window
    chrome.windows.update(win.id, { drawAttention: true });
  });
}
