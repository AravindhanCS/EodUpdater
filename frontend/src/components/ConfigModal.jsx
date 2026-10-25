import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Save, 
  FolderOpen, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  GitPullRequest,
  Key,
  Globe
} from 'lucide-react';
import { 
  saveAppConfig, 
  fetchStatus, 
  fetchAdoConfig, 
  saveAdoConfig, 
  testAdoConnection 
} from '../services/api';

export default function ConfigModal({
  isOpen,
  onClose,
  currentPath,
  currentUser,
  teamMembers,
  onConfigSaved
}) {
  const [activeTab, setActiveTab] = useState('ado'); // 'ado' | 'excel'

  // Excel settings
  const [filePath, setFilePath] = useState(currentPath || '');
  const [user, setUser] = useState(currentUser || '');
  const [testResult, setTestResult] = useState(null);

  // ADO settings
  const [adoOrgUrl, setAdoOrgUrl] = useState('https://dev.azure.com/simplicitysystems');
  const [adoProject, setAdoProject] = useState('SimplicityCollect');
  const [adoState, setAdoState] = useState('Development');
  const [adoPat, setAdoPat] = useState('');
  const [hasPatSaved, setHasPatSaved] = useState(false);
  const [adoTestResult, setAdoTestResult] = useState(null);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAdoConfig();
    }
  }, [isOpen]);

  const loadAdoConfig = async () => {
    try {
      const config = await fetchAdoConfig();
      if (config.orgUrl) setAdoOrgUrl(config.orgUrl);
      if (config.project) setAdoProject(config.project);
      if (config.targetState) setAdoState(config.targetState);
      setHasPatSaved(config.hasPat);
    } catch (e) {
      console.warn('Could not load ADO config:', e);
    }
  };

  if (!isOpen) return null;

  const handleTestExcelPath = async () => {
    setTestResult({ testing: true });
    try {
      const res = await fetchStatus(filePath);
      if (res.fileExists) {
        setTestResult({
          success: true,
          message: `Found Excel file! Sheets: ${res.sheets.length} (Active: ${res.activeSprintName})`
        });
      } else {
        setTestResult({
          success: false,
          message: 'File does not exist at this path. Please verify the path.'
        });
      }
    } catch (e) {
      setTestResult({
        success: false,
        message: 'Could not connect to backend to test path.'
      });
    }
  };

  const handleTestAdo = async () => {
    setAdoTestResult({ testing: true });
    try {
      const res = await testAdoConnection({
        orgUrl: adoOrgUrl,
        project: adoProject,
        pat: adoPat,
        targetState: adoState
      });
      setAdoTestResult(res);
    } catch (e) {
      setAdoTestResult({
        success: false,
        message: e.message || 'Failed to connect to Azure DevOps'
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Save Excel config
      await saveAppConfig({
        filePath,
        currentUser: user
      });

      // 2. Save ADO config
      await saveAdoConfig({
        orgUrl: adoOrgUrl,
        project: adoProject,
        pat: adoPat,
        targetState: adoState
      });

      onConfigSaved(filePath, user);
      onClose();
    } catch (e) {
      alert('Failed to save settings: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel animate-fade-in">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <FolderOpen size={20} className="modal-title-icon" />
            <h3>Application Settings</h3>
          </div>
          <button className="icon-action-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Tab Switcher */}
        <div className="modal-tabs">
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'ado' ? 'active' : ''}`}
            onClick={() => setActiveTab('ado')}
          >
            <GitPullRequest size={15} /> Azure DevOps Settings
          </button>
          <button 
            type="button" 
            className={`modal-tab-btn ${activeTab === 'excel' ? 'active' : ''}`}
            onClick={() => setActiveTab('excel')}
          >
            <FolderOpen size={15} /> Excel & Safety
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'ado' ? (
            <div className="ado-config-fields">
              <div className="setting-field">
                <label htmlFor="ado-org-url">Azure DevOps Organization URL</label>
                <div className="input-with-icon">
                  <Globe size={15} className="input-icon" />
                  <input 
                    id="ado-org-url"
                    type="text" 
                    className="styled-input"
                    value={adoOrgUrl}
                    onChange={(e) => setAdoOrgUrl(e.target.value)}
                    placeholder="https://dev.azure.com/simplicitysystems"
                  />
                </div>
              </div>

              <div className="setting-field">
                <label htmlFor="ado-project-name">Project Name</label>
                <input 
                  id="ado-project-name"
                  type="text" 
                  className="styled-input"
                  value={adoProject}
                  onChange={(e) => setAdoProject(e.target.value)}
                  placeholder="SimplicityCollect"
                />
              </div>

              <div className="setting-field">
                <label htmlFor="ado-target-state">Target Development State</label>
                <input 
                  id="ado-target-state"
                  type="text" 
                  className="styled-input"
                  value={adoState}
                  onChange={(e) => setAdoState(e.target.value)}
                  placeholder="Development"
                />
              </div>

              <div className="setting-field">
                <label htmlFor="ado-pat-input">
                  Personal Access Token (PAT) 
                  {hasPatSaved && <span className="saved-pill">✓ Saved</span>}
                </label>
                <p className="setting-help">
                  Create in Azure DevOps → User settings → Personal access tokens (Scopes: <code>Work Items (Read)</code>, <code>Code (Read)</code>)
                </p>
                <div className="input-with-action">
                  <input 
                    id="ado-pat-input"
                    type="password" 
                    className="styled-input"
                    value={adoPat}
                    onChange={(e) => {
                      setAdoPat(e.target.value);
                      setAdoTestResult(null);
                    }}
                    placeholder={hasPatSaved ? "•••••••••••••••••••• (Leave blank to keep existing)" : "Paste your PAT token here"}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary test-btn"
                    onClick={handleTestAdo}
                  >
                    Test ADO
                  </button>
                </div>
                {adoTestResult && (
                  <div className={`test-feedback ${adoTestResult.success ? 'success' : 'error'}`}>
                    {adoTestResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{adoTestResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="excel-config-fields">
              <div className="setting-field">
                <label htmlFor="config-file-path">Target Excel File Path</label>
                <p className="setting-help">
                  Path to local or OneDrive/SharePoint synced <code>Effort Tracker - Simplicity.xlsx</code>
                </p>
                <div className="input-with-action">
                  <input 
                    id="config-file-path"
                    type="text" 
                    className="styled-input"
                    value={filePath}
                    onChange={(e) => {
                      setFilePath(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="e.g. C:\Users\...\Effort Tracker - Simplicity.xlsx"
                  />
                  <button 
                    type="button" 
                    className="btn-secondary test-btn"
                    onClick={handleTestExcelPath}
                  >
                    Test Path
                  </button>
                </div>
                {testResult && (
                  <div className={`test-feedback ${testResult.success ? 'success' : 'error'}`}>
                    {testResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>

              <div className="setting-field">
                <label htmlFor="config-default-user">Default Member Name</label>
                <p className="setting-help">Pre-filled on daily startup</p>
                <select 
                  id="config-default-user"
                  className="styled-select"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                >
                  {teamMembers.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="backup-notice">
                <ShieldCheck size={18} className="shield-icon" />
                <div>
                  <strong>Safety Guard & Live SharePoint Sync</strong>
                  <p>Submissions automatically sync to your team's live cloud SharePoint sheet and save a local backup copy in <code>.backups/</code>.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
