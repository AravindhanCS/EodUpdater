import React, { useState } from 'react';
import { 
  Cloud, 
  Search, 
  History, 
  User, 
  Clock, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function RecentEntriesTable({
  entries = [],
  currentUser = '',
  targetSheet = '',
  isLoading = false,
  onRefresh,
  isVerifying = false,
  verificationSeconds = 0,
  verificationMaxSeconds = 50,
  pendingEntries = []
}) {
  const [filterUserOnly, setFilterUserOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter(e => {
    if (filterUserOnly && e.name && currentUser && e.name.toLowerCase() !== currentUser.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicket = e.ticket && e.ticket.toLowerCase().includes(q);
      const matchDesc = e.description && e.description.toLowerCase().includes(q);
      const matchCat = e.category && e.category.toLowerCase().includes(q);
      const matchName = e.name && e.name.toLowerCase().includes(q);
      return matchTicket || matchDesc || matchCat || matchName;
    }
    return true;
  });

  const getCategoryColor = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'development': return 'cat-dev';
      case 'qa': return 'cat-qa';
      case 'internal calls': return 'cat-calls';
      case 'client calls': return 'cat-client';
      case 'dev chat issue': return 'cat-chat';
      case 'pr comments': return 'cat-pr';
      default: return 'cat-default';
    }
  };

  const progressPercent = Math.min(
    100, 
    Math.max(6, Math.round((verificationSeconds / verificationMaxSeconds) * 100))
  );

  return (
    <div className="recent-entries-card glass-panel">
      {/* Header with Title and Controls */}
      <div className="entries-header-row">
        <div className="entries-title-wrap">
          <History size={20} className="entries-icon" />
          <div>
            <div className="entries-title-line">
              <h2 className="entries-title">Recent Sprint Entries</h2>
              {isVerifying ? (
                <span className="live-sharepoint-badge verifying" title="Active verification with SharePoint Online">
                  <span className="pulse-dot-amber"></span> Verifying Live SharePoint...
                </span>
              ) : (
                <span className="live-sharepoint-badge" title="Showing only entries present and verified in SharePoint Online">
                  <span className="pulse-dot"></span> Live SharePoint Synced
                </span>
              )}
            </div>
            <p className="entries-subtitle">
              Sheet: <strong>{targetSheet}</strong> • Showing {filteredEntries.length} of {entries.length} verified rows from SharePoint
            </p>
          </div>
        </div>

        <div className="entries-controls-wrap">
          {/* Search Bar */}
          <div className="search-input-wrap">
            <Search size={14} className="search-icon" />
            <input 
              id="recent-entries-search"
              type="text" 
              className="styled-input search-input"
              placeholder="Filter by ticket, task, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* User Filter Toggle */}
          <button 
            id="filter-my-entries-btn"
            type="button"
            className={`filter-toggle-btn ${filterUserOnly ? 'active' : ''}`}
            onClick={() => setFilterUserOnly(!filterUserOnly)}
            title={`Toggle between only ${currentUser}'s entries or whole team`}
          >
            <User size={14} />
            <span>My Entries Only</span>
          </button>

          {/* Sync SharePoint Button - Decent, elegant, NO SPINNING */}
          <button 
            id="refresh-entries-btn"
            type="button"
            className={`sync-sharepoint-btn ${isVerifying ? 'is-verifying' : isLoading ? 'is-syncing' : ''}`}
            onClick={() => onRefresh && onRefresh(true)}
            disabled={isLoading || isVerifying}
            title="Pull latest confirmed entries directly from SharePoint Online"
          >
            <span className={`sync-status-indicator ${isVerifying ? 'verifying' : isLoading ? 'syncing' : 'ready'}`}></span>
            <Cloud size={14} className="sync-cloud-icon" />
            <span>{isVerifying ? 'Verifying Cloud...' : isLoading ? 'Syncing...' : 'Sync SharePoint'}</span>
          </button>
        </div>
      </div>

      {/* Live SharePoint Cloud Sync Verification Monitor (shown from click until entries confirmed) */}
      {isVerifying && (
        <div className="sharepoint-sync-monitor-card animate-fade-in">
          <div className="monitor-top-row">
            <div className="monitor-status-badge">
              <span className="radar-ping-ring"></span>
              <span className="radar-core-dot"></span>
              <Cloud size={16} className="monitor-cloud-icon" />
              <strong>Verifying with SharePoint Online</strong>
            </div>

            <div className="monitor-timer-pill">
              <Clock size={13} />
              <span>Checking cloud: <strong>{verificationSeconds}s</strong> / {verificationMaxSeconds}s</span>
            </div>
          </div>

          <div className="monitor-progress-track">
            <div 
              className="monitor-progress-fill" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="monitor-shimmer"></div>
            </div>
          </div>

          <div className="monitor-details-row">
            <div className="monitor-explainer">
              <span className="pulse-text-indicator">●</span>
              <span>
                Dispatched via Resend • Waiting for Power Automate flow to append {pendingEntries.length} row(s) to sheet <strong>{targetSheet}</strong>
              </span>
            </div>

            {pendingEntries && pendingEntries.length > 0 && (
              <div className="pending-chips-wrap">
                {pendingEntries.map((p, idx) => (
                  <span key={idx} className="pending-entry-chip">
                    <span className="chip-pulsing-dot"></span>
                    <span className="chip-name">{p.ticket ? `#${p.ticket}` : p.category}</span>
                    <span className="chip-hrs">{p.timeInHrs}h</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Entries Table Area */}
      <div className="entries-table-wrapper">
        {isLoading && !isVerifying ? (
          /* Aesthetic modern loader when fetching rows without spinning icon */
          <div className="aesthetic-sync-loader animate-fade-in">
            <div className="aesthetic-loader-pill">
              <span className="loader-glow-orb"></span>
              <Cloud size={18} className="loader-cloud-icon" />
              <span>Fetching verified entries from SharePoint Online...</span>
            </div>
            <div className="skeleton-table-rows">
              <div className="skeleton-row shimmer"></div>
              <div className="skeleton-row shimmer"></div>
              <div className="skeleton-row shimmer"></div>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            {isVerifying ? (
              <div className="verifying-empty-note">
                <Cloud size={32} className="cloud-waiting-icon" />
                <p>Waiting for submitted tasks to appear in SharePoint Online...</p>
                <span className="verifying-hint">The table will automatically refresh the moment Microsoft Power Automate finishes.</span>
              </div>
            ) : (
              <p>No matching entries found in this sprint sheet.</p>
            )}
          </div>
        ) : (
          <table className="entries-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Ticket</th>
                <th>Category</th>
                <th className="text-right">Hours</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry, idx) => (
                <tr key={idx} className="entry-row">
                  <td className="cell-date">
                    <span className="date-badge">{entry.date}</span>
                  </td>
                  <td className="cell-name">
                    <span className={`name-chip ${entry.name && currentUser && entry.name.toLowerCase() === currentUser.toLowerCase() ? 'is-current-user' : ''}`}>
                      {entry.name}
                    </span>
                  </td>
                  <td className="cell-ticket">
                    {entry.ticket ? (
                      <span className="ticket-pill">#{entry.ticket}</span>
                    ) : (
                      <span className="ticket-empty">—</span>
                    )}
                  </td>
                  <td className="cell-category">
                    <span className={`category-tag ${getCategoryColor(entry.category)}`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="cell-hours text-right">
                    <strong>{typeof entry.timeInHrs === 'number' ? entry.timeInHrs.toFixed(1) : entry.timeInHrs}</strong>
                  </td>
                  <td className="cell-desc">
                    <div className="desc-text" title={entry.description}>
                      {entry.description}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
