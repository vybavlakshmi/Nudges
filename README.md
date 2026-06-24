# Nudges

A calm, minimal Chrome Extension that gently reminds you of your intentions while you browse.

Nudges is **not** a website blocker or productivity timer. It's a browser companion — a gentle tap on the shoulder when you've been somewhere longer than you meant to be, or when it's time to switch tasks.

---

## Philosophy

Every automation is called a **Nudge**. Each Nudge has three parts:

- **IF** — conditions that trigger it (time on site, time of day, idle state, day of week…)
- **THEN** — actions to run (notification, question, sound, open URL, close tab…)
- **REPEAT** — how often it can fire again

The UX is inspired by Notion, Linear, and Arc Browser: lots of whitespace, subtle animations, clean typography, no guilt.

---

## Features

- **Nudge Builder** — create nudges through a clean form, no code
- **Unlimited conditions** — combine with AND / OR
- **Unlimited actions** — drag to reorder; supports notifications, questions with branching buttons, sounds, open URL, close tab, flash window, snooze, copy text
- **Ask Question** — buttons each have their own action chains
- **Statistics** — daily screen time per domain, nudge trigger history
- **Import / Export** — share nudge collections as JSON
- **Sample nudges** — 5 pre-built nudges installed on first run

---

## Installation

### Requirements

- Node.js 18+
- npm 9+

### Build

```bash
# 1. Clone or download this repository
cd Nudges

# 2. Install dependencies
npm install

# 3. Build the extension
npm run build

# 4. Load into Chrome
#    Open chrome://extensions
#    Enable "Developer mode" (top right)
#    Click "Load unpacked"
#    Select the /dist folder
```

### Development mode (auto-rebuild on save)

```bash
npm run dev
```

After each change, go to `chrome://extensions` and click the reload icon on the Nudges card.

---

## Project Structure

```
src/
  types/          TypeScript interfaces for all data models
  storage/        Chrome Storage API helpers
  utils/
    helpers.ts    Label formatters, time utilities
    sounds.ts     Web Audio API sound generator
    sampleNudges  5 built-in sample nudges
  background/
    index.ts          Service worker entry — tab events, alarms, messages
    ruleEngine.ts     Condition evaluator (modular, easy to extend)
    timeTracker.ts    Domain visit time tracking
    notificationManager.ts  Chrome Notifications + action execution
  popup/
    index.tsx     React entry point
    App.tsx       App shell, navigation, settings page
    styles.css    Complete design system (Notion-inspired)
    pages/
      Home.tsx        Nudge library — search, filter, sort
      NudgeBuilder.tsx  Full nudge creation / editing form
      Statistics.tsx    Dashboard — screen time, nudge stats
  components/
    NudgeCard.tsx       Card for library view
    ConditionBuilder.tsx  IF section editor
    ActionBuilder.tsx     THEN section editor with drag-to-reorder
    QuestionBuilder.tsx   Ask Question action editor
dist/             Built extension (load this folder in Chrome)
public/
  manifest.json   Chrome Manifest V3
  popup.html      Extension popup HTML shell
  icons/          16/32/48/128px PNG icons
```

---

## Adding New Conditions

1. Add a new `ConditionType` to `src/types/index.ts`
2. Add the evaluator function in `src/background/ruleEngine.ts`'s `evaluateCondition` switch
3. Add a label in `src/utils/helpers.ts` → `conditionTypeLabel`
4. Add a param editor in `src/components/ConditionBuilder.tsx` → `ConditionParams`

## Adding New Actions

1. Add a new `ActionType` to `src/types/index.ts`
2. Add execution logic in `src/background/notificationManager.ts` → `executeSingleAction`
3. Add a label in `src/utils/helpers.ts` → `actionTypeLabel`
4. Add a param editor in `src/components/ActionBuilder.tsx` → `ActionParamEditor`

---

## Sample Nudges (pre-installed)

| Name | IF | THEN | Repeat |
|------|-----|------|--------|
| Claude Research Reminder | claude.ai + 20 min | Ask question with Notion/Snooze/Ignore | Every 20 min |
| ChatGPT Check | chatgpt.com + 20 min | Is it brand work? YES→snooze, NO→close+Notion | Every 20 min |
| Idle Reminder | keyboard idle 5 min AND mouse idle 5 min | Play sound + notify | Every 10 min |
| Mail Reminder | Time is 4:00 PM | Notify: Read mails | Daily |
| Saturday Reports | Saturday AND 5:00 PM | Notify: Reports of handles | Weekly |

---

## Permissions Used

| Permission | Why |
|---|---|
| `tabs` | Detect active tab and domain |
| `storage` | Persist nudges, stats, settings |
| `notifications` | Show desktop notifications |
| `alarms` | Periodic condition evaluation |
| `idle` | Detect keyboard/mouse idle state |
| `windows` | Flash window attention |
| `clipboardWrite` | Copy text action |

---

## Tech Stack

- **Manifest V3** service worker
- **React 18** + **TypeScript** for the popup UI
- **Webpack 5** for bundling
- **Chrome Storage API** (local) for all persistence
- **Chrome Notifications API** with button support
- **Chrome Alarms API** for periodic evaluation
- **Web Audio API** for generated notification sounds (no audio files needed)

---

## License

MIT
