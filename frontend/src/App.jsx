import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  AlertTriangle, 
  X, 
  Layers, 
  TrendingUp, 
  Clock, 
  Award, 
  Sparkles,
  Info
} from 'lucide-react';

import Header from './components/Header';
import DailyTaskForm from './components/DailyTaskForm';
import RecentEntriesTable from './components/RecentEntriesTable';
import FileUploadSection from './components/FileUploadSection';
import ConfigModal from './components/ConfigModal';
import DashboardView from './components/DashboardView';
import SyncStatusModal from './components/SyncStatusModal';

import { 
  fetchStatus, 
  fetchRecentEntries, 
  submitEodEntries, 
  uploadAndProcessFile 
} from './services/api';

function detectLatestSprint(sheets, fallback = '2.14.11.0') {
  if (!sheets || sheets.length === 0) return fallback;
  const pattern = /^(\d+)\.(\d+)\.(\d+)\.(\d+)/;
  const list = sheets
    .map(s => typeof s === 'string' ? s : s.name)
    .filter(n => pattern.test(n));
  if (list.length === 0) return fallback;
  list.sort((a, b) => {
    const ma = a.match(pattern);
    const mb = b.match(pattern);
    for (let i = 1; i <= 4; i++) {
      const va = parseInt(ma[i], 10);
      const vb = parseInt(mb[i], 10);
      if (va !== vb) return vb - va; // descending: newest first
    }
    return b.localeCompare(a);
  });
  return list[0];
}

