import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Calendar, 
  User, 
  Layers, 
  Sparkles, 
  Send, 
  Clock, 
  CheckCircle2, 
  RotateCcw,
  Zap,
  Info
} from 'lucide-react';
import AdoTicketSelector from './AdoTicketSelector';
import { fetchDaySchedule } from '../services/api';
import { distributeHoursInHalfHours, roundToHalfHour } from '../utils/hoursUtils';

const QUICK_TEMPLATES = [
  { label: 'Standup (0.5h)', category: 'Internal calls', hrs: 0.5, desc: 'Internal Standup call and daily updates' },
  { label: 'Client Call (1.0h)', category: 'Client calls', hrs: 1.0, desc: 'Technical and standup calls' },
  { label: 'PR Review (1.0h)', category: 'PR comments', hrs: 1.0, desc: 'Addressed PR comments and code review' },
  { label: 'Bug Fix (2.0h)', category: 'Development', hrs: 2.0, desc: 'Investigated and fixed issue in development' },
  { label: 'QA Testing (2.0h)', category: 'QA', hrs: 2.0, desc: 'Execution of work item test cases and verification' }
];

export default function DailyTaskForm({
  currentUser,
  onChangeUser,
  teamMembers,
  categories,
  sheets,
  activeSprint,
  targetSheet,
  onChangeTargetSheet,
  onSubmit,
  isSubmitting,
  mode
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [daySchedule, setDaySchedule] = useState({
    scheduledCalls: [
      { date: todayStr, name: currentUser, ticket: '', category: 'Internal calls', timeInHrs: 0.5, description: 'Internal standup' },
      { date: todayStr, name: currentUser, ticket: '', category: 'Client calls', timeInHrs: 1.0, description: 'Technical and standup calls' }
    ],
    totalScheduledHours: 1.5,
    remainingDevHours: 6.5,
    targetTotalHours: 8.0
  });

  const [selectedTicketIds, setSelectedTicketIds] = useState([]);
  const [selectedTickets, setSelectedTickets] = useState([]);

  const [rows, setRows] = useState([]);

  // Fetch automated schedule whenever date or user changes
  useEffect(() => {
    loadSchedule(selectedDate, currentUser);
  }, [selectedDate, currentUser]);

  const loadSchedule = async (date, user) => {
    try {
      const schedule = await fetchDaySchedule(date, user);
      setDaySchedule(schedule);
      buildRows(schedule, selectedTickets);
    } catch (e) {
      console.warn('Could not load day schedule:', e);
    }
  };

  // Build rows combining scheduled recurring calls + equally divided tickets
  const buildRows = (schedule, tickets) => {
    const newRows = [];

    // 1. Add scheduled calls
    if (schedule && schedule.scheduledCalls) {
      schedule.scheduledCalls.forEach((call, i) => {
        newRows.push({
          id: `sched-${i}-${Date.now()}`,
          ticket: '',
          category: call.category,
          timeInHrs: call.timeInHrs,
          description: call.description,
          isScheduled: true
        });
      });
    }

    // 2. Add selected ADO tickets with 0.5h-rounded distributed hours
    const devHours = schedule ? schedule.remainingDevHours : 6.5;
    if (tickets && tickets.length > 0) {
      const allocations = distributeHoursInHalfHours(devHours, tickets.length);
      tickets.forEach((t, index) => {
        newRows.push({
          id: `ado-${t.id}-${Date.now()}-${index}`,
          ticket: t.id,
          category: t.category || (t.isPrComment ? 'PR comments' : 'Development'),
          timeInHrs: allocations[index] ?? 0.5,
          description: t.title,
          isAdo: true
        });
      });
    } else {
      // Default empty dev row if no ticket selected
      newRows.push({
        id: `dev-${Date.now()}`,
        ticket: '',
        category: 'Development',
        timeInHrs: Math.round(devHours * 2) / 2,
        description: 'Development tasks'
      });
    }

    setRows(newRows);
  };

  // Toggle ticket selection from ADO card
  const handleToggleTicket = (ticket) => {
    let nextTickets;
    if (selectedTicketIds.includes(ticket.id)) {
      nextTickets = selectedTickets.filter(t => t.id !== ticket.id);
    } else {
      nextTickets = [...selectedTickets, ticket];
    }
    setSelectedTickets(nextTickets);
    setSelectedTicketIds(nextTickets.map(t => t.id));
    buildRows(daySchedule, nextTickets);
  };

  const handleSelectAll = (allTickets) => {
    setSelectedTickets(allTickets);
    setSelectedTicketIds(allTickets.map(t => t.id));
    buildRows(daySchedule, allTickets);
  };

  const handleDeselectAll = () => {
    setSelectedTickets([]);
    setSelectedTicketIds([]);
    buildRows(daySchedule, []);
  };

  const totalHours = rows.reduce((sum, r) => sum + (parseFloat(r.timeInHrs) || 0), 0);
  const progressPercent = Math.min(100, (totalHours / 8.0) * 100);

  const handleRowChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleAdjustHours = (id, delta) => {
    setRows(prev => prev.map(r => {
      if (r.id === id) {
        const cur = parseFloat(r.timeInHrs) || 0;
        const next = Math.max(0.5, Math.round((cur + delta) * 2) / 2);
        return { ...r, timeInHrs: next };
      }
      return r;
    }));
  };

  const handleAddRow = () => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        ticket: '',
        category: 'Development',
        timeInHrs: 1.0,
        description: ''
      }
    ]);
  };

  const handleDuplicateRow = (row) => {
    setRows(prev => [
      ...prev,
      {
        ...row,
        id: Date.now()
      }
    ]);
  };

  const handleDeleteRow = (id) => {
    if (rows.length === 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleApplyTemplate = (tpl) => {
    setRows(prev => [
      ...prev,
      {
        id: Date.now(),
        ticket: '',
        category: tpl.category,
        timeInHrs: tpl.hrs,
        description: tpl.desc
      }
    ]);
  };

  const handleReset = () => {
    setSelectedTickets([]);
    setSelectedTicketIds([]);
    buildRows(daySchedule, []);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totalHours <= 0) return;

    // Format entries for API
    const entries = rows.map(r => ({
      date: selectedDate,
      name: currentUser,
      ticket: r.ticket ? r.ticket.trim() : '',
      category: r.category || 'Development',
      timeInHrs: parseFloat(r.timeInHrs) || 0,
      description: r.description ? r.description.trim() : 'General tasks'
    }));

    onSubmit({
      sheetName: targetSheet,
      createSheetIfMissing: true,
      entries
    });
  };

  return (
    <div className="task-form-card glass-panel">
      {/* Form Controls Header */}
      <div className="form-controls-row">
        {/* Date Selector */}
        <div className="control-group">
          <label htmlFor="eod-date-input" className="control-label">
            <Calendar size={14} className="control-icon" /> Date
          </label>
          <input 
            id="eod-date-input"
            type="date" 
            className="styled-input date-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Member Selector */}
        <div className="control-group">
          <label htmlFor="team-member-select" className="control-label">
            <User size={14} className="control-icon" /> Team Member
          </label>
          <select 
            id="team-member-select"
            className="styled-select"
            value={currentUser}
            onChange={(e) => {
              onChangeUser(e.target.value);
              setSelectedTicketIds([]);
              setSelectedTickets([]);
            }}
          >
            {teamMembers.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Target Sprint Sheet */}
        <div className="control-group">
          <label htmlFor="sprint-sheet-select" className="control-label">
            <Layers size={14} className="control-icon" /> Target Sprint Sheet
          </label>
          <div className="sprint-select-wrapper">
            <select 
              id="sprint-sheet-select"
              className="styled-select sprint-select"
              value={targetSheet}
              onChange={(e) => onChangeTargetSheet(e.target.value)}
            >
              {sheets.map(s => (
                <option key={s.name} value={s.name}>
                  {s.name} {s.name === activeSprint ? '★ (Current Sprint)' : `(${s.rowCount} rows)`}
                </option>
              ))}
              {!sheets.some(s => s.name === targetSheet) && (
                <option value={targetSheet}>{targetSheet} (New Sheet)</option>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Azure DevOps Ticket Selector Card */}
      <AdoTicketSelector 
        currentUser={currentUser}
        remainingDevHours={daySchedule ? daySchedule.remainingDevHours : 6.5}
        scheduledHours={daySchedule ? daySchedule.totalScheduledHours : 1.5}
        selectedTicketIds={selectedTicketIds}
        onToggleTicket={handleToggleTicket}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
      />

      {/* Quick Templates Bar */}
      <div className="quick-templates-section">
        <span className="quick-templates-label">
          <Zap size={14} className="quick-icon" /> Quick Add Extra:
        </span>
        <div className="template-chips">
          {QUICK_TEMPLATES.map((tpl, i) => (
            <button 
              key={i}
              type="button"
              className="template-chip"
              onClick={() => handleApplyTemplate(tpl)}
              title={`Add ${tpl.desc}`}
            >
              + {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Task Rows Table */}
      <div className="tasks-table-wrapper">
        <table className="tasks-table">
          <thead>
            <tr>
              <th className="col-num">#</th>
              <th className="col-ticket">Ticket ID</th>
              <th className="col-category">Category</th>
              <th className="col-hours">Hours</th>
              <th className="col-desc">Task Description</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} className="task-row animate-fade-in">
                <td className="col-num">
                  <span className="row-index">{idx + 1}</span>
                </td>
                <td className="col-ticket">
                  <input 
                    type="text" 
                    id={`ticket-input-${row.id}`}
                    className="styled-input ticket-input"
                    placeholder="e.g. 5146"
                    value={row.ticket}
                    onChange={(e) => handleRowChange(row.id, 'ticket', e.target.value)}
                  />
                </td>
                <td className="col-category">
                  <select 
                    id={`category-select-${row.id}`}
                    className="styled-select category-select"
                    value={row.category}
                    onChange={(e) => handleRowChange(row.id, 'category', e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </td>
                <td className="col-hours">
                  <div className="hours-stepper">
                    <button 
                      type="button" 
                      className="stepper-btn minus" 
                      onClick={() => handleAdjustHours(row.id, -0.5)}
                      title="Decrease 0.5h"
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      id={`hours-input-${row.id}`}
                      className="styled-input hours-input"
                      min="0.5"
                      step="0.5"
                      value={row.timeInHrs}
                      onChange={(e) => handleRowChange(row.id, 'timeInHrs', parseFloat(e.target.value) || 0)}
                      onBlur={(e) => handleRowChange(row.id, 'timeInHrs', roundToHalfHour(e.target.value, 0.5))}
                    />
                    <button 
                      type="button" 
                      className="stepper-btn plus" 
                      onClick={() => handleAdjustHours(row.id, 0.5)}
                      title="Increase 0.5h"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="col-desc">
                  <input 
                    type="text" 
                    id={`desc-input-${row.id}`}
                    className="styled-input desc-input"
                    placeholder="Describe what you worked on today..."
                    value={row.description}
                    onChange={(e) => handleRowChange(row.id, 'description', e.target.value)}
                    required
                  />
                </td>
                <td className="col-actions">
                  <div className="row-actions">
                    <button 
                      type="button"
                      className="action-icon-btn copy"
                      title="Duplicate row"
                      onClick={() => handleDuplicateRow(row)}
                    >
                      <Copy size={15} />
                    </button>
                    <button 
                      type="button"
                      className="action-icon-btn delete"
                      title="Delete row"
                      disabled={rows.length === 1}
                      onClick={() => handleDeleteRow(row.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Footer Controls */}
      <div className="table-footer-row">
        <button 
          type="button" 
          id="add-task-row-btn"
          className="btn-secondary add-row-btn"
          onClick={handleAddRow}
        >
          <Plus size={16} /> Add Custom Task
        </button>

        <button 
          type="button"
          className="btn-ghost reset-btn"
          onClick={handleReset}
          title="Reset to automated daily schedule"
        >
          <RotateCcw size={14} /> Reset to Schedule
        </button>
      </div>

      {/* Progress & Submit Bar */}
      <div className="submission-bar">
        <div className="hours-progress-block">
          <div className="hours-stats-header">
            <span className="hours-total-label">
              <Clock size={16} className="clock-icon" /> Daily Total:
            </span>
            <span className={`hours-total-value ${Math.abs(totalHours - 8.0) < 0.05 ? 'goal-reached' : ''}`}>
              <strong>{totalHours.toFixed(1)}</strong> / 8.0 hrs
            </span>
            <span className={`hours-badge ${Math.abs(totalHours - 8.0) < 0.05 ? 'badge-success' : 'badge-warning'}`}>
              {Math.abs(totalHours - 8.0) < 0.05 ? '🎯 Perfect 8.0h Day' : `${(8.0 - totalHours).toFixed(1)}h remaining`}
            </span>
          </div>

          <div className="progress-track">
            <div 
              className={`progress-fill ${Math.abs(totalHours - 8.0) < 0.05 ? 'completed' : ''}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        <button 
          id="submit-eod-btn"
          type="button"
          className={`btn-primary submit-cta-btn ${isSubmitting ? 'loading' : ''}`}
          disabled={isSubmitting || totalHours <= 0}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <span className="spinner-text">Updating Excel & SharePoint...</span>
          ) : (
            <>
              <Send size={18} />
              <span>{mode === 'direct' ? 'Update EOD Excel' : 'Download Updated Excel'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
