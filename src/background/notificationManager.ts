import type { Action, Nudge, NotificationParams, QuestionButton } from '../types';
import { getNudges, saveNudges, incrementNudgeStat } from '../storage';
import { closeTab, flashWindow } from './timeTracker';

// Pending question: nudge id → buttons
const pendingQuestions = new Map<string, { nudgeId: string; buttons: QuestionButton[] }>();

export async function executeActions(
  actions: Action[],
  nudgeId: string,
  tabId?: number,
): Promise<void> {
  for (const action of actions) {
    await executeSingleAction(action, nudgeId, tabId);
  }
}

async function executeSingleAction(
  action: Action,
  nudgeId: string,
  tabId?: number,
): Promise<void> {
  switch (action.type) {
    case 'notification': {
      const p = action.params as NotificationParams;
      showNotification(p.title, p.message, nudgeId);
      break;
    }

    case 'play_sound':
      // Sound can only play in extension pages (not service worker).
      // We send a message to the popup or use offscreen API approach.
      // For now, we use chrome.notifications which plays a default sound.
      break;

    case 'open_url': {
      const p = action.params as { url: string };
      chrome.tabs.create({ url: p.url });
      break;
    }

    case 'close_tab':
      await closeTab(tabId);
      break;

    case 'flash_window':
      await flashWindow();
      break;

    case 'copy_text': {
      // Copy is not available in service worker; notify instead
      const p = action.params as { text: string };
      showNotification('Text ready to copy', p.text, nudgeId);
      break;
    }

    case 'snooze': {
      const p = action.params as { minutes: number };
      const nudges = await getNudges();
      const nudge = nudges.find((n) => n.id === nudgeId);
      if (nudge) {
        nudge.snoozedUntil = Date.now() + p.minutes * 60_000;
        await saveNudges(nudges);
        await incrementNudgeStat(nudgeId, 'snoozedCount');
      }
      break;
    }

    case 'ask_question': {
      const p = action.params as { question: { text: string; buttons: QuestionButton[] } };
      await showQuestion(p.question.text, p.question.buttons, nudgeId);
      break;
    }
  }
}

function showNotification(title: string, message: string, nudgeId: string): void {
  const id = `nudge-${nudgeId}-${Date.now()}`;
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title,
    message,
    priority: 1,
    silent: false,
  });
}

async function showQuestion(
  text: string,
  buttons: QuestionButton[],
  nudgeId: string,
): Promise<void> {
  const notifId = `nudge-q-${nudgeId}-${Date.now()}`;

  // Chrome supports up to 2 buttons in notifications
  const btnItems = buttons.slice(0, 2).map((b) => ({ title: b.label }));

  chrome.notifications.create(notifId, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Nudge',
    message: text,
    buttons: btnItems,
    priority: 2,
    requireInteraction: true,
    silent: false,
  });

  pendingQuestions.set(notifId, { nudgeId, buttons });
}

// Handle notification button clicks
export function handleNotificationButtonClick(notifId: string, buttonIndex: number): void {
  const pending = pendingQuestions.get(notifId);
  if (!pending) return;

  const button = pending.buttons[buttonIndex];
  if (button) {
    executeActions(button.actions, pending.nudgeId).catch(console.error);
    if (button.actions.some((a) => a.type === 'snooze')) {
      // already handled in executeActions
    } else {
      incrementNudgeStat(pending.nudgeId, 'acceptedCount').catch(console.error);
    }
  }

  pendingQuestions.delete(notifId);
  chrome.notifications.clear(notifId);
}

export function handleNotificationClosed(notifId: string, byUser: boolean): void {
  if (!pendingQuestions.has(notifId)) return;
  const pending = pendingQuestions.get(notifId)!;
  if (byUser) {
    incrementNudgeStat(pending.nudgeId, 'ignoredCount').catch(console.error);
  }
  pendingQuestions.delete(notifId);
}

// Trigger a nudge: run all its actions
export async function triggerNudge(nudge: Nudge, tabId?: number): Promise<void> {
  await incrementNudgeStat(nudge.id, 'triggeredCount');
  await executeActions(nudge.actions, nudge.id, tabId);
}
