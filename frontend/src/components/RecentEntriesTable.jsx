import React, { useState } from 'react';
import { RefreshCw, Search, Filter, History, User, Tag, Calendar, Clock } from 'lucide-react';

export default function RecentEntriesTable({
  entries = [],
  currentUser,
  targetSheet,
  isLoading,
  onRefresh
}) {
  const [filterUserOnly, setFilterUserOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = entries.filter(e => {
    if (filterUserOnly && e.name.toLowerCase() !== currentUser.toLowerCase()) {
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

  return (
    <div className="recent-entries-card glass-panel">
      {/* Header with Title and Controls */}
      <div className="entries-header-row">
        <div className="entries-title-wrap">
          <History size={20} className="entries-icon" />
          <div>
            <h2 className="entries-title">Recent Sprint Entries</h2>
            <p className="entries-subtitle">
              Sheet: <strong>{targetSheet}</strong> • Showing {filteredEntries.length} of {entries.length} logged rows
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

          {/* Refresh Button */}
          <button 
            id="refresh-entries-btn"
            type="button"
            className={`icon-action-btn ${isLoading ? 'spinning' : ''}`}
            onClick={onRefresh}
            title="Refresh entries from Excel"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Entries Table */}
      <div className="entries-table-wrapper">
        {isLoading ? (
          <div className="empty-state">
            <RefreshCw size={24} className="spinning" />
            <p>Loading entries from Excel sheet...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="empty-state">
            <p>No matching entries found in this sprint sheet.</p>
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
                    <span className={`name-chip ${entry.name.toLowerCase() === currentUser.toLowerCase() ? 'is-current-user' : ''}`}>
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
