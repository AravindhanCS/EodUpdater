const BACKEND_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const API_BASE = `${BACKEND_URL}/api/eod`;

export async function fetchStatus(path = '') {
  const url = path ? `${API_BASE}/status?path=${encodeURIComponent(path)}` : `${API_BASE}/status`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSheets(path = '') {
  const url = path ? `${API_BASE}/sheets?path=${encodeURIComponent(path)}` : `${API_BASE}/sheets`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetching sheets failed: ${res.statusText}`);
  return res.json();
}

export async function fetchRecentEntries(sheetName = '', path = '', limit = 30) {
  const params = new URLSearchParams();
  if (path) params.append('path', path);
  if (sheetName) params.append('sheetName', sheetName);
  params.append('limit', limit);

  const res = await fetch(`${API_BASE}/recent-entries?${params.toString()}`);
  if (!res.ok) throw new Error(`Fetching recent entries failed: ${res.statusText}`);
  return res.json();
}

export async function fetchSprintAnalytics(sheetName = '', path = '') {
  const params = new URLSearchParams();
  if (path) params.append('path', path);
  if (sheetName) params.append('sheetName', sheetName);

  const res = await fetch(`${API_BASE}/analytics?${params.toString()}`);
  if (!res.ok) throw new Error(`Fetching sprint analytics failed: ${res.statusText}`);
  return res.json();
}

export async function pullLatestFromSharePoint(path = '', sharePointUrl = '') {
  const params = new URLSearchParams();
  if (path) params.append('path', path);
  if (sharePointUrl) params.append('url', sharePointUrl);
  const url = `${API_BASE}/sharepoint/pull${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'SharePoint pull failed');
  }
  return data;
}

export async function testPowerAutomateWebhook(webhookUrl = '') {
  const res = await fetch(`${API_BASE}/powerautomate/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ webhookUrl })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Power Automate test failed');
  }
  return data;
}

export async function testResendEmail(apiKey = '', toEmail = '') {
  const res = await fetch(`${API_BASE}/resend/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, toEmail })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Resend test failed');
  }
  return data;
}

export async function uploadTrackerFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/upload-tracker`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to upload effort tracker');
  }
  return data;
}

export async function submitEodEntries(payload) {
  const res = await fetch(`${API_BASE}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Submission failed');
  }
  return data;
}

export async function uploadAndProcessFile(file, sheetName, createSheetIfMissing, entries) {
  const formData = new FormData();
  formData.append('file', file);
  if (sheetName) formData.append('sheetName', sheetName);
  formData.append('createSheetIfMissing', createSheetIfMissing);
  formData.append('entries', JSON.stringify(entries));

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Upload failed');
  }

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = file.name ? file.name.replace('.xlsx', '_Updated.xlsx') : 'Effort_Tracker_Updated.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
  return { success: true, message: 'File updated and downloaded successfully!' };
}

export async function saveAppConfig(config) {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save config');
  return res.json();
}

// ----------------- Azure DevOps & Schedule APIs -----------------
const ADO_BASE = `${BACKEND_URL}/api/ado`;

export async function fetchAdoTickets(user = '') {
  const query = user ? `?user=${encodeURIComponent(user)}` : '';
  const res = await fetch(`${ADO_BASE}/tickets${query}`);
  if (!res.ok) throw new Error('Failed to fetch Azure DevOps tickets');
  return res.json();
}

export async function fetchDaySchedule(date = '', user = 'Aravindhan') {
  const params = new URLSearchParams();
  if (date) params.append('date', date);
  if (user) params.append('user', user);

  const res = await fetch(`${ADO_BASE}/schedule?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch daily schedule');
  return res.json();
}

export async function fetchAdoConfig() {
  const res = await fetch(`${ADO_BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch ADO config');
  return res.json();
}

export async function saveAdoConfig(config) {
  const res = await fetch(`${ADO_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to save ADO config');
  return res.json();
}

export async function testAdoConnection(config) {
  const res = await fetch(`${ADO_BASE}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  if (!res.ok) throw new Error('Failed to test ADO connection');
  return res.json();
}

// ----------------- Compliance Missing Log Reason APIs -----------------
export async function saveMissingLogReason(payload) {
  const res = await fetch(`${API_BASE}/compliance/missing-log-reason`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to save missing log reason');
  }
  return data;
}

export async function clearMissingLogReason(sprintName, developer, date) {
  const params = new URLSearchParams({ developer, date });
  if (sprintName) params.append('sprintName', sprintName);
  const res = await fetch(`${API_BASE}/compliance/missing-log-reason?${params.toString()}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to clear missing log reason');
  }
  return data;
}

// ----------------- Azure DevOps Sprint Story Points API -----------------
export async function fetchSprintStoryPoints(sprintName) {
  const url = sprintName
    ? `${ADO_BASE}/story-points?sprintName=${encodeURIComponent(sprintName)}`
    : `${ADO_BASE}/story-points`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch sprint story points');
  return res.json();
}

