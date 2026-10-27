import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink,
  FileSpreadsheet
} from 'lucide-react';

export default function SyncStatusModal({
  isOpen,
  type = 'timeout', // 'timeout' | 'success'
  sheetName = '',
  entries = [],
  elapsedSeconds = 0,
  sharePointUrl = '',
  onClose,
  onRetryCheck,
  isRetrying = false
}) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const totalHrs = entries.reduce((sum, e) => sum + (parseFloat(e.timeInHrs) || 0), 0);

  const defaultSharePointUrl = 'https://psiog0-my.sharepoint.com/:x:/g/personal/abinayasundari_paramasivam_psiog_com/IQCajkhcEzfESIEMXT6hpb0NAY5Z6-iujcXYrEnq0Z27shA?e=yvkpjj';
  const targetUrl = (sharePointUrl && sharePointUrl.trim().length > 0) ? sharePointUrl.trim() : defaultSharePointUrl;

  const handleOpenExcel = () => {
    // Open in Excel Online (strip any download=1 query)
    const cleanUrl = targetUrl.replace(/([?&])download=1/, '');
    window.open(cleanUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose}>
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
              {/* Option to Open Excel directly */}
              <div className="open-excel-action-card">
                <div className="open-excel-info">
                  <div className="excel-icon-pill">
                    <FileSpreadsheet size={22} className="excel-brand-icon" />
                  </div>
                  <div>
                    <h4>Update Directly in SharePoint Excel</h4>
                    <p>
                      If Microsoft Power Automate is delayed or encountered an error, you can open the live Excel spreadsheet directly and record your entries.
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="open-excel-direct-btn"
                  onClick={handleOpenExcel}
                  title="Open live SharePoint Excel workbook in Excel Online"
                >
                  <FileSpreadsheet size={16} />
                  <span>Open Excel Sheet</span>
                  <ExternalLink size={14} />
                </button>
              </div>

              <div className="timeout-notice-box">
                <h4>What does this mean?</h4>
                <p>
                  Your update was dispatched to Cloud Automation via Resend email. 
                  However, Microsoft Power Automate has not yet updated sheet <strong>{sheetName}</strong> in SharePoint.
                </p>
              </div>

              <div className="timeout-steps-card">
                <h5>Helpful Information:</h5>
                <ul>
                  <li>
                    <strong>Check Power Automate Run History</strong>: In make.powerautomate.com, verify if the "EOD Tracker Sync" flow ran or failed (e.g. linter error or script parameter issue).
                  </li>
                  <li>
                    <strong>Outlook Delivery Lag</strong>: Cloud emails occasionally take 30–90 seconds to trigger Power Automate during high Microsoft 365 traffic.
                  </li>
                  <li>
                    <strong>No Data Lost</strong>: Your entries remain saved in your input form. You can retry the check below or open Excel directly.
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
                className="btn-excel-footer"
                onClick={handleOpenExcel}
                title="Open live SharePoint Excel workbook in a new tab"
              >
                <FileSpreadsheet size={15} />
                <span>Open Excel Sheet</span>
                <ExternalLink size={13} />
              </button>

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
