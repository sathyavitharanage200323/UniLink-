import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Bug, Bell, CheckCircle2, Send, ShieldAlert } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  createBugReport,
  getBugReportNotifications,
  getBugReportsByReporter,
} from '../api';
import './BugReportPage.css';

const SEVERITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export default function BugReportPage({ currentUser, onLogout }) {
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM' });
  const [reports, setReports] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const canReport = Boolean(currentUser?.id);

  const loadReports = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getBugReportsByReporter(currentUser.id);
      setReports(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load reports');
    }
  };

  const loadUpdates = async () => {
    if (!currentUser?.id) return;
    try {
      const data = await getBugReportNotifications(currentUser.id);
      setUpdates(data);
      if (data.length > 0) {
        data.forEach((item) => {
          toast.success(`Fixed: ${item.title}`);
        });
      }
    } catch {
      // Silent fail for notifications
    }
  };

  useEffect(() => {
    loadReports();
    loadUpdates();
  }, [currentUser?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!canReport) return;

    setSubmitting(true);
    try {
      await createBugReport({
        reporterId: currentUser.id,
        title: form.title.trim(),
        description: form.description.trim(),
        severity: form.severity,
      });
      toast.success('Report submitted');
      setForm({ title: '', description: '', severity: 'MEDIUM' });
      await loadReports();
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case 'FIXED':
        return 'Fixed';
      case 'IN_PROGRESS':
        return 'In progress';
      default:
        return 'Open';
    }
  };

  const sortedReports = useMemo(() => reports, [reports]);

  return (
    <div className="bug-report-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <main className="bug-report-main">
        <section className="bug-report-hero">
          <div className="bug-report-hero-title">
            <Bug size={22} />
            <h1>Bug & Issue Reporting</h1>
          </div>
          <p>
            Tell us what is broken or confusing. Admin will review and notify you
            when it is resolved.
          </p>
        </section>

        <section className="bug-report-grid">
          <div className="bug-report-panel">
            <div className="bug-report-panel-header">
              <ShieldAlert size={18} />
              <h2>Submit a report</h2>
            </div>
            <form onSubmit={handleSubmit} className="bug-report-form">
              <label>
                Title
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Short summary"
                />
              </label>
              <label>
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Steps, what you expected, and what happened"
                />
              </label>
              <label>
                Severity
                <select
                  value={form.severity}
                  onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))}
                >
                  {SEVERITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={submitting || !canReport}>
                <Send size={16} />
                {submitting ? 'Submitting...' : 'Send report'}
              </button>
            </form>
          </div>

          <div className="bug-report-panel">
            <div className="bug-report-panel-header">
              <Bell size={18} />
              <h2>Fix updates</h2>
            </div>
            {updates.length === 0 ? (
              <div className="bug-report-empty">No new fixes yet.</div>
            ) : (
              <div className="bug-report-updates">
                {updates.map((item) => (
                  <div key={item.id} className="bug-report-update-card">
                    <CheckCircle2 size={18} />
                    <div>
                      <strong>{item.title}</strong>
                      <p>Marked as fixed by admin.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bug-report-panel">
          <div className="bug-report-panel-header">
            <Bug size={18} />
            <h2>Your reports</h2>
          </div>
          {sortedReports.length === 0 ? (
            <div className="bug-report-empty">No reports submitted yet.</div>
          ) : (
            <div className="bug-report-list">
              {sortedReports.map((report) => (
                <div key={report.id} className={`bug-report-card bug-report-card--${report.status.toLowerCase()}`}>
                  <div>
                    <h3>{report.title}</h3>
                    <p>{report.description}</p>
                    {report.adminNote && (
                      <div className="bug-report-note">
                        <strong>Admin note:</strong> {report.adminNote}
                      </div>
                    )}
                  </div>
                  <div className="bug-report-meta">
                    <span className={`bug-report-pill bug-report-pill--${report.status.toLowerCase()}`}>
                      {statusLabel(report.status)}
                    </span>
                    <span className="bug-report-pill bug-report-pill--severity">
                      {report.severity}
                    </span>
                    <span className="bug-report-date">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