const VERIFICATION_MAX_SECONDS = 75;

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('eod_theme') || 'dark');
  const [activeTab, setActiveTab] = useState('logger'); // 'logger' | 'dashboard'
  const [mode, setMode] = useState('direct'); // 'direct' | 'upload'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const [status, setStatus] = useState(null);
  const [activeSprint, setActiveSprint] = useState('2.14.11.0');
  const [targetSheet, setTargetSheet] = useState('2.14.11.0');
  const [teamMembers, setTeamMembers] = useState(['Aravindhan', 'Akshaya', 'Arun', 'Kriti', 'Abinaya', 'Uma']);
  const [categories, setCategories] = useState(['Development', 'QA', 'Internal calls', 'Client calls', 'Dev chat issue', 'PR comments', 'N/A']);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('eod_user') || 'Aravindhan');

  const [recentEntries, setRecentEntries] = useState([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Live SharePoint Online Verification States
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSeconds, setVerificationSeconds] = useState(0);
  const [pendingVerificationEntries, setPendingVerificationEntries] = useState([]);
  const [syncModalState, setSyncModalState] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'timeout'
    sheetName: '',
    entries: [],
    elapsedSeconds: 0
  });
  const [isRetryingVerification, setIsRetryingVerification] = useState(false);

  const verificationPollRef = useRef(null);
  const verificationTimerRef = useRef(null);

  // Apply theme to HTML
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eod_theme', theme);
  }, [theme]);

  // Initial load
  useEffect(() => {
    loadAppStatus();
  }, []);

  // Fetch recent entries when target sheet changes
  useEffect(() => {
    if (targetSheet) {
      loadRecentEntries(targetSheet);
    }
  }, [targetSheet]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      stopSharePointVerification();
    };
  }, []);

  const stopSharePointVerification = () => {
    if (verificationPollRef.current) {
      clearInterval(verificationPollRef.current);
      verificationPollRef.current = null;
    }
    if (verificationTimerRef.current) {
      clearInterval(verificationTimerRef.current);
      verificationTimerRef.current = null;
    }
    setIsVerifying(false);
  };

  const checkEntriesMatchInSharePoint = (fetchedEntries, submittedEntries) => {
    if (!submittedEntries || submittedEntries.length === 0) return true;
    if (!fetchedEntries || fetchedEntries.length === 0) return false;

    return submittedEntries.every(sub => {
      return fetchedEntries.some(item => {
        const userMatch = item.name && sub.name && item.name.trim().toLowerCase() === sub.name.trim().toLowerCase();
        const catMatch = item.category && sub.category && item.category.trim().toLowerCase() === sub.category.trim().toLowerCase();
        const subTicket = (sub.ticket || '').trim().toLowerCase();
        const itemTicket = (item.ticket || '').trim().toLowerCase();
        const ticketMatch = (!subTicket && !itemTicket) || (subTicket === itemTicket);
        const subHrs = parseFloat(sub.timeInHrs) || 0;
        const itemHrs = parseFloat(item.timeInHrs) || 0;
        const hrsMatch = Math.abs(subHrs - itemHrs) < 0.05;
        return userMatch && catMatch && ticketMatch && hrsMatch;
      });
    });
  };

  const startSharePointVerification = (sheetName, submittedEntries) => {
    stopSharePointVerification();
    setIsVerifying(true);
    setVerificationSeconds(0);
    setPendingVerificationEntries(submittedEntries);

    let elapsed = 0;
    verificationTimerRef.current = setInterval(() => {
      elapsed += 1;
      setVerificationSeconds(elapsed);

      if (elapsed >= VERIFICATION_MAX_SECONDS) {
        stopSharePointVerification();
        setSyncModalState({
          isOpen: true,
          type: 'timeout',
          sheetName,
          entries: submittedEntries,
          elapsedSeconds: elapsed
        });
      }
    }, 1000);

    const runPoll = async () => {
      try {
        const fetched = await fetchRecentEntries(sheetName, status?.configuredFilePath, 50, true);
        if (checkEntriesMatchInSharePoint(fetched, submittedEntries)) {
          stopSharePointVerification();
          setRecentEntries(fetched);
          triggerCelebration();
          setSyncModalState({
            isOpen: true,
            type: 'success',
            sheetName,
            entries: submittedEntries,
            elapsedSeconds: elapsed
          });
        }
      } catch (err) {
        console.warn('SharePoint verification poll warning:', err);
      }
    };

    // Poll every 4.5 seconds and an initial poll after 3.5 seconds
    verificationPollRef.current = setInterval(runPoll, 4500);
    setTimeout(runPoll, 3500);
  };

  const handleRetryCheck = async () => {
    setIsRetryingVerification(true);
    try {
      const effectiveSheet = syncModalState.sheetName || targetSheet;
      const fetched = await fetchRecentEntries(effectiveSheet, status?.configuredFilePath, 50, true);
      if (checkEntriesMatchInSharePoint(fetched, syncModalState.entries)) {
        setRecentEntries(fetched);
        triggerCelebration();
        setSyncModalState(prev => ({
          ...prev,
          type: 'success'
        }));
      } else {
        showToast('Submitted tasks are still in Power Automate queue. Please allow 30 more seconds and check again.', 'warning');
      }
    } catch (e) {
      showToast('Could not query SharePoint: ' + e.message, 'error');
    } finally {
      setIsRetryingVerification(false);
    }
  };

  const loadAppStatus = async (customPath = '') => {
    try {
      const data = await fetchStatus(customPath);
      setStatus(data);
      const detectedSprint = data.activeSprintName || detectLatestSprint(data.sheets);
      if (detectedSprint) {
        setActiveSprint(detectedSprint);
        setTargetSheet(detectedSprint);
      }
      if (data.teamMembers?.length) setTeamMembers(data.teamMembers);
      if (data.categories?.length) setCategories(data.categories);
      if (data.currentUser && !localStorage.getItem('eod_user')) {
        setCurrentUser(data.currentUser);
      }
      loadRecentEntries(detectedSprint || targetSheet, customPath);
    } catch (e) {
      showToast('Could not connect to Spring Boot backend. Please ensure server is running.', 'error');
    }
  };

  const loadRecentEntries = async (sheet, path = '', forceRefresh = false) => {
    setIsLoadingEntries(true);
    try {
      const entries = await fetchRecentEntries(sheet, path, 40, forceRefresh);
      setRecentEntries(entries);
    } catch (e) {
      console.warn('Could not load recent entries:', e);
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const handleToggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleChangeUser = (newUser) => {
    setCurrentUser(newUser);
    localStorage.setItem('eod_user', newUser);
  };

  const handleConfigSaved = (newPath, newUser) => {
    handleChangeUser(newUser);
    loadAppStatus(newPath);
    showToast('Settings saved successfully', 'success');
  };

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleSubmit = async ({ sheetName, createSheetIfMissing, entries }) => {
    setIsSubmitting(true);
    try {
      if (mode === 'direct') {
        const res = await submitEodEntries({
          filePath: status?.configuredFilePath,
          sheetName,
          createSheetIfMissing,
          entries
        });

        if (res.sharePointSynced) {
          showToast(
            res.message || `Dispatched ${res.rowsAdded} task(s) totaling ${res.totalHoursAdded}h to SharePoint Online via Cloud Automation!`,
            'success'
          );
          // Launch the live SharePoint Online verification loop!
          startSharePointVerification(sheetName, entries);
        } else {
          showToast(
            res.message || `Saved to local file (${res.rowsAdded} task(s)), but SharePoint sync was skipped.`,
            'warning'
          );
          loadRecentEntries(sheetName, status?.configuredFilePath, false);
          triggerCelebration();
        }
        loadAppStatus();
      } else {
        // Upload & Download mode
        if (!uploadedFile) {
          showToast('Please upload your Effort Tracker Excel file first.', 'error');
          setIsSubmitting(false);
          return;
        }
        await uploadAndProcessFile(uploadedFile, sheetName, createSheetIfMissing, entries);
        triggerCelebration();
        showToast('Updated Excel spreadsheet downloaded successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit entries', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute stats for current sprint
  const sprintRows = recentEntries.length;

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-notification ${toast.type} animate-fade-in`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header with Navigation */}
      <Header 
        status={status}
        activeSprint={activeSprint}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        mode={mode}
        onToggleMode={setMode}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Layout */}
      <main className="main-content">
        {activeTab === 'dashboard' ? (
          /* Team Analytics & Performance Dashboard Page */
          <DashboardView 
            activeSprint={activeSprint} 
            filePath={status?.configuredFilePath} 
            onTrackerUploaded={() => loadAppStatus()}
          />
        ) : (
          /* EOD Daily Task Logging Page */
          <>
            {/* Sprint Overview Bar */}
            <section className="sprint-overview-bar glass-panel">
              <div className="overview-metric">
                <div className="metric-icon-wrap blue">
                  <Layers size={18} />
                </div>
                <div>
                  <span className="metric-label">Active Sprint</span>
                  <h3 className="metric-value">{activeSprint}</h3>
                </div>
              </div>

              <div className="overview-metric">
                <div className="metric-icon-wrap green">
                  <Clock size={18} />
                </div>
                <div>
                  <span className="metric-label">Current User</span>
                  <h3 className="metric-value">{currentUser}</h3>
                </div>
              </div>

              <div className="overview-metric">
                <div className="metric-icon-wrap purple">
                  <Award size={18} />
                </div>
                <div>
                  <span className="metric-label">Total Sheet Rows</span>
                  <h3 className="metric-value">
                    {status?.sheets?.find(s => s.name === targetSheet)?.rowCount || sprintRows} entries
                  </h3>
                </div>
              </div>

              <div className="overview-metric">
                <div className="metric-icon-wrap amber">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="metric-label">Auto Backup Status</span>
                  <h3 className="metric-value">Protected</h3>
                </div>
              </div>
            </section>

            {/* Upload mode dropzone (if in upload mode) */}
            {mode === 'upload' && (
              <FileUploadSection 
                selectedFile={uploadedFile}
                onFileSelect={setUploadedFile}
                isDragActive={isDragActive}
                setIsDragActive={setIsDragActive}
              />
            )}

            {/* Daily Task Logging Form */}
            <section className="form-section">
              <DailyTaskForm 
                currentUser={currentUser}
                onChangeUser={handleChangeUser}
                teamMembers={teamMembers}
                categories={categories}
                sheets={status?.sheets || []}
                activeSprint={activeSprint}
                targetSheet={targetSheet}
                onChangeTargetSheet={setTargetSheet}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                mode={mode}
              />
            </section>

            {/* Recent Entries from Excel */}
            <section className="entries-section">
              <RecentEntriesTable 
                entries={recentEntries}
                currentUser={currentUser}
                targetSheet={targetSheet}
                isLoading={isLoadingEntries}
                onRefresh={(force) => loadRecentEntries(targetSheet, status?.configuredFilePath, force ?? true)}
                isVerifying={isVerifying}
                verificationSeconds={verificationSeconds}
                verificationMaxSeconds={VERIFICATION_MAX_SECONDS}
                pendingEntries={pendingVerificationEntries}
              />
            </section>
          </>
        )}
      </main>

      {/* Configuration Modal */}
      <ConfigModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentPath={status?.configuredFilePath}
        currentUser={currentUser}
        teamMembers={teamMembers}
        onConfigSaved={handleConfigSaved}
      />

      {/* Live SharePoint Cloud Sync Status / Timeout Modal */}
      <SyncStatusModal 
        isOpen={syncModalState.isOpen}
        type={syncModalState.type}
        sheetName={syncModalState.sheetName}
        entries={syncModalState.entries}
        elapsedSeconds={syncModalState.elapsedSeconds}
        onClose={() => setSyncModalState(prev => ({ ...prev, isOpen: false }))}
        onRetryCheck={handleRetryCheck}
        isRetrying={isRetryingVerification}
      />
    </div>
  );
}
