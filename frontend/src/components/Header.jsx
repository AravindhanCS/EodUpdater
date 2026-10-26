import React from 'react';
import { 
  FileSpreadsheet, 
  Settings, 
  Sun, 
  Moon, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  UploadCloud, 
  BarChart3, 
  Edit3 
} from 'lucide-react';

export default function Header({ 
  status, 
  activeSprint, 
  theme, 
  onToggleTheme, 
  onOpenSettings,
  mode,
  onToggleMode,
  activeTab = 'logger',
  onSelectTab
}) {
  const fileName = status?.configuredFilePath 
    ? status.configuredFilePath.split(/[\\/]/).pop() 
    : 'Effort Tracker - Simplicity.xlsx';

  return (
    <header className="header-container glass-panel">
      <div className="header-left">
        <div className="logo-badge" onClick={() => onSelectTab && onSelectTab('logger')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon-wrap">
            <FileSpreadsheet className="logo-icon" size={24} />
          </div>
          <div>
            <h1 className="logo-title">Simplicity EOD</h1>
            <p className="logo-subtitle">Automated Sprint Excel Effort Tracker</p>
          </div>
        </div>

        {activeSprint && (
          <div className="sprint-chip" title="Auto-calculated Sprint Sheet">
            <Layers size={14} className="sprint-chip-icon" />
            <span>Sprint <strong>{activeSprint}</strong></span>
          </div>
        )}
      </div>

      {/* Main Page Navigation Tabs */}
      <nav className="header-nav-tabs">
        <button
          id="nav-tab-logger"
          className={`nav-tab-pill ${activeTab === 'logger' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('logger')}
          title="Daily Task Logging & Azure DevOps Auto-Sync"
        >
          <Edit3 size={15} />
          <span>EOD Logger</span>
        </button>
        <button
          id="nav-tab-dashboard"
          className={`nav-tab-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => onSelectTab && onSelectTab('dashboard')}
          title="Managerial Insights, Individual Ticket Hours & Sprint Leaderboards"
        >
          <BarChart3 size={15} />
          <span>Team Dashboard</span>
          <span className="nav-pulse-badge">Live</span>
        </button>
      </nav>

      <div className="header-right">
        {/* Mode Switcher - only relevant on Daily Task Logger tab */}
        {activeTab === 'logger' && (
          <div className="mode-toggle-group">
            <button 
              id="mode-direct-btn"
              className={`mode-btn ${mode === 'direct' ? 'active' : ''}`}
              onClick={() => onToggleMode('direct')}
              title="Appends directly to local/synced OneDrive file"
            >
              Direct
            </button>
            <button 
              id="mode-upload-btn"
              className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
              onClick={() => onToggleMode('upload')}
              title="Upload workbook, append tasks, and download updated file"
            >
              <UploadCloud size={14} /> Upload
            </button>
          </div>
        )}

        {/* File Connection Status Pill */}
        <div className={`status-pill ${status?.fileExists ? 'connected' : 'error'}`} title={status?.configuredFilePath || fileName}>
          {status?.fileExists ? (
            <>
              <span className="status-dot green"></span>
              <span className="status-text">{fileName}</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} className="status-icon-warn" />
              <span className="status-text">File Not Found</span>
            </>
          )}
        </div>

        {status?.sharePointConnected && (
          <div 
            className="status-pill sharepoint-live-pill" 
            title={`Live SharePoint sync active: ${status.resendConfigured ? 'Resend Cloud Email Sync' : status.powerAutomateWebhookUrl ? 'Power Automate Cloud Webhook' : status.sharePointUrl}`}
          >
            <span className="status-dot blue-pulse"></span>
            <span className="status-text">{status.resendConfigured ? 'Cloud Sync Live' : status.powerAutomateWebhookUrl ? 'Cloud Sync Live' : 'SharePoint Live'}</span>
          </div>
        )}

        {/* Action Icon Controls (Always visible and never pushed off) */}
        <div className="header-actions-group">
          {/* Settings Button */}
          <button 
            id="settings-modal-btn"
            className="icon-action-btn" 
            onClick={onOpenSettings}
            title="Configure File Path & Defaults"
          >
            <Settings size={18} />
          </button>

          {/* Theme Toggle Button */}
          <button 
            id="theme-toggle-btn"
            className="icon-action-btn" 
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
}
