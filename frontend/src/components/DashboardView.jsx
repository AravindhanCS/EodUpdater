import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Briefcase,
  Layers,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  Calendar,
  Flame,
  Star,
  CheckCheck,
  PhoneCall,
  Code2,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Info,
  CloudDownload,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  PieChart,
  AlertOctagon,
  MessageSquare,
  Trash2,
  Edit3,
  Check,
  X,
  Tag,
  Zap,
  ChevronDown,
  ChevronUp,
  UploadCloud
} from 'lucide-react';
import { 
  fetchSprintAnalytics, 
  pullLatestFromSharePoint, 
  saveMissingLogReason, 
  clearMissingLogReason,
  fetchSprintStoryPoints,
  uploadTrackerFile
} from '../services/api';

const PRESET_REASONS = [
  'Planned Leave',
  'Sick Leave',
  'Comp Off',
  'Client / Public Holiday',
  'Travel / Training',
  'Forgot / Backfill Pending',
  'Other'
];

export default function DashboardView({ activeSprint, filePath, onTrackerUploaded }) {
  const [analytics, setAnalytics] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(activeSprint || '2.14.10.1');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingSharePoint, setIsSyncingSharePoint] = useState(false);
  const [selectedDeveloper, setSelectedDeveloper] = useState('All');
  const [ticketSearch, setTicketSearch] = useState('');
  const [error, setError] = useState(null);
  const [syncNotice, setSyncNotice] = useState(null);
  const [cloudNotice, setCloudNotice] = useState(null);
  const [isUploadingTracker, setIsUploadingTracker] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Quality & Compliance tab & filter state
  const [complianceTab, setComplianceTab] = useState('all'); // 'all' | 'missingLogs' | 'hoursAnomalies' | 'missingFields'
  const [complianceDevFilter, setComplianceDevFilter] = useState('All');
  const [complianceSearch, setComplianceSearch] = useState('');

  // Missing Log reason giving & filtering states
  const [missingLogReasonFilter, setMissingLogReasonFilter] = useState('all'); // 'all' | 'noReason' | 'withReason'
  const [editingAlertKey, setEditingAlertKey] = useState(null); // `${developer}_${date}`
  const [reasonCategory, setReasonCategory] = useState('Planned Leave');
  const [customReasonText, setCustomReasonText] = useState('');
  const [reasonComment, setReasonComment] = useState('');
  const [isSavingReason, setIsSavingReason] = useState(false);
  const [reasonNotice, setReasonNotice] = useState(null);

  // Story Points (Azure DevOps) states
  const [storyPointsReport, setStoryPointsReport] = useState(null);
  const [isLoadingStoryPoints, setIsLoadingStoryPoints] = useState(false);
  const [storyPointsError, setStoryPointsError] = useState(null);
  const [expandedResourceTickets, setExpandedResourceTickets] = useState({});

  // Load analytics when selected sprint or file path changes
  useEffect(() => {
    if (selectedSprint) {
      loadData(selectedSprint);
      loadStoryPoints(selectedSprint);
    }
  }, [selectedSprint, filePath]);

  // Sync if activeSprint changes initially
  useEffect(() => {
    if (activeSprint && !selectedSprint) {
      setSelectedSprint(activeSprint);
    }
  }, [activeSprint]);

  const loadData = async (sprint) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchSprintAnalytics(sprint, filePath);
      setAnalytics(data);
      if (data.sprintName && data.sprintName !== selectedSprint) {
        setSelectedSprint(data.sprintName);
      }
    } catch (err) {
      setError(err.message || 'Failed to load sprint analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoryPoints = async (sprint) => {
    setIsLoadingStoryPoints(true);
    setStoryPointsError(null);
    try {
      const data = await fetchSprintStoryPoints(sprint);
      setStoryPointsReport(data);
      if (!data.success && data.message) {
        setStoryPointsError(data.message);
      } else if (data.resources) {
        // Expand all resource ticket lists by default
        const initialExpanded = {};
        data.resources.forEach(r => { initialExpanded[r.resourceName] = true; });
        setExpandedResourceTickets(initialExpanded);
      }
    } catch (err) {
      setStoryPointsError(err.message || 'Failed to load Azure DevOps story points');
    } finally {
      setIsLoadingStoryPoints(false);
    }
  };

  const toggleResourceExpanded = (resourceName) => {
    setExpandedResourceTickets(prev => ({
      ...prev,
      [resourceName]: !prev[resourceName]
    }));
  };

  const expandAllStoryPointTickets = (expand) => {
    if (!storyPointsReport?.resources) return;
    const next = {};
    storyPointsReport.resources.forEach(r => { next[r.resourceName] = expand; });
    setExpandedResourceTickets(next);
  };

  const handleTrackerFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingTracker(true);
    setUploadError(null);
    try {
      await uploadTrackerFile(file);
      setSyncNotice(`Effort Tracker "${file.name}" uploaded successfully! Refreshing analytics...`);
      setCloudNotice(null);
      await loadData(selectedSprint);
      if (onTrackerUploaded) onTrackerUploaded();
      setTimeout(() => setSyncNotice(null), 5000);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload tracker file');
    } finally {
      setIsUploadingTracker(false);
      e.target.value = '';
    }
  };

  const handleSyncSharePoint = async () => {
    setIsSyncingSharePoint(true);
    setSyncNotice(null);
    setCloudNotice(null);
    setError(null);
    try {
      const res = await pullLatestFromSharePoint(filePath);
      if (res?.isAuthError) {
        setCloudNotice(res?.message || 'SharePoint access denied. Please generate an "Anyone with the link can view" sharing link in SharePoint and paste it in Settings.');
      } else if (res?.isCloudEnvironment || !res?.success) {
        setCloudNotice(res?.message || 'SharePoint COM sync is supported when running locally on Windows. For cloud hosting, please set your "Anyone with the link can view" SharePoint link in Settings or upload the tracker directly.');
      } else {
        await loadData(selectedSprint);
        if (onTrackerUploaded) onTrackerUploaded();
        setSyncNotice('Successfully pulled latest live entries from SharePoint Online!');
        setTimeout(() => setSyncNotice(null), 5000);
      }
    } catch (err) {
      setError('SharePoint sync error: ' + (err.message || 'Failed to pull live SharePoint file'));
    } finally {
      setIsSyncingSharePoint(false);
    }
  };

  const handleOpenReasonEditor = (item) => {
    const key = `${item.developer}_${item.date}`;
    setEditingAlertKey(key);
    if (item.reason && PRESET_REASONS.includes(item.reason)) {
      setReasonCategory(item.reason);
      setCustomReasonText('');
    } else if (item.reason) {
      setReasonCategory('Other');
      setCustomReasonText(item.reason);
    } else {
      setReasonCategory('Planned Leave');
      setCustomReasonText('');
    }
    setReasonComment(item.comment || '');
  };

  const handleCancelReasonEditor = () => {
    setEditingAlertKey(null);
    setReasonCategory('Planned Leave');
    setCustomReasonText('');
    setReasonComment('');
  };

  const handleSaveReason = async (item) => {
    setIsSavingReason(true);
    const finalReason = reasonCategory === 'Other' ? (customReasonText.trim() || 'Other Reason') : reasonCategory;
    try {
      await saveMissingLogReason({
        sprintName: selectedSprint,
        developer: item.developer,
        date: item.date,
        reason: finalReason,
        comment: reasonComment.trim()
      });
      await loadData(selectedSprint);
      setEditingAlertKey(null);
      setReasonNotice(`Reason recorded for ${item.developer} on ${item.date}!`);
      setTimeout(() => setReasonNotice(null), 4000);
    } catch (err) {
      setError('Failed to save reason: ' + (err.message || 'Server error'));
    } finally {
      setIsSavingReason(false);
    }
  };

  const handleClearReason = async (item) => {
    try {
      await clearMissingLogReason(selectedSprint, item.developer, item.date);
      await loadData(selectedSprint);
      setReasonNotice(`Reason cleared for ${item.developer} on ${item.date}.`);
      setTimeout(() => setReasonNotice(null), 4000);
    } catch (err) {
      setError('Failed to clear reason: ' + (err.message || 'Server error'));
    }
  };

  // Filter developer analytics
  const devList = analytics?.developerAnalytics || [];
  const devMap = useMemo(() => new Map(devList.map(d => [d.name, d])), [devList]);
  const displayedDevelopers = selectedDeveloper === 'All'
    ? devList
    : devList.filter(d => d.name.toLowerCase() === selectedDeveloper.toLowerCase());

  // Compliance report items and filtering
  const complianceReport = analytics?.complianceReport;
  const missingLogs = complianceReport?.missingLogs || [];
  const hoursAnomalies = complianceReport?.hoursAnomalies || [];
  const missingFields = complianceReport?.missingFields || [];

  // Missing logs reason counts
  const missingLogsNoReasonCount = useMemo(() => {
    return missingLogs.filter(m => !m.reason || !m.reason.trim()).length;
  }, [missingLogs]);

  const missingLogsWithReasonCount = useMemo(() => {
    return missingLogs.filter(m => m.reason && m.reason.trim()).length;
  }, [missingLogs]);

  const filteredMissingLogs = useMemo(() => {
    return missingLogs.filter(item => {
      // 1. Developer filter
      if (complianceDevFilter !== 'All' && item.developer?.toLowerCase() !== complianceDevFilter.toLowerCase()) return false;
      
      // 2. Reason status filter ('all', 'noReason', 'withReason')
      const hasReason = Boolean(item.reason && item.reason.trim());
      if (missingLogReasonFilter === 'noReason' && hasReason) return false;
      if (missingLogReasonFilter === 'withReason' && !hasReason) return false;

      // 3. Search query filter
      if (complianceSearch) {
        const q = complianceSearch.toLowerCase();
        return (item.developer && item.developer.toLowerCase().includes(q)) ||
               (item.date && item.date.toLowerCase().includes(q)) ||
               (item.dayOfWeek && item.dayOfWeek.toLowerCase().includes(q)) ||
               (item.reason && item.reason.toLowerCase().includes(q)) ||
               (item.comment && item.comment.toLowerCase().includes(q));
      }
      return true;
    });
  }, [missingLogs, complianceDevFilter, missingLogReasonFilter, complianceSearch]);

  const filteredHoursAnomalies = useMemo(() => {
    return hoursAnomalies.filter(item => {
      if (complianceDevFilter !== 'All' && item.developer?.toLowerCase() !== complianceDevFilter.toLowerCase()) return false;
      if (complianceSearch) {
        const q = complianceSearch.toLowerCase();
        return (item.developer && item.developer.toLowerCase().includes(q)) ||
               (item.date && item.date.toLowerCase().includes(q)) ||
               (item.message && item.message.toLowerCase().includes(q)) ||
               (item.type && item.type.toLowerCase().includes(q));
      }
      return true;
    });
  }, [hoursAnomalies, complianceDevFilter, complianceSearch]);

  const filteredMissingFields = useMemo(() => {
    return missingFields.filter(item => {
      if (complianceDevFilter !== 'All' && item.developer?.toLowerCase() !== complianceDevFilter.toLowerCase()) return false;
      if (complianceSearch) {
        const q = complianceSearch.toLowerCase();
        return (item.developer && item.developer.toLowerCase().includes(q)) ||
               (item.date && item.date.toLowerCase().includes(q)) ||
               (item.ticket && item.ticket.toLowerCase().includes(q)) ||
               (item.category && item.category.toLowerCase().includes(q)) ||
               (item.description && item.description.toLowerCase().includes(q)) ||
               (item.missingField && item.missingField.toLowerCase().includes(q));
      }
      return true;
    });
  }, [missingFields, complianceDevFilter, complianceSearch]);

  // Combined total count of filtered compliance alerts
  const totalFilteredComplianceCount = filteredMissingLogs.length + filteredHoursAnomalies.length + filteredMissingFields.length;

  // Filter high effort tickets
  const highEffortTickets = (analytics?.highEffortTickets || []).filter(t => {
    if (!ticketSearch) return true;
    const query = ticketSearch.toLowerCase();
    return (
      t.ticketId.toLowerCase().includes(query) ||
      (t.latestDescription && t.latestDescription.toLowerCase().includes(query)) ||
      (t.contributors && t.contributors.some(c => c.toLowerCase().includes(query)))
    );
  });

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Dashboard Top Control Header */}
      <section className="dashboard-header glass-panel">
        <div className="dashboard-header-title-wrap">
          <div className="dashboard-title-icon-wrap">
            <BarChart3 className="dashboard-title-icon" size={26} />
          </div>
          <div>
            <div className="dashboard-badge-row">
              <span className="dashboard-live-pill">
                <span className="status-dot green-pulse"></span>
                <span>Live Intelligence</span>
              </span>
              <span className="dashboard-sprint-tag">Sprint: <strong>{selectedSprint}</strong></span>
            </div>
            <h2 className="dashboard-main-title">Team Performance & Effort Analytics</h2>
            <p className="dashboard-subtitle">
              Comprehensive managerial dashboard: individual velocity, ticket time tracking, rankings, and sprint insights.
            </p>
          </div>
        </div>

        <div className="dashboard-header-actions">
          {/* Sprint Selector */}
          <div className="dashboard-control-group">
            <label className="control-label" htmlFor="sprint-sheet-select">
              <Layers size={14} /> Sprint Sheet
            </label>
            <select
              id="sprint-sheet-select"
              className="dashboard-select"
              value={selectedSprint}
              onChange={(e) => setSelectedSprint(e.target.value)}
              disabled={isLoading}
            >
              {analytics?.availableSprints?.map(sheet => (
                <option key={sheet} value={sheet}>
                  {sheet} {sheet === activeSprint ? '★ (Active)' : ''}
                </option>
              )) || <option value={selectedSprint}>{selectedSprint}</option>}
            </select>
          </div>

          {/* Sync Live SharePoint Button */}
          <button
            id="dashboard-sync-sharepoint-btn"
            className={`action-btn primary-btn dashboard-sharepoint-sync-btn ${isSyncingSharePoint ? 'syncing' : ''}`}
            onClick={handleSyncSharePoint}
            disabled={isSyncingSharePoint || isLoading}
            title="Download the latest live cloud entries from SharePoint Online"
          >
            <CloudDownload size={16} className={isSyncingSharePoint ? 'animate-bounce' : ''} />
            <span>{isSyncingSharePoint ? 'Syncing SharePoint...' : 'Sync SharePoint'}</span>
          </button>

          {/* Refresh Button */}
          <button
            id="dashboard-refresh-btn"
            className="action-btn secondary-btn dashboard-refresh-btn"
            onClick={() => loadData(selectedSprint)}
            disabled={isLoading || isSyncingSharePoint}
            title="Recalculate analytics data from Excel"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Calculating...' : 'Recalculate'}</span>
          </button>
        </div>
      </section>

      {/* Sync Success Notice */}
      {syncNotice && (
        <div className="dashboard-success-banner glass-panel animate-fade-in">
          <CheckCircle2 size={18} className="success-icon" />
          <span>{syncNotice}</span>
          <button className="notice-close" onClick={() => setSyncNotice(null)}>✕</button>
        </div>
      )}

      {/* Cloud Environment / SharePoint COM Notice */}
      {cloudNotice && (
        <div className="dashboard-notice-banner glass-panel animate-fade-in">
          <Info size={20} className="notice-icon text-cyan" />
          <div className="notice-text">
            <strong>Cloud Environment Notice:</strong> {cloudNotice}
          </div>
          <button className="notice-close" onClick={() => setCloudNotice(null)}>✕</button>
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="dashboard-error-banner glass-panel animate-fade-in">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-text">
            <strong>Upload Error:</strong> {uploadError}
          </div>
          <button className="notice-close" onClick={() => setUploadError(null)}>✕</button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="dashboard-error-banner glass-panel">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-text">
            <strong>Could not calculate analytics:</strong> {error}
          </div>
          <button className="action-btn secondary-btn" onClick={() => loadData(selectedSprint)}>
            Retry
          </button>
        </div>
      )}

      {/* Cloud Upload Prompt: shown if totalRows is 0 */}
      {(!isLoading && (!analytics || analytics?.totalRows === 0)) && (
        <div className="dashboard-upload-prompt-card glass-panel animate-fade-in">
          <div className="upload-prompt-left">
            <div className="upload-prompt-icon-wrap">
              <UploadCloud size={28} />
            </div>
            <div>
              <h4 className="upload-prompt-title">Effort Tracker Workbook Not Found on Server</h4>
              <p className="upload-prompt-desc">
                The cloud backend doesn't have your local <code>Effort Tracker - Simplicity.xlsx</code> file yet.
                Upload your workbook once to immediately activate live team sprint hours, developer deep-dives, quality compliance checks, and leaderboard insights!
              </p>
            </div>
          </div>
          <div className="upload-prompt-actions">
            <label className="action-btn primary-btn upload-tracker-btn" htmlFor="dashboard-file-upload">
              <UploadCloud size={16} />
              <span>{isUploadingTracker ? 'Uploading Workbook...' : 'Upload Effort Tracker (.xlsx)'}</span>
            </label>
            <input 
              id="dashboard-file-upload" 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={handleTrackerFileUpload} 
              style={{ display: 'none' }} 
              disabled={isUploadingTracker}
            />
          </div>
        </div>
      )}

      {/* Executive KPI Overview Cards */}
      <section className="dashboard-kpi-grid">
        <div className="kpi-card glass-panel kpi-blue">
          <div className="kpi-icon-wrap">
            <Clock size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Total Sprint Hours</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{analytics?.totalHours || 0}<span className="kpi-unit">h</span></h3>
              <span className="kpi-subtext">{analytics?.totalRows || 0} entries</span>
            </div>
            <p className="kpi-footer-note">
              Avg <strong>{analytics?.avgHoursPerDeveloper || 0}h</strong> / active developer
            </p>
          </div>
        </div>

        <div className="kpi-card glass-panel kpi-purple">
          <div className="kpi-icon-wrap">
            <Briefcase size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Unique Tickets Worked</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{analytics?.totalUniqueTickets || 0}</h3>
              <span className="kpi-subtext">Active tickets</span>
            </div>
            <p className="kpi-footer-note">
              Avg <strong>{analytics?.avgHoursPerTicket || 0}h</strong> spent / ticket
            </p>
          </div>
        </div>

        <div className="kpi-card glass-panel kpi-green">
          <div className="kpi-icon-wrap">
            <CheckCheck size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Completed Tickets</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">
                {analytics?.totalCompletedTickets || 0}
                <span className="kpi-sub-fraction"> / {analytics?.totalUniqueTickets || 0}</span>
              </h3>
              <span className="kpi-badge-rate green">
                {analytics?.completionRate || 0}%
              </span>
            </div>
            <p className="kpi-footer-note">
              Verified by latest completion descriptions
            </p>
          </div>
        </div>

        <div className="kpi-card glass-panel kpi-amber">
          <div className="kpi-icon-wrap">
            <Users size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Active Engineers</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{analytics?.activeDevelopersCount || 0}</h3>
              <span className="kpi-subtext">Contributing</span>
            </div>
            <p className="kpi-footer-note">
              100% active reporting this sprint
            </p>
          </div>
        </div>

        {/* Productive vs Overhead Ratio KPI */}
        <div className="kpi-card glass-panel kpi-teal" title="Overhead includes standups, calls, and N/A. Productive includes dev, PR comments, QA, and tickets.">
          <div className="kpi-icon-wrap">
            <PieChart size={22} />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">Productive / Overhead</span>
            <div className="kpi-value-row">
              <h3 className="kpi-value">{analytics?.teamProductivePercentage || 0}<span className="kpi-unit">%</span></h3>
              <span className="kpi-subtext">Productive ({analytics?.teamProductiveHours || 0}h)</span>
            </div>
            <div className="kpi-ratio-bar-track">
              <div 
                className="kpi-ratio-bar-fill productive" 
                style={{ width: `${analytics?.teamProductivePercentage || 0}%` }}
                title={`Productive: ${analytics?.teamProductiveHours || 0}h (${analytics?.teamProductivePercentage || 0}%)`}
              ></div>
              <div 
                className="kpi-ratio-bar-fill overhead" 
                style={{ width: `${analytics?.teamOverheadPercentage || 0}%` }}
                title={`Overhead: ${analytics?.teamOverheadHours || 0}h (${analytics?.teamOverheadPercentage || 0}%)`}
              ></div>
            </div>
            <p className="kpi-footer-note">
              Overhead: <strong>{analytics?.teamOverheadHours || 0}h</strong> ({analytics?.teamOverheadPercentage || 0}%) calls & standups
            </p>
          </div>
        </div>
      </section>

      {/* Quality and Compliance Checks (Sprint-wise) */}
      <section className="dashboard-compliance-section glass-panel">
        <div className="compliance-header-row">
          <div className="compliance-title-wrap">
            <div className={`compliance-title-icon-wrap ${
              (analytics?.complianceReport?.complianceScore || 100) >= 90 ? 'good' :
              (analytics?.complianceReport?.complianceScore || 100) >= 75 ? 'warn' : 'danger'
            }`}>
              {(analytics?.complianceReport?.complianceScore || 100) >= 90 ? (
                <ShieldCheck size={26} />
              ) : (
                <ShieldAlert size={26} />
              )}
            </div>
            <div>
              <div className="compliance-badge-row">
                <span className={`compliance-health-pill ${
                  (analytics?.complianceReport?.complianceScore || 100) >= 90 ? 'good' :
                  (analytics?.complianceReport?.complianceScore || 100) >= 75 ? 'warn' : 'danger'
                }`}>
                  <span className="status-dot"></span>
                  Sprint Compliance Health: <strong>{analytics?.complianceReport?.complianceScore || 0}%</strong>
                </span>
                <span className="compliance-total-issues-pill">
                  {analytics?.complianceReport?.totalIssues || 0} compliance items flagged
                </span>
              </div>
              <h3 className="section-heading">Quality & Compliance Audit (Sprint {selectedSprint})</h3>
              <p className="section-hint">
                Automated auditing: missing logs on active team days, under/over-logging anomalies (&lt;4h or &gt;10h), and missing categories or descriptions.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Cards Row */}
        <div className="compliance-tabs-grid">
          <div 
            className={`compliance-tab-card ${complianceTab === 'all' ? 'active' : ''}`}
            onClick={() => setComplianceTab('all')}
            role="button"
            tabIndex={0}
          >
            <div className="compliance-tab-top">
              <span className="compliance-tab-title">All Compliance Alerts</span>
              <span className="compliance-count-chip total">{complianceReport?.totalIssues || 0}</span>
            </div>
            <p className="compliance-tab-desc">Combined audit overview for sprint {selectedSprint}</p>
          </div>

          <div 
            className={`compliance-tab-card ${complianceTab === 'missingLogs' ? 'active' : ''}`}
            onClick={() => setComplianceTab('missingLogs')}
            role="button"
            tabIndex={0}
          >
            <div className="compliance-tab-top">
              <span className="compliance-tab-title">Missing Logs</span>
              <span className="compliance-count-chip missing">{complianceReport?.missingLogsCount || 0}</span>
            </div>
            <p className="compliance-tab-desc">Person-days with 0 entries on active team sprint dates</p>
          </div>

          <div 
            className={`compliance-tab-card ${complianceTab === 'hoursAnomalies' ? 'active' : ''}`}
            onClick={() => setComplianceTab('hoursAnomalies')}
            role="button"
            tabIndex={0}
          >
            <div className="compliance-tab-top">
              <span className="compliance-tab-title">Under / Over Logging</span>
              <span className="compliance-count-chip hours">{complianceReport?.hoursAnomaliesCount || 0}</span>
            </div>
            <p className="compliance-tab-desc">Daily logs under 4.0h or over 10.0h threshold</p>
          </div>

          <div 
            className={`compliance-tab-card ${complianceTab === 'missingFields' ? 'active' : ''}`}
            onClick={() => setComplianceTab('missingFields')}
            role="button"
            tabIndex={0}
          >
            <div className="compliance-tab-top">
              <span className="compliance-tab-title">Missing Fields</span>
              <span className="compliance-count-chip fields">{complianceReport?.missingFieldsCount || 0}</span>
            </div>
            <p className="compliance-tab-desc">Rows with blank category or empty description</p>
          </div>
        </div>

        {/* Filter Toolbar for Compliance */}
        <div className="compliance-toolbar">
          <div className="compliance-filter-group">
            <label className="compliance-filter-label" htmlFor="compliance-dev-filter">
              <Filter size={13} /> Filter Engineer:
            </label>
            <select
              id="compliance-dev-filter"
              className="compliance-select"
              value={complianceDevFilter}
              onChange={(e) => setComplianceDevFilter(e.target.value)}
            >
              <option value="All">All Engineers ({devList.length})</option>
              {devList.map(d => (
                <option key={d.name} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="compliance-search-group">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Filter alerts by developer, date, ticket, or keyword..."
              value={complianceSearch}
              onChange={(e) => setComplianceSearch(e.target.value)}
              className="compliance-search-input"
            />
            {complianceSearch && (
              <button className="search-clear-btn" onClick={() => setComplianceSearch('')}>✕</button>
            )}
          </div>
        </div>

        {/* Alerts Listing */}
        <div className="compliance-alerts-container">
          {totalFilteredComplianceCount === 0 ? (
            <div className="compliance-empty-state">
              <CheckCircle2 size={32} className="compliance-empty-icon" />
              <div>
                <h4 className="compliance-empty-title">Clean Compliance Status</h4>
                <p className="compliance-empty-subtitle">
                  {complianceDevFilter !== 'All' 
                    ? `No compliance flags detected for ${complianceDevFilter} in this view.` 
                    : 'All sprint entries comply with logging hours, active-day coverage, and field requirements.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="compliance-alerts-list">
              {/* 1. Missing Logs Section */}
              {(complianceTab === 'all' || complianceTab === 'missingLogs') && (
                <div className="compliance-group">
                  <div className="compliance-group-header">
                    <div className="compliance-group-title-wrap">
                      <Calendar size={16} className="text-rose" />
                      <h4 className="compliance-group-title">
                        Missing Logs ({filteredMissingLogs.length} person-days)
                      </h4>
                    </div>

                    {/* Options to display alerts with no reason vs all vs with reason */}
                    <div className="missing-log-filter-toggles">
                      <button
                        type="button"
                        className={`reason-filter-btn ${missingLogReasonFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setMissingLogReasonFilter('all')}
                        title="Display all flagged missing logs"
                      >
                        All Missing ({missingLogs.length})
                      </button>
                      <button
                        type="button"
                        className={`reason-filter-btn no-reason ${missingLogReasonFilter === 'noReason' ? 'active' : ''}`}
                        onClick={() => setMissingLogReasonFilter('noReason')}
                        title="Display only alerts with no reason provided"
                      >
                        ⚠️ No Reason ({missingLogsNoReasonCount})
                      </button>
                      <button
                        type="button"
                        className={`reason-filter-btn with-reason ${missingLogReasonFilter === 'withReason' ? 'active' : ''}`}
                        onClick={() => setMissingLogReasonFilter('withReason')}
                        title="Display only alerts that have a documented reason"
                      >
                        ✓ Reason Given ({missingLogsWithReasonCount})
                      </button>
                    </div>
                  </div>

                  {reasonNotice && (
                    <div className="compliance-notice-banner animate-fade-in">
                      <Check size={15} />
                      <span>{reasonNotice}</span>
                    </div>
                  )}

                  {filteredMissingLogs.length === 0 ? (
                    <div className="missing-logs-empty-sub">
                      <CheckCircle2 size={18} className="text-teal" />
                      <span>
                        {missingLogReasonFilter === 'noReason'
                          ? 'Great! All flagged missing logs currently have a reason provided.'
                          : missingLogReasonFilter === 'withReason'
                          ? 'No missing logs have a documented reason yet for this filter.'
                          : 'No missing logs match this filter.'}
                      </span>
                    </div>
                  ) : (
                    <div className="compliance-items-grid">
                      {filteredMissingLogs.map((item, idx) => {
                        const alertKey = `${item.developer}_${item.date}`;
                        const isEditing = editingAlertKey === alertKey;
                        const hasReason = Boolean(item.reason && item.reason.trim());

                        return (
                          <div 
                            key={`missing-${item.developer}-${item.date}-${idx}`} 
                            className={`compliance-alert-card missing-log-card ${hasReason ? 'has-reason' : 'no-reason'}`}
                          >
                            <div className="compliance-card-top">
                              <div className="compliance-dev-identity">
                                <div className="compliance-dev-avatar">
                                  {item.developer.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="compliance-dev-name">{item.developer}</span>
                                  <span className="compliance-card-sub">{item.dayOfWeek}</span>
                                </div>
                              </div>

                              {hasReason ? (
                                <span className="compliance-badge badge-reason-documented" title={`Reason: ${item.reason}`}>
                                  <Check size={12} /> {item.reason}
                                </span>
                              ) : (
                                <span className="compliance-badge badge-missing-log">
                                  <AlertCircle size={12} /> No Reason Provided
                                </span>
                              )}
                            </div>

                            <div className="compliance-card-body">
                              <div className="compliance-metric-row">
                                <span className="metric-tag date">
                                  <Calendar size={12} /> {item.date} ({item.dayOfWeek})
                                </span>
                                <span className="metric-tag zero-hours">0.0h recorded</span>
                                {hasReason && (
                                  <span className="metric-tag tag-reason-pill">
                                    <Tag size={11} /> {item.reason}
                                  </span>
                                )}
                              </div>

                              {hasReason ? (
                                <div className="documented-reason-box">
                                  <div className="documented-reason-header">
                                    <span className="reason-label">Reason: <strong>{item.reason}</strong></span>
                                    {item.updatedAt && (
                                      <span className="reason-time">Updated {item.updatedAt}</span>
                                    )}
                                  </div>
                                  {item.comment ? (
                                    <p className="documented-reason-comment">"{item.comment}"</p>
                                  ) : (
                                    <p className="documented-reason-empty-comment">No additional comment attached.</p>
                                  )}
                                </div>
                              ) : (
                                <p className="compliance-reason-text">
                                  No EOD entry found for <strong>{item.developer}</strong> on <strong>{item.date}</strong> while team was active. No reason given yet.
                                </p>
                              )}
                            </div>

                            <div className="compliance-card-footer missing-log-footer">
                              {isEditing ? (
                                <div className="inline-reason-form animate-fade-in">
                                  <div className="reason-form-title-row">
                                    <span className="reason-form-title">
                                      <Tag size={13} /> Set Reason for {item.developer} ({item.date}):
                                    </span>
                                    <button 
                                      type="button"
                                      className="reason-close-btn" 
                                      onClick={handleCancelReasonEditor}
                                      title="Cancel"
                                    >
                                      ✕
                                    </button>
                                  </div>

                                  <div className="reason-chips-grid">
                                    {PRESET_REASONS.map(r => (
                                      <button
                                        key={r}
                                        type="button"
                                        className={`reason-chip-btn ${reasonCategory === r ? 'selected' : ''}`}
                                        onClick={() => setReasonCategory(r)}
                                      >
                                        {r}
                                      </button>
                                    ))}
                                  </div>

                                  {reasonCategory === 'Other' && (
                                    <input
                                      type="text"
                                      className="custom-reason-input"
                                      placeholder="Specify custom reason (e.g. Joined mid-sprint, Travel, Emergency)..."
                                      value={customReasonText}
                                      onChange={(e) => setCustomReasonText(e.target.value)}
                                      autoFocus
                                    />
                                  )}

                                  <textarea
                                    className="reason-comment-input"
                                    placeholder="Add optional notes (e.g. Planned annual leave approved by manager)..."
                                    rows={2}
                                    value={reasonComment}
                                    onChange={(e) => setReasonComment(e.target.value)}
                                  />

                                  <div className="reason-form-actions">
                                    <button
                                      type="button"
                                      className="action-btn primary-btn reason-save-btn"
                                      onClick={() => handleSaveReason(item)}
                                      disabled={isSavingReason}
                                    >
                                      {isSavingReason ? 'Saving...' : 'Save Reason'}
                                    </button>
                                    <button
                                      type="button"
                                      className="action-btn secondary-btn reason-cancel-btn"
                                      onClick={handleCancelReasonEditor}
                                      disabled={isSavingReason}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="missing-log-actions-row">
                                  <button
                                    type="button"
                                    className={`action-btn reason-action-btn ${hasReason ? 'edit' : 'give'}`}
                                    onClick={() => handleOpenReasonEditor(item)}
                                    title={hasReason ? 'Update documented reason' : 'Give reason for missing log'}
                                  >
                                    <MessageSquare size={13} /> {hasReason ? 'Edit Reason' : '+ Give Reason'}
                                  </button>

                                  {hasReason && (
                                    <button
                                      type="button"
                                      className="action-btn reason-action-btn clear"
                                      onClick={() => handleClearReason(item)}
                                      title="Remove reason"
                                    >
                                      <Trash2 size={13} /> Clear
                                    </button>
                                  )}

                                  {!hasReason && (
                                    <span className="compliance-action-hint">Awaiting reason</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 2. Hours Anomalies Section (Under / Over Logging) */}
              {(complianceTab === 'all' || complianceTab === 'hoursAnomalies') && filteredHoursAnomalies.length > 0 && (
                <div className="compliance-group">
                  <div className="compliance-group-header">
                    <div className="compliance-group-title-wrap">
                      <Clock size={16} className="text-amber" />
                      <h4 className="compliance-group-title">Under / Over Logging Anomalies ({filteredHoursAnomalies.length} days)</h4>
                    </div>
                    <span className="compliance-rule-note">
                      Rule: Flagged if daily logged effort is under 4.0h or over 10.0h.
                    </span>
                  </div>

                  <div className="compliance-items-grid">
                    {filteredHoursAnomalies.map((item, idx) => {
                      const isUnder = item.type === 'UNDER_LOGGING';
                      return (
                        <div key={`hours-${item.developer}-${item.date}-${idx}`} className={`compliance-alert-card ${isUnder ? 'under-log-card' : 'over-log-card'}`}>
                          <div className="compliance-card-top">
                            <div className="compliance-dev-identity">
                              <div className="compliance-dev-avatar">
                                {item.developer.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="compliance-dev-name">{item.developer}</span>
                                <span className="compliance-card-sub">Daily Total: {item.hours}h</span>
                              </div>
                            </div>
                            <span className={`compliance-badge ${isUnder ? 'badge-under-log' : 'badge-over-log'}`}>
                              <AlertTriangle size={12} /> {isUnder ? 'Under-logged (<4h)' : 'Over-logged (>10h)'}
                            </span>
                          </div>

                          <div className="compliance-card-body">
                            <div className="compliance-metric-row">
                              <span className="metric-tag date">
                                <Calendar size={12} /> {item.date}
                              </span>
                              <span className={`metric-tag hours-val ${isUnder ? 'under' : 'over'}`}>
                                <strong>{item.hours}</strong> hrs logged
                              </span>
                            </div>
                            <p className="compliance-reason-text">
                              {item.message || (isUnder ? `Logged only ${item.hours}h (below 4h threshold)` : `Logged ${item.hours}h (above 10h threshold)`)}
                            </p>
                          </div>

                          <div className="compliance-card-footer">
                            <span className="compliance-action-hint">
                              {isUnder ? 'Action: Review if tasks/calls were omitted from sheet' : 'Action: Verify extended hours or overtime authorization'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Missing Fields Section */}
              {(complianceTab === 'all' || complianceTab === 'missingFields') && filteredMissingFields.length > 0 && (
                <div className="compliance-group">
                  <div className="compliance-group-header">
                    <div className="compliance-group-title-wrap">
                      <FileWarning size={16} className="text-orange" />
                      <h4 className="compliance-group-title">Missing Fields ({filteredMissingFields.length} rows)</h4>
                    </div>
                    <span className="compliance-rule-note">
                      Rule: Flagged when category is blank or description is missing.
                    </span>
                  </div>

                  <div className="compliance-items-grid">
                    {filteredMissingFields.map((item, idx) => (
                      <div key={`field-${item.developer}-${item.date}-${idx}`} className="compliance-alert-card missing-field-card">
                        <div className="compliance-card-top">
                          <div className="compliance-dev-identity">
                            <div className="compliance-dev-avatar">
                              {item.developer.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="compliance-dev-name">{item.developer}</span>
                              <span className="compliance-card-sub">{item.date}</span>
                            </div>
                          </div>
                          <span className="compliance-badge badge-missing-field">
                            <FileWarning size={12} /> {item.missingField === 'CATEGORY' ? 'Missing Category' : item.missingField === 'DESCRIPTION' ? 'Missing Description' : 'Missing Fields'}
                          </span>
                        </div>

                        <div className="compliance-card-body">
                          <div className="compliance-metric-row">
                            <span className="metric-tag date">
                              <Calendar size={12} /> {item.date}
                            </span>
                            {item.ticket && (
                              <span className="metric-tag ticket-chip">
                                #{item.ticket}
                              </span>
                            )}
                            <span className="metric-tag cat-warning">
                              Cat: <strong>{item.category || 'Missing'}</strong>
                            </span>
                          </div>
                          <p className="compliance-reason-text description-quote">
                            "{item.description || '<Empty Description>'}"
                          </p>
                        </div>

                        <div className="compliance-card-footer">
                          <span className="compliance-action-hint">
                            Action: Enter missing category or description in the sprint sheet
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Rankings & Leaderboards Section */}
      <section className="dashboard-rankings-section">
        <div className="section-heading-row">
          <div className="section-title-wrap">
            <Trophy className="section-heading-icon yellow" size={20} />
            <h3 className="section-heading">Sprint Leaderboards & Rankings</h3>
          </div>
          <span className="section-hint">Updated from all logged entries in sheet {selectedSprint}</span>
        </div>

        <div className="rankings-grid">
          {/* Hours Leaderboard */}
          <div className="ranking-card glass-panel">
            <div className="ranking-card-header">
              <div className="ranking-badge-icon hours">
                <Flame size={18} />
              </div>
              <div>
                <h4 className="ranking-title">Top Hours Logged</h4>
                <p className="ranking-subtitle">Ranked by total sprint hours invested</p>
              </div>
            </div>

            <div className="ranking-list">
              {analytics?.hoursLeaderboard?.map((item, idx) => {
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;
                return (
                  <div 
                    key={item.name} 
                    className={`ranking-row ${isTop1 ? 'top-1' : isTop2 ? 'top-2' : isTop3 ? 'top-3' : ''}`}
                    onClick={() => setSelectedDeveloper(item.name)}
                    title={`Click to view ${item.name}'s ticket breakdown`}
                  >
                    <div className="rank-position">
                      {isTop1 ? (
                        <span className="rank-medal gold">🥇 1</span>
                      ) : isTop2 ? (
                        <span className="rank-medal silver">🥈 2</span>
                      ) : isTop3 ? (
                        <span className="rank-medal bronze">🥉 3</span>
                      ) : (
                        <span className="rank-number">#{item.rank}</span>
                      )}
                    </div>

                    <div className="rank-dev-info">
                      <div className="rank-dev-name-row">
                        <span className="rank-dev-name">{item.name}</span>
                        <span className="rank-dev-share">{item.percentOfTeamHours}% team effort</span>
                      </div>
                      
                      {/* Effort bar */}
                      <div className="rank-progress-bar-bg">
                        <div 
                          className="rank-progress-bar-fill hours-fill" 
                          style={{ width: `${Math.min(100, item.percentOfTeamHours * 2.5)}%` }}
                        ></div>
                      </div>

                      <div className="rank-dev-submeta">
                        <span><Code2 size={12} /> {item.ticketHours}h dev</span>
                        <span>•</span>
                        <span><PhoneCall size={12} /> {item.callHours}h calls</span>
                        <span>•</span>
                        <span>{item.uniqueTicketsCount} tickets</span>
                        <span>•</span>
                        <span className="rank-submeta-prod" title={`Productive: ${devMap.get(item.name)?.productiveHours || 0}h (${devMap.get(item.name)?.productivePercentage || 0}%) | Overhead: ${devMap.get(item.name)?.overheadHours || 0}h`}>
                          <PieChart size={12} className="text-teal" /> {devMap.get(item.name)?.productivePercentage || 0}% prod
                        </span>
                      </div>
                    </div>

                    <div className="rank-metric-value hours">
                      <span className="metric-num">{item.totalHours}</span>
                      <span className="metric-unit">hrs</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ticket Completion Leaderboard */}
          <div className="ranking-card glass-panel">
            <div className="ranking-card-header">
              <div className="ranking-badge-icon completions">
                <Award size={18} />
              </div>
              <div>
                <h4 className="ranking-title">Top Ticket Finishers</h4>
                <p className="ranking-subtitle">Ranked by tickets completed in this sprint</p>
              </div>
            </div>

            <div className="ranking-list">
              {analytics?.completionLeaderboard?.map((item, idx) => {
                const isTop1 = idx === 0 && item.completedTicketsCount > 0;
                const isTop2 = idx === 1 && item.completedTicketsCount > 0;
                const isTop3 = idx === 2 && item.completedTicketsCount > 0;
                return (
                  <div 
                    key={item.name} 
                    className={`ranking-row ${isTop1 ? 'top-1' : isTop2 ? 'top-2' : isTop3 ? 'top-3' : ''}`}
                    onClick={() => setSelectedDeveloper(item.name)}
                    title={`Click to view ${item.name}'s ticket breakdown`}
                  >
                    <div className="rank-position">
                      {isTop1 ? (
                        <span className="rank-medal gold">🥇 1</span>
                      ) : isTop2 ? (
                        <span className="rank-medal silver">🥈 2</span>
                      ) : isTop3 ? (
                        <span className="rank-medal bronze">🥉 3</span>
                      ) : (
                        <span className="rank-number">#{item.rank}</span>
                      )}
                    </div>

                    <div className="rank-dev-info">
                      <div className="rank-dev-name-row">
                        <span className="rank-dev-name">{item.name}</span>
                        <span className={`rank-completion-rate-pill ${item.completionRate >= 50 ? 'high' : 'normal'}`}>
                          {item.completionRate}% completion rate
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="rank-progress-bar-bg">
                        <div 
                          className="rank-progress-bar-fill completion-fill" 
                          style={{ width: `${Math.min(100, item.completionRate)}%` }}
                        ></div>
                      </div>

                      <div className="rank-dev-submeta">
                        <span>{item.completedTicketsCount} of {item.totalTicketsWorked} tickets finished</span>
                        <span>•</span>
                        <span>{item.totalHours}h logged</span>
                      </div>
                    </div>

                    <div className="rank-metric-value completions">
                      <span className="metric-num">{item.completedTicketsCount}</span>
                      <span className="metric-unit">done</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Sprint Velocity & Story Points (Azure DevOps) Section */}
      <section className="dashboard-storypoints-section glass-panel">
        <div className="section-heading-row sp-heading-row">
          <div className="section-title-wrap">
            <Zap className="section-heading-icon cyan" size={20} />
            <div>
              <h3 className="section-heading">Sprint Story Points & Velocity (Azure DevOps)</h3>
              <p className="section-hint">
                Calculated directly from Azure DevOps boards for sprint <strong>{storyPointsReport?.sprintName || selectedSprint}</strong>: strictly includes tickets in <strong>Closed</strong> or <strong>Testing</strong> state.
              </p>
            </div>
          </div>
          <div className="sp-header-actions">
            <span className="sp-badge-live">
              <span className="live-dot pulse"></span>
              Live ADO Iteration: <strong>{storyPointsReport?.sprintName || selectedSprint}</strong>
            </span>
            <button
              type="button"
              className="action-btn secondary-btn sp-refresh-btn"
              onClick={() => loadStoryPoints(selectedSprint)}
              disabled={isLoadingStoryPoints}
              title="Refresh story points from Azure DevOps"
            >
              <RefreshCw size={13} className={isLoadingStoryPoints ? 'animate-spin' : ''} />
              {isLoadingStoryPoints ? 'Refreshing...' : 'Refresh ADO'}
            </button>
          </div>
        </div>

        {/* Story Points Summary KPI Row */}
        <div className="sp-kpis-grid">
          <div className="sp-kpi-card sp-kpi-cyan">
            <span className="sp-kpi-label">Sprint Story Points</span>
            <div className="sp-kpi-val-row">
              <span className="sp-kpi-val">{storyPointsReport?.totalSprintStoryPoints ?? 0}</span>
              <span className="sp-kpi-unit">SP</span>
            </div>
            <span className="sp-kpi-sub">Across Closed & Testing tickets</span>
          </div>

          <div className="sp-kpi-card sp-kpi-green">
            <span className="sp-kpi-label">Closed Tickets</span>
            <div className="sp-kpi-val-row">
              <span className="sp-kpi-val">{storyPointsReport?.totalClosedTickets ?? 0}</span>
              <span className="sp-kpi-unit">tickets</span>
            </div>
            <span className="sp-kpi-sub">Verified & Closed in ADO</span>
          </div>

          <div className="sp-kpi-card sp-kpi-purple">
            <span className="sp-kpi-label">Testing Tickets</span>
            <div className="sp-kpi-val-row">
              <span className="sp-kpi-val">{storyPointsReport?.totalTestingTickets ?? 0}</span>
              <span className="sp-kpi-unit">tickets</span>
            </div>
            <span className="sp-kpi-sub">In Testing / Ready for QA</span>
          </div>

          <div className="sp-kpi-card sp-kpi-amber">
            <span className="sp-kpi-label">Active Assignees</span>
            <div className="sp-kpi-val-row">
              <span className="sp-kpi-val">
                {storyPointsReport?.resources?.filter(r => r.resourceName !== 'Unassigned').length ?? 0}
              </span>
              <span className="sp-kpi-unit">engineers</span>
            </div>
            <span className="sp-kpi-sub">Delivering story points</span>
          </div>
        </div>

        {/* Global Expand / Collapse Control */}
        <div className="sp-controls-bar">
          <div className="sp-counts-summary">
            <span>
              Showing <strong>{storyPointsReport?.resources?.length || 0}</strong> resources delivering{' '}
              <strong>{storyPointsReport?.totalTickets || 0}</strong> tickets ({storyPointsReport?.totalSprintStoryPoints || 0} SP total)
            </span>
          </div>
          <div className="sp-expand-buttons">
            <button
              type="button"
              className="sp-text-btn"
              onClick={() => expandAllStoryPointTickets(true)}
            >
              Expand All
            </button>
            <span className="sp-sep">•</span>
            <button
              type="button"
              className="sp-text-btn"
              onClick={() => expandAllStoryPointTickets(false)}
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Loading Banner */}
        {isLoadingStoryPoints && (
          <div className="sp-loading-banner animate-fade-in">
            <RefreshCw size={18} className="animate-spin text-cyan" />
            <span>Fetching live work items and story points from Azure DevOps...</span>
          </div>
        )}

        {/* Error Banner */}
        {storyPointsError && !isLoadingStoryPoints && (
          <div className="sp-error-banner animate-fade-in">
            <AlertTriangle size={18} className="text-amber" />
            <div>
              <strong>Could not load Azure DevOps story points:</strong> {storyPointsError}
            </div>
          </div>
        )}

        {/* Resources Grid */}
        {!isLoadingStoryPoints && !storyPointsError && (
          <div className="sp-resources-grid">
            {storyPointsReport?.resources?.length === 0 ? (
              <div className="sp-empty-state">
                <CheckCircle2 size={24} className="text-teal" />
                <span>No Closed or Testing tickets found in iteration {storyPointsReport?.sprintName || selectedSprint}.</span>
              </div>
            ) : (
              storyPointsReport?.resources?.map((res, idx) => {
                const isTop1 = idx === 0 && res.resourceName !== 'Unassigned' && res.totalStoryPoints > 0;
                const isTop2 = idx === 1 && res.resourceName !== 'Unassigned' && res.totalStoryPoints > 0;
                const isTop3 = idx === 2 && res.resourceName !== 'Unassigned' && res.totalStoryPoints > 0;
                const isUnassigned = res.resourceName === 'Unassigned';
                const isExpanded = Boolean(expandedResourceTickets[res.resourceName]);
                const percentOfTeam = (storyPointsReport.totalSprintStoryPoints > 0 && res.totalStoryPoints > 0)
                  ? Math.round((res.totalStoryPoints / storyPointsReport.totalSprintStoryPoints) * 100)
                  : 0;

                return (
                  <div 
                    key={res.resourceName} 
                    className={`sp-resource-card glass-panel ${isTop1 ? 'top-1' : isTop2 ? 'top-2' : isTop3 ? 'top-3' : ''} ${isUnassigned ? 'unassigned' : ''}`}
                  >
                    <div className="sp-resource-header">
                      <div className="sp-res-identity">
                        <div className="sp-res-avatar">
                          {isUnassigned ? '?' : res.resourceName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="sp-res-title-row">
                            <h4 className="sp-res-name">{res.resourceName}</h4>
                            {isTop1 && <span className="rank-medal gold">🥇 1st Velocity</span>}
                            {isTop2 && <span className="rank-medal silver">🥈 2nd</span>}
                            {isTop3 && <span className="rank-medal bronze">🥉 3rd</span>}
                          </div>
                          <span className="sp-res-sub">
                            {res.totalCount} ticket{res.totalCount !== 1 ? 's' : ''} ({res.closedCount} Closed, {res.testingCount} Testing)
                          </span>
                        </div>
                      </div>

                      <div className="sp-res-metric-badge">
                        <span className="sp-res-points-num">{res.totalStoryPoints}</span>
                        <span className="sp-res-points-unit">SP</span>
                      </div>
                    </div>

                    {/* Velocity Progress Bar */}
                    <div className="sp-progress-wrap">
                      <div className="sp-progress-labels">
                        <span>{percentOfTeam}% of Sprint Story Points</span>
                        <span>{res.totalStoryPoints} / {storyPointsReport.totalSprintStoryPoints} SP</span>
                      </div>
                      <div className="sp-progress-track">
                        <div 
                          className={`sp-progress-fill ${isUnassigned ? 'unassigned-fill' : ''}`}
                          style={{ width: `${percentOfTeam}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Toggle Ticket Details */}
                    <div className="sp-tickets-toggle-row">
                      <button
                        type="button"
                        className="sp-toggle-tickets-btn"
                        onClick={() => toggleResourceExpanded(res.resourceName)}
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp size={14} /> Hide Tickets ({res.tickets.length})
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> View Tickets ({res.tickets.length})
                          </>
                        )}
                      </button>
                      <span className="sp-mini-stats">
                        <span className="tag-closed">{res.closedCount} Closed</span>
                        <span className="tag-testing">{res.testingCount} Testing</span>
                      </span>
                    </div>

                    {/* Expandable Tickets List */}
                    {isExpanded && (
                      <div className="sp-tickets-list animate-fade-in">
                        {res.tickets.map(t => (
                          <div key={t.id} className="sp-ticket-row">
                            <div className="sp-ticket-left">
                              <a
                                href={t.url}
                                target="_blank"
                                rel="noreferrer"
                                className="sp-ticket-id-link"
                                title="Open ticket in Azure DevOps"
                              >
                                #{t.id}
                                <ExternalLink size={11} className="sp-ext-icon" />
                              </a>
                              <span className={`sp-type-pill ${(t.type || 'task').toLowerCase().replace(/\s+/g, '-')}`}>
                                {t.type}
                              </span>
                              <span className={`sp-state-pill ${(t.state || '').toLowerCase()}`}>
                                {t.state === 'Closed' ? '✓ Closed' : '🧪 Testing'}
                              </span>
                              <span className="sp-ticket-title" title={t.title}>
                                {t.title}
                              </span>
                            </div>

                            <div className="sp-ticket-right">
                              <span className={`sp-point-badge ${t.storyPoints > 0 ? 'has-points' : 'zero-points'}`}>
                                {t.storyPoints > 0 ? `${t.storyPoints} SP` : '0 SP'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Individual Developer Deep-Dive & Ticket Breakdown */}
      <section className="dashboard-individual-section glass-panel">
        <div className="individual-header-row">
          <div>
            <h3 className="section-heading">Individual Developer Work & Ticket Hours</h3>
            <p className="section-hint">
              Inspect how many tickets each engineer worked on, exact hours spent per ticket, and latest completion milestones.
            </p>
          </div>

          {/* Developer selector pills */}
          <div className="dev-filter-pills">
            <button
              className={`dev-filter-btn ${selectedDeveloper === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedDeveloper('All')}
            >
              All Engineers ({devList.length})
            </button>
            {devList.map(d => (
              <button
                key={d.name}
                className={`dev-filter-btn ${selectedDeveloper === d.name ? 'active' : ''}`}
                onClick={() => setSelectedDeveloper(d.name)}
              >
                {d.name} ({d.totalHours}h)
              </button>
            ))}
          </div>
        </div>

        {/* Developer Cards Grid */}
        <div className="developer-deep-dive-grid">
          {displayedDevelopers.map(dev => (
            <div key={dev.name} className="dev-card glass-panel">
              {/* Dev Card Top Summary */}
              <div className="dev-card-top">
                <div className="dev-avatar-wrap">
                  <div className="dev-avatar-circle">
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="dev-card-name">{dev.name}</h4>
                    <span className="dev-card-role">Software Engineer</span>
                  </div>
                </div>

                <div className="dev-card-stats-pills">
                  <span className="dev-stat-badge hours" title="Total hours logged in sprint">
                    <Clock size={13} /> {dev.totalHours}h Total
                  </span>
                  <span className="dev-stat-badge tickets" title="Unique tickets worked">
                    <Briefcase size={13} /> {dev.uniqueTicketsCount} Tickets
                  </span>
                  <span className="dev-stat-badge completed" title="Completed tickets">
                    <CheckCircle2 size={13} /> {dev.completedTicketsCount} Done ({dev.completionRate}%)
                  </span>
                </div>
              </div>

              {/* Productive vs. Overhead Ratio Split */}
              <div className="dev-productivity-ratio-box">
                <div className="dev-ratio-header">
                  <div className="dev-ratio-label-wrap">
                    <PieChart size={13} className="dev-ratio-icon" />
                    <span className="dev-ratio-heading">Productive vs. Overhead:</span>
                  </div>
                  <div className="dev-ratio-metrics">
                    <span className="ratio-badge-prod" title="Productive work: Dev, QA, PR comments, and Tickets">
                      <strong>{dev.productiveHours || 0}h</strong> Productive ({dev.productivePercentage || 0}%)
                    </span>
                    <span className="ratio-divider">|</span>
                    <span className="ratio-badge-over" title="Overhead work: Calls, standups, and N/A">
                      <strong>{dev.overheadHours || 0}h</strong> Overhead ({dev.overheadPercentage || 0}%)
                    </span>
                  </div>
                </div>

                <div className="dev-ratio-bar-track">
                  <div 
                    className="dev-ratio-bar-fill productive" 
                    style={{ width: `${dev.productivePercentage || 0}%` }}
                    title={`Productive: ${dev.productiveHours || 0}h (${dev.productivePercentage || 0}%)`}
                  ></div>
                  <div 
                    className="dev-ratio-bar-fill overhead" 
                    style={{ width: `${dev.overheadPercentage || 0}%` }}
                    title={`Overhead: ${dev.overheadHours || 0}h (${dev.overheadPercentage || 0}%)`}
                  ></div>
                </div>

                <div className="dev-ratio-subnote">
                  <span>Productive: development, QA, PR comments & tickets</span>
                  <span>Overhead: calls, standups & N/A</span>
                </div>
              </div>

              {/* Category split for this developer */}
              <div className="dev-category-pills-row">
                {Object.entries(dev.categoryHours || {}).map(([cat, hrs]) => (
                  <span key={cat} className="dev-cat-pill">
                    <strong>{cat}:</strong> {hrs}h
                  </span>
                ))}
              </div>

              {/* Tickets Worked on Breakdown Table */}
              <div className="dev-tickets-container">
                <h5 className="dev-tickets-title">
                  <span>Tickets Breakdown & Hours Spent</span>
                  <span className="ticket-count-badge">{dev.tickets?.length || 0} items</span>
                </h5>

                {(!dev.tickets || dev.tickets.length === 0) ? (
                  <div className="dev-no-tickets">
                    <Info size={16} />
                    <span>No specific ticket IDs logged (logged mostly calls or non-ticket tasks).</span>
                  </div>
                ) : (
                  <div className="dev-tickets-table-wrap">
                    <table className="dev-tickets-table">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Hours Spent</th>
                          <th>Entries</th>
                          <th>Status</th>
                          <th>Milestone & Latest Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dev.tickets.map(ticket => (
                          <tr key={ticket.ticketId} className={ticket.completed ? 'completed-row' : ''}>
                            {/* Ticket ID */}
                            <td className="ticket-id-cell">
                              <span className="ticket-id-chip">#{ticket.ticketId}</span>
                            </td>

                            {/* Hours Spent */}
                            <td className="ticket-hours-cell">
                              <span className="ticket-hours-pill">
                                <strong>{ticket.totalHours}</strong> hrs
                              </span>
                            </td>

                            {/* Entry Count */}
                            <td className="ticket-entries-cell">
                              <span className="entry-count-tag">{ticket.entryCount}x</span>
                            </td>

                            {/* Status Badge */}
                            <td className="ticket-status-cell">
                              {ticket.completed ? (
                                <span className="status-badge completed" title={`Completed milestone: ${ticket.lastCompletedDate}`}>
                                  <CheckCircle2 size={13} /> Completed
                                </span>
                              ) : (
                                <span className="status-badge in-progress">
                                  <Clock size={13} /> In Progress
                                </span>
                              )}
                            </td>

                            {/* Milestone / Description */}
                            <td className="ticket-desc-cell">
                              {ticket.completed && ticket.lastCompletedDescription && (
                                <div className="last-completed-milestone-box" title="Last completed description milestone">
                                  <span className="milestone-label">Last Completed Note ({ticket.lastCompletedDate}):</span>
                                  <p className="milestone-text">"{ticket.lastCompletedDescription}"</p>
                                </div>
                              )}
                              <p className="latest-desc-text">
                                <span className="latest-label">Latest ({ticket.latestDate}):</span> {ticket.latestDescription || 'No description provided'}
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Managerial Insights: Category Breakdown & High-Effort Tickets */}
      <section className="dashboard-insights-grid">
        {/* Category Effort Distribution */}
        <div className="insight-card glass-panel">
          <div className="insight-card-header">
            <div className="insight-icon-wrap blue">
              <BarChart3 size={18} />
            </div>
            <div>
              <h4 className="insight-title">Category Effort Breakdown</h4>
              <p className="insight-subtitle">Distribution of sprint hours across activity types</p>
            </div>
          </div>

          <div className="category-distribution-list">
            {analytics?.categoryBreakdown?.map((cat) => (
              <div key={cat.category} className="cat-dist-row">
                <div className="cat-dist-header">
                  <span className="cat-name">{cat.category}</span>
                  <div className="cat-hours-group">
                    <span className="cat-hours"><strong>{cat.hours}</strong>h</span>
                    <span className="cat-percentage">({cat.percentage}%)</span>
                  </div>
                </div>

                <div className="cat-dist-bar-track">
                  <div 
                    className={`cat-dist-bar-fill ${
                      cat.category.toLowerCase().includes('dev') ? 'fill-dev' :
                      cat.category.toLowerCase().includes('call') ? 'fill-call' :
                      cat.category.toLowerCase().includes('qa') ? 'fill-qa' :
                      cat.category.toLowerCase().includes('pr') ? 'fill-pr' : 'fill-other'
                    }`}
                    style={{ width: `${Math.min(100, cat.percentage)}%` }}
                  ></div>
                </div>

                <div className="cat-dist-footer">
                  <span>{cat.entryCount} logged tasks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High-Effort Ticket Spotlight */}
        <div className="insight-card glass-panel">
          <div className="insight-card-header">
            <div className="insight-icon-wrap purple">
              <Flame size={18} />
            </div>
            <div className="insight-title-group">
              <h4 className="insight-title">High-Effort Ticket Spotlight</h4>
              <p className="insight-subtitle">Tickets consuming the highest cumulative hours across the team</p>
            </div>
          </div>

          {/* Ticket search filter */}
          <div className="ticket-search-bar">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search high-effort tickets by ID, developer, or keyword..."
              value={ticketSearch}
              onChange={(e) => setTicketSearch(e.target.value)}
              className="ticket-search-input"
            />
            {ticketSearch && (
              <button className="search-clear-btn" onClick={() => setTicketSearch('')}>✕</button>
            )}
          </div>

          <div className="spotlight-tickets-list">
            {highEffortTickets.map((ticket, idx) => (
              <div key={ticket.ticketId} className="spotlight-ticket-item">
                <div className="spotlight-ticket-top">
                  <div className="spotlight-ticket-title-row">
                    <span className="spotlight-rank">#{idx + 1}</span>
                    <span className="spotlight-ticket-id">Ticket #{ticket.ticketId}</span>
                    {ticket.completed ? (
                      <span className="status-badge completed">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    ) : (
                      <span className="status-badge in-progress">
                        <Clock size={12} /> In Progress
                      </span>
                    )}
                  </div>

                  <div className="spotlight-hours-badge">
                    <strong>{ticket.totalHours}</strong> hrs
                  </div>
                </div>

                {/* Latest / Completed Description */}
                <p className="spotlight-desc">
                  {ticket.lastCompletedDescription 
                    ? `✓ Completed Note: "${ticket.lastCompletedDescription}"`
                    : ticket.latestDescription || 'No description entered'}
                </p>

                {/* Contributors & their hours */}
                <div className="spotlight-contributors-row">
                  <span className="contributors-label">Contributors:</span>
                  <div className="contributors-chips">
                    {ticket.contributors?.map(c => (
                      <span key={c} className="contributor-pill">
                        {c} <strong>({ticket.developerHours?.[c] || 0}h)</strong>
                      </span>
                    ))}
                  </div>
                  <span className="spotlight-date">Latest: {ticket.latestDate}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sprint Velocity & Daily Effort Timeline */}
      <section className="dashboard-velocity-section glass-panel">
        <div className="velocity-header-row">
          <div className="velocity-title-wrap">
            <TrendingUp className="section-heading-icon green" size={20} />
            <div>
              <h3 className="section-heading">Sprint Velocity & Daily Effort Timeline</h3>
              <p className="section-hint">Stacked day-by-day effort trend showing Development, Calls, and Team Activity</p>
            </div>
          </div>

          <div className="velocity-legend">
            <span className="legend-item"><span className="legend-dot dev"></span> Development & Tickets</span>
            <span className="legend-item"><span className="legend-dot call"></span> Standups & Calls</span>
            <span className="legend-item"><span className="legend-dot other"></span> QA / Chat / Other</span>
          </div>
        </div>

        {/* Daily Timeline Bars */}
        <div className="velocity-timeline-grid">
          {analytics?.dailyVelocity?.map((day) => {
            const maxDay = 45; // scale factor
            const devPct = (day.devHours / maxDay) * 100;
            const callPct = (day.callHours / maxDay) * 100;
            const otherPct = (day.otherHours / maxDay) * 100;

            return (
              <div key={day.date} className="velocity-day-card">
                <div className="velocity-day-date">{day.date}</div>

                {/* Stacked bar visualization */}
                <div className="velocity-stacked-bar-track">
                  <div 
                    className="velocity-bar-seg dev" 
                    style={{ height: `${devPct}%` }}
                    title={`Development: ${day.devHours}h`}
                  ></div>
                  <div 
                    className="velocity-bar-seg call" 
                    style={{ height: `${callPct}%` }}
                    title={`Calls: ${day.callHours}h`}
                  ></div>
                  <div 
                    className="velocity-bar-seg other" 
                    style={{ height: `${otherPct}%` }}
                    title={`Other: ${day.otherHours}h`}
                  ></div>
                </div>

                <div className="velocity-day-total">
                  <strong>{day.totalHours}</strong>h
                </div>

                <div className="velocity-contributors-list" title={`Active: ${day.contributors?.join(', ')}`}>
                  {day.contributors?.length || 0} active
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
