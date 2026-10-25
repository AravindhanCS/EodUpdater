import React, { useState, useEffect } from 'react';
import { 
  GitPullRequest, 
  CheckSquare, 
  Square, 
  Zap,
  Check,
  ExternalLink, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { fetchAdoTickets } from '../services/api';
import { distributeHoursInHalfHours } from '../utils/hoursUtils';

export default function AdoTicketSelector({
  currentUser,
  remainingDevHours,
  scheduledHours,
  onApplyTickets,
  selectedTicketIds,
  onToggleTicket,
  onSelectAll,
  onDeselectAll
}) {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [error, setError] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    loadTickets();
  }, [currentUser]);

  const loadTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdoTickets(currentUser);
      setTickets(data);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2200);
    } catch (e) {
      setError(e.message || 'Failed to fetch tickets from Azure DevOps');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedTicketIds.length;
  const distributedHours = distributeHoursInHalfHours(remainingDevHours, selectedCount);
  const isUniform = distributedHours.length > 0 && distributedHours.every(h => h === distributedHours[0]);

  return (
    <div className="ado-selector-card glass-panel animate-fade-in">
      <div className="ado-header">
        <div className="ado-title-wrap">
          <div className="ado-icon-wrap">
            <GitPullRequest size={20} className="ado-icon" />
          </div>
          <div>
            <div className="ado-title-row">
              <h3 className="ado-title">Azure DevOps Work Items</h3>
              <span className="ado-project-tag">simplicitysystems / SimplicityCollect</span>
              <span className="ado-user-tag">👤 Assigned to: {currentUser || '@Me'}</span>
            </div>
            <p className="ado-subtitle">
              Select tickets worked on today — remaining <strong>{remainingDevHours.toFixed(1)} hrs</strong> will be divided equally.
            </p>
          </div>
        </div>

        <div className="ado-actions">
          <button 
            type="button" 
            className={`btn-secondary fetch-btn ${isLoading ? 'is-syncing' : ''} ${justSynced ? 'is-synced' : ''}`}
            onClick={loadTickets}
            disabled={isLoading}
            title="Refresh active tickets and PRs from Azure DevOps"
          >
            {isLoading ? (
              <>
                <span className="radar-beacon">
                  <span className="beacon-ping"></span>
                  <span className="beacon-core"></span>
                </span>
                <span>Syncing</span>
                <span className="bouncing-dots">
                  <span className="b-dot"></span>
                  <span className="b-dot"></span>
                  <span className="b-dot"></span>
                </span>
              </>
            ) : justSynced ? (
              <>
                <Check size={14} className="sync-success-icon" />
                <span>Synced!</span>
              </>
            ) : (
              <>
                <Zap size={14} className="fetch-icon" />
                <span>Fetch ADO</span>
              </>
            )}
          </button>

          <button 
            type="button" 
            className="icon-action-btn collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Tickets' : 'Collapse Tickets'}
          >
            {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="ado-body">
          {error && (
            <div className="ado-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Ticket List */}
          <div className="ado-ticket-list">
            {tickets.length === 0 && !isLoading ? (
              <div className="ado-empty">
                <p>No active development tickets or PR comments found.</p>
              </div>
            ) : (
              tickets.map(ticket => {
                const isSelected = selectedTicketIds.includes(ticket.id);
                return (
                  <div 
                    key={ticket.id} 
                    className={`ado-ticket-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggleTicket(ticket)}
                  >
                    <div className="ticket-checkbox">
                      {isSelected ? (
                        <CheckSquare size={18} className="checkbox-icon checked" />
                      ) : (
                        <Square size={18} className="checkbox-icon unchecked" />
                      )}
                    </div>

                    <div className="ticket-details">
                      <div className="ticket-top-row">
                        <span className="ticket-id-badge">#{ticket.id}</span>
                        <span className={`ticket-state-tag ${ticket.isPrComment ? 'pr-tag' : 'dev-tag'}`}>
                          {ticket.isPrComment ? 'PR Comments' : ticket.state}
                        </span>
                        {ticket.isPrComment && (
                          <span className="unresolved-badge" title={ticket.prTitle}>
                            ⚠️ {ticket.unresolvedCommentsCount} Unresolved Comment{ticket.unresolvedCommentsCount > 1 ? 's' : ''}
                          </span>
                        )}
                        <span className="ticket-type">{ticket.type}</span>
                      </div>

                      <div className="ticket-title-row">
                        <span className="ticket-title-text">{ticket.title}</span>
                      </div>
                    </div>

                    <div className="ticket-external" onClick={(e) => e.stopPropagation()}>
                      <a 
                        href={ticket.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="ado-link"
                        title="Open in Azure DevOps"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Equal Distribution Summary Footer */}
          <div className="ado-summary-bar">
            <div className="distribution-stats">
              <div className="stat-pill">
                <Clock size={14} />
                <span>Scheduled Calls: <strong>{scheduledHours.toFixed(1)}h</strong></span>
              </div>
              <div className="stat-pill highlight">
                <Sparkles size={14} />
                <span>Available Dev Hours: <strong>{remainingDevHours.toFixed(1)}h</strong></span>
              </div>
              {selectedCount > 0 ? (
                <div className="stat-pill success">
                  <span>Allocation (0.5h rounded): <strong>{isUniform ? `${distributedHours[0]?.toFixed(1)}h each` : distributedHours.map(h => `${h.toFixed(1)}h`).join(' + ')}</strong> ({selectedCount} selected)</span>
                </div>
              ) : (
                <span className="select-prompt">Check one or more tickets above to auto-allocate</span>
              )}
            </div>

            <div className="ado-footer-buttons">
              {selectedCount > 0 && (
                <button 
                  type="button" 
                  className="btn-ghost clear-selection-btn"
                  onClick={onDeselectAll}
                >
                  Clear Selection
                </button>
              )}
              <button 
                type="button" 
                className="btn-secondary select-all-btn"
                onClick={() => onSelectAll(tickets)}
              >
                Select All ({tickets.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
