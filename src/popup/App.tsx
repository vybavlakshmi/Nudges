import React, { useState, useEffect, useCallback } from 'react';
import type { Nudge } from '../types';
import { getNudges, saveNudges } from '../storage';
import Home from './pages/Home';
import Statistics from './pages/Statistics';
import NudgeBuilder from './pages/NudgeBuilder';

type Tab = 'home' | 'stats' | 'settings';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [editingNudge, setEditingNudge] = useState<Nudge | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    getNudges().then(setNudges);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }, []);

  const reload = useCallback(async () => {
    const updated = await getNudges();
    setNudges(updated);
  }, []);

  const openBuilder = useCallback((nudge?: Nudge) => {
    setEditingNudge(nudge ?? null);
    setIsBuilderOpen(true);
  }, []);

  const closeBuilder = useCallback(() => {
    setIsBuilderOpen(false);
    setEditingNudge(null);
    reload();
  }, [reload]);

  const handleSave = useCallback(async (nudge: Nudge) => {
    const all = await getNudges();
    const idx = all.findIndex((n) => n.id === nudge.id);
    if (idx >= 0) all[idx] = nudge;
    else all.push(nudge);
    await saveNudges(all);
    setNudges(all);
    closeBuilder();
    showToast('Nudge saved');
  }, [closeBuilder, showToast]);

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
          <h1>Nudges</h1>
        </div>
        <span className="header-badge">{nudges.filter(n => n.enabled).length} active</span>
      </header>

      {/* Tab bar */}
      <nav className="nav">
        <button className={`nav-tab ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          Nudges
        </button>
        <button className={`nav-tab ${tab === 'stats' ? 'active' : ''}`} onClick={() => setTab('stats')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Statistics
        </button>
        <button className={`nav-tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Settings
        </button>
      </nav>

      {/* Page content */}
      <div className="page">
        {tab === 'home' && (
          <Home
            nudges={nudges}
            onNewNudge={() => openBuilder()}
            onEdit={openBuilder}
            onChange={reload}
            showToast={showToast}
          />
        )}
        {tab === 'stats' && <Statistics nudges={nudges} />}
        {tab === 'settings' && <SettingsPage showToast={showToast} />}
      </div>

      {/* Builder overlay */}
      {isBuilderOpen && (
        <NudgeBuilder
          nudge={editingNudge}
          onSave={handleSave}
          onCancel={closeBuilder}
        />
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ─── Settings Page (inline) ───────────────────────────────────────────────────

function SettingsPage({ showToast }: { showToast: (m: string) => void }) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [interval, setInterval] = useState(30);

  useEffect(() => {
    import('../storage').then(({ getSettings }) => {
      getSettings().then((s) => {
        setSoundEnabled(s.soundEnabled);
        setNotifEnabled(s.notificationsEnabled);
        setInterval(s.checkIntervalSeconds);
      });
    });
  }, []);

  const save = async () => {
    const { saveSettings } = await import('../storage');
    await saveSettings({ soundEnabled, notificationsEnabled: notifEnabled, checkIntervalSeconds: interval });
    chrome.runtime.sendMessage({ type: 'RELOAD_ALARM' });
    showToast('Settings saved');
  };

  const exportNudges = async () => {
    const { getNudges } = await import('../storage');
    const nudges = await getNudges();
    const blob = new Blob([JSON.stringify(nudges, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nudges-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Nudges exported');
  };

  const importNudges = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) throw new Error('Invalid format');
        const { getNudges, saveNudges } = await import('../storage');
        const existing = await getNudges();
        const merged = [...existing];
        for (const n of imported) {
          if (!merged.find((m) => m.id === n.id)) merged.push(n);
        }
        await saveNudges(merged);
        showToast(`Imported ${imported.length} nudge(s)`);
      } catch {
        showToast('Import failed — invalid file');
      }
    };
    input.click();
  };

  return (
    <div className="fade-in">
      <div className="section-label">General</div>
      <div className="builder-section">
        <div className="settings-row">
          <div className="settings-row-text">
            <div className="settings-row-label">Sound notifications</div>
            <div className="settings-row-desc">Play gentle sounds when nudges fire</div>
          </div>
          <Toggle checked={soundEnabled} onChange={setSoundEnabled} />
        </div>
        <div className="settings-row">
          <div className="settings-row-text">
            <div className="settings-row-label">Desktop notifications</div>
            <div className="settings-row-desc">Show browser notifications</div>
          </div>
          <Toggle checked={notifEnabled} onChange={setNotifEnabled} />
        </div>
        <div className="settings-row">
          <div className="settings-row-text">
            <div className="settings-row-label">Check interval</div>
            <div className="settings-row-desc">How often nudge conditions are evaluated</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="number"
              className="inline-num"
              value={interval}
              min={10}
              max={300}
              onChange={(e) => setInterval(Number(e.target.value))}
            />
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>sec</span>
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={save} style={{ marginBottom: 12 }}>
        Save settings
      </button>

      <div className="section-label">Data</div>
      <div className="builder-section">
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={exportNudges}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export Nudges
          </button>
          <button className="btn btn-secondary" style={{ flex: 1 }} onClick={importNudges}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Import Nudges
          </button>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 16 }}>About</div>
      <div className="builder-section">
        <p style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.7 }}>
          <strong>Nudges</strong> is a calm browser companion that gently interrupts you with
          configurable reminders — never a blocker, always a gentle nudge.
          <br /><br />
          Version 1.0.0
        </p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" />
    </label>
  );
}
