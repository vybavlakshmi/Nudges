import React, { useEffect, useState } from 'react';
import type { Nudge, AppStats } from '../../types';
import { getStats } from '../../storage';
import { formatSeconds, last7Days, formatDate, todayISO } from '../../utils/helpers';

interface Props {
  nudges: Nudge[];
}

export default function Statistics({ nudges }: Props) {
  const [stats, setStats] = useState<AppStats | null>(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  const today = todayISO();
  const todayData = stats.domainTime[today] ?? {};
  const todayTotal = Object.values(todayData).reduce((a, b) => a + b, 0);

  const days = last7Days();
  const weekData = days.map((d) => {
    const total = Object.values(stats.domainTime[d] ?? {}).reduce((a, b) => a + b, 0);
    return { date: d, total };
  });
  const weekMax = Math.max(...weekData.map((d) => d.total), 1);

  // Top domains across all time
  const allDomains: Record<string, number> = {};
  for (const dayData of Object.values(stats.domainTime)) {
    for (const [domain, secs] of Object.entries(dayData)) {
      allDomains[domain] = (allDomains[domain] ?? 0) + secs;
    }
  }
  const topDomains = Object.entries(allDomains)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const topMax = Math.max(...topDomains.map((d) => d[1]), 1);

  // Most triggered nudges
  const sortedNudges = nudges
    .filter((n) => n.stats.triggeredCount > 0)
    .sort((a, b) => b.stats.triggeredCount - a.stats.triggeredCount)
    .slice(0, 5);

  return (
    <div className="fade-in">
      {/* Summary cards */}
      <div className="section-label">Overview</div>
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-value">{stats.totalNudgesTriggered}</div>
          <div className="stat-label">Nudges fired</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{formatSeconds(todayTotal)}</div>
          <div className="stat-label">Today's screen time</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalAccepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSnoozed}</div>
          <div className="stat-label">Snoozed</div>
        </div>
      </div>

      {/* Weekly chart */}
      <div className="section-label">Last 7 days — screen time</div>
      <div className="builder-section" style={{ padding: '14px 16px' }}>
        <div className="bar-chart">
          {weekData.map(({ date, total }) => (
            <div key={date} className="bar-row">
              <div className="bar-label">
                <span>{formatDate(new Date(date + 'T00:00:00'))}</span>
                <span>{formatSeconds(total)}</span>
              </div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(total / weekMax) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top domains */}
      {topDomains.length > 0 && (
        <>
          <div className="section-label">Top sites (all time)</div>
          <div className="builder-section" style={{ padding: '14px 16px' }}>
            <div className="bar-chart">
              {topDomains.map(([domain, secs]) => (
                <div key={domain} className="bar-row">
                  <div className="bar-label">
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{domain}</span>
                    <span>{formatSeconds(secs)}</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill green"
                      style={{ width: `${(secs / topMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Most triggered nudges */}
      {sortedNudges.length > 0 && (
        <>
          <div className="section-label">Most active nudges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sortedNudges.map((n) => (
              <div key={n.id} className="domain-row">
                <div>
                  <div className="domain-name">{n.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                    {n.stats.acceptedCount} accepted · {n.stats.snoozedCount} snoozed · {n.stats.ignoredCount} ignored
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="domain-time">{n.stats.triggeredCount}×</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>triggered</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {stats.totalNudgesTriggered === 0 && topDomains.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No data yet</h3>
          <p>Statistics will appear here once your nudges start firing and you browse the web.</p>
        </div>
      )}

      {/* Today's top sites */}
      {Object.keys(todayData).length > 0 && (
        <>
          <div className="section-label">Today's sites</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(todayData)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([domain, secs]) => (
                <div key={domain} className="domain-row">
                  <span className="domain-name">{domain}</span>
                  <span className="domain-time">{formatSeconds(secs)}</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
