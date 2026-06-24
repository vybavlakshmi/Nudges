import type { Nudge } from '../types';
import { generateId } from '../storage';

export function createSampleNudges(): Nudge[] {
  const now = Date.now();
  const emptyStats = () => ({
    triggeredCount: 0,
    acceptedCount: 0,
    ignoredCount: 0,
    snoozedCount: 0,
  });

  return [
    // 1. Claude Research Reminder
    {
      id: generateId(),
      name: 'Claude Research Reminder',
      enabled: true,
      conditionOperator: 'AND',
      conditions: [
        {
          id: generateId(),
          type: 'website',
          params: { domains: ['claude.ai'] },
        },
        {
          id: generateId(),
          type: 'time_spent',
          params: { minutes: 20 },
        },
      ],
      actions: [
        {
          id: generateId(),
          type: 'ask_question',
          params: {
            question: {
              text: 'Brand work pending.\nYou can research later.',
              buttons: [
                {
                  id: generateId(),
                  label: 'Open Notion',
                  icon: '📝',
                  actions: [
                    {
                      id: generateId(),
                      type: 'open_url',
                      params: { url: 'https://notion.so' },
                    },
                  ],
                },
                {
                  id: generateId(),
                  label: 'Snooze 20 min',
                  icon: '⏰',
                  actions: [
                    {
                      id: generateId(),
                      type: 'snooze',
                      params: { minutes: 20 },
                    },
                  ],
                },
                {
                  id: generateId(),
                  label: 'Ignore',
                  icon: '✕',
                  actions: [],
                },
              ],
            },
          },
        },
      ],
      repeat: { type: 'interval', intervalMinutes: 20 },
      stats: emptyStats(),
      createdAt: now,
      updatedAt: now,
    },

    // 2. ChatGPT Check
    {
      id: generateId(),
      name: 'ChatGPT Check',
      enabled: true,
      conditionOperator: 'AND',
      conditions: [
        {
          id: generateId(),
          type: 'website',
          params: { domains: ['chatgpt.com'] },
        },
        {
          id: generateId(),
          type: 'time_spent',
          params: { minutes: 20 },
        },
      ],
      actions: [
        {
          id: generateId(),
          type: 'ask_question',
          params: {
            question: {
              text: 'Is it brand work?',
              buttons: [
                {
                  id: generateId(),
                  label: 'Yes',
                  icon: '✓',
                  actions: [
                    {
                      id: generateId(),
                      type: 'snooze',
                      params: { minutes: 20 },
                    },
                  ],
                },
                {
                  id: generateId(),
                  label: 'No',
                  icon: '✕',
                  actions: [
                    {
                      id: generateId(),
                      type: 'close_tab',
                      params: {},
                    },
                    {
                      id: generateId(),
                      type: 'open_url',
                      params: { url: 'https://notion.so' },
                    },
                    {
                      id: generateId(),
                      type: 'notification',
                      params: {
                        title: 'Capture first',
                        message: 'Capture before consuming more.',
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
      repeat: { type: 'interval', intervalMinutes: 20 },
      stats: emptyStats(),
      createdAt: now,
      updatedAt: now,
    },

    // 3. Idle Reminder
    {
      id: generateId(),
      name: 'Idle Reminder',
      enabled: true,
      conditionOperator: 'AND',
      conditions: [
        {
          id: generateId(),
          type: 'keyboard_idle',
          params: { minutes: 5 },
        },
        {
          id: generateId(),
          type: 'mouse_idle',
          params: { minutes: 5 },
        },
      ],
      actions: [
        {
          id: generateId(),
          type: 'play_sound',
          params: { sound: 'gentle' },
        },
        {
          id: generateId(),
          type: 'notification',
          params: {
            title: 'Hey there',
            message: 'Back to work.',
          },
        },
      ],
      repeat: { type: 'interval', intervalMinutes: 10 },
      stats: emptyStats(),
      createdAt: now,
      updatedAt: now,
    },

    // 4. Mail Reminder
    {
      id: generateId(),
      name: 'Mail Reminder',
      enabled: true,
      conditionOperator: 'AND',
      conditions: [
        {
          id: generateId(),
          type: 'current_time',
          params: { time: '16:00', toleranceMinutes: 2 },
        },
      ],
      actions: [
        {
          id: generateId(),
          type: 'notification',
          params: {
            title: 'Mail time',
            message: 'Read mails.',
          },
        },
      ],
      repeat: { type: 'daily' },
      stats: emptyStats(),
      createdAt: now,
      updatedAt: now,
    },

    // 5. Saturday Reports
    {
      id: generateId(),
      name: 'Saturday Reports',
      enabled: true,
      conditionOperator: 'AND',
      conditions: [
        {
          id: generateId(),
          type: 'day_of_week',
          params: { days: [6] }, // Saturday
        },
        {
          id: generateId(),
          type: 'current_time',
          params: { time: '17:00', toleranceMinutes: 2 },
        },
      ],
      actions: [
        {
          id: generateId(),
          type: 'notification',
          params: {
            title: 'Weekly reports',
            message: 'Reports of handles.',
          },
        },
      ],
      repeat: { type: 'weekdays' },
      stats: emptyStats(),
      createdAt: now,
      updatedAt: now,
    },
  ];
}
