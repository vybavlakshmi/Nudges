import React, { useState, useMemo } from 'react';
import type { Nudge } from '../../types';
import { getNudges, saveNudges, generateId } from '../../storage';
import { nudgeSummary, actionLabel, repeatLabel, timeAgo } from '../../utils/helpers';
import NudgeCard from '../../components/NudgeCard';

interface Props {
  nudges: Nudge[];
  onNewNudge: () => void;
  onEdit: (nudge: Nudge) => void;
  onChange: () => void;
  showToast: (msg: string) => void;
}

type Filter = 'all' | 'enabled' | 'disabled';
type Sort = 'name' | 'recent' | 'triggered';

export default function Home({ nudges, onNewNudge, onEdit, onChange, showToast }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const filtered = useMemo(() => {
    let result = nudges.slice();

    if (filter === 'enabled') result = result.filter((n) => n.enabled);
    if (filter === 'disabled') result = result.filter((n) => !n.enabled);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          nudgeSummary(n.conditions, n.conditionOperator).toLowerCase().includes(q),
      );
    }

    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'recent')
      result.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
    else if (sort === 'triggered')
      result.sort((a, b) => (b.stats.lastTriggered ?? 0) - (a.stats.lastTriggered ?? 0));

    return result;
  }, [nudges, search, filter, sort]);

  const handleToggle = async (nudge: Nudge) => {
    const all = await getNudges();
    const n = all.find((x) => x.id === nudge.id);
    if (n) {
      n.enabled = !n.enabled;
      n.updatedAt = Date.now();
      await saveNudges(all);
      onChange();
    }
  };

  const handleDuplicate = async (nudge: Nudge) => {
    const all = await getNudges();
    const copy: Nudge = {
      ...JSON.parse(JSON.stringify(nudge)),
      id: generateId(),
      name: nudge.name + ' (copy)',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      stats: { triggeredCount: 0, acceptedCount: 0, ignoredCount: 0, snoozedCount: 0 },
    };
    all.push(copy);
    await saveNudges(all);
    onChange();
    showToast('Nudge duplicated');
  };

  const handleDelete = async (nudge: Nudge) => {
    if (!confirm(`Delete "${nudge.name}"?`)) return;
    const all = await getNudges();
    await saveNudges(all.filter((n) => n.id !== nudge.id));
    onChange();
    showToast('Nudge deleted');
  };

  return (
    <div className="fade-in">
      {/* New Nudge CTA */}
      <button className="new-nudge-btn" onClick={onNewNudge}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Nudge
      </button>

      {/* Search + filters */}
      <div className="search-row">
        <div className="search-input-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Search nudges…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
          <option value="all">All</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
        <select className="filter-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="recent">Recent</option>
          <option value="name">Name</option>
          <option value="triggered">Triggered</option>
        </select>
      </div>

      {/* Nudge list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <h3>{nudges.length === 0 ? 'No nudges yet' : 'Nothing matches'}</h3>
          <p>
            {nudges.length === 0
              ? 'Create your first nudge to gently guide your browser habits.'
              : 'Try a different search or filter.'}
          </p>
          {nudges.length === 0 && (
            <button className="btn btn-primary" onClick={onNewNudge}>
              Create your first nudge
            </button>
          )}
        </div>
      ) : (
        <div className="nudge-list">
          {filtered.map((nudge) => (
            <NudgeCard
              key={nudge.id}
              nudge={nudge}
              onToggle={() => handleToggle(nudge)}
              onEdit={() => onEdit(nudge)}
              onDuplicate={() => handleDuplicate(nudge)}
              onDelete={() => handleDelete(nudge)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
