import React from 'react';
import { CheckCircle2, AlertTriangle, RefreshCw, X, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';

export default function SyncStatusModal({
  isOpen,
  type = 'success', // 'success' | 'timeout'
  sheetName = '',
  entries = [],
  elapsedSeconds = 0,
  onClose,
  onRetryCheck,
  isRetrying = false
}) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const totalHrs = entries.reduce((sum, e) => sum + (parseFloat(e.timeInHrs) || 0), 0);

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div 
        className="modal-content sync-status-modal glass-panel animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`modal-header sync-header ${isSuccess ? 'success-header' : 'warning-header'}`}>
          <div className="modal-title-wrap">
            <div className={`sync-icon-badge ${isSuccess ? 'success' : 'warning'}`}>
              {isSuccess ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
            </div>
            <div>
              <h3 className="modal-title">
                {isSuccess ? 'SharePoint Online Sync Confirmed!' : 'SharePoint Verification Pending'}
              </h3>
              <p className="modal-subtitle">
                {isSuccess 
                  ? `All items verified and confirmed in SharePoint Online sheet "${sheetName}"`
                  : `Dispatched to cloud automation, but not yet detected after ${elapsedSeconds}s`}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body sync-modal-body">
          {isSuccess ? (
            <div className="sync-success-content">
              <div className="sync-metric-pill">
                <span className="metric-icon">🎯</span>
                <span><strong>{entries.length} tasks</strong> totaling <strong>{totalHrs.toFixed(1)} hrs</strong> confirmed in live SharePoint Online file</span>
              </div>

              <div className="verified-items-table-wrap">
                <table className="verified-items-table">
                  <thead>
                    <tr>
                      <th>Ticket</th>
                      <th>Category</th>
                      <th className="text-right">Hours</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((item, idx) => (
                      <tr key={idx} className="verified-row">
                        <td className="col-ticket">
                          {item.ticket ? <span className="ticket-pill">#{item.ticket}</span> : '—'}
                        </td>
                        <td className="col-cat">
                          <span className="category-tag cat-default">{item.category}</span>
                        </td>
                        <td className="col-hrs text-right">
                          <strong>{item.timeInHrs}h</strong>
                        </td>
                        <td className="col-desc">
                          <span className="desc-preview" title={item.description}>{item.description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="sync-notice-banner success">
                <ShieldCheck size={18} className="banner-icon" />
                <div>
                  <strong>Live File Protected & In Sync</strong>
                  <p>Your team members and manager can now view your logged effort in Effort Tracker - Simplicity.xlsx.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="sync-timeout-content">
              <div className="timeout-notice-box">
                <h4>What does this mean?</h4>
                <p>
                  Your update was successfully dispatched to Cloud Automation via Resend email. 
                  However, Microsoft Power Automate is either still processing in the Outlook queue or running its Office Script in SharePoint Online.
                </p>
              </div>

              <div className="timeout-steps-card">
                <h5>Helpful Information:</h5>
                <ul>
                  <li>
                    <strong>Outlook Delivery Lag</strong>: Cloud emails occasionally take 30–90 seconds to trigger Power Automate during high Microsoft 365 traffic.
                  </li>
                  <li>
                    <strong>No Data Lost</strong>: Your entries remain safely queued. They will appear as soon as the Power Automate flow completes.
                  </li>
                  <li>
                    <strong>Check Flow Run History</strong>: If entries do not appear after 2 minutes, visit Power Automate to verify your flow run.
                  </li>
                </ul>
              </div>

              {entries.length > 0 && (
                <div className="pending-entries-summary">
                  <span className="summary-label">Dispatched items ({entries.length}):</span>
                  <div className="pending-chips">
                    {entries.map((e, idx) => (
                      <span key={idx} className="pending-chip">
                        {e.category} ({e.timeInHrs}h) {e.ticket ? `• #${e.ticket}` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer sync-modal-footer">
          {isSuccess ? (
            <button 
              type="button" 
              className="btn-primary"
              onClick={onClose}
            >
              <span>View Recent Entries</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={onClose}
              >
                Dismiss
              </button>
              <button 
                type="button" 
                className={`btn-primary ${isRetrying ? 'loading' : ''}`}
                onClick={onRetryCheck}
                disabled={isRetrying}
              >
                <RefreshCw size={15} />
                <span>{isRetrying ? 'Checking SharePoint...' : 'Check SharePoint Again'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
