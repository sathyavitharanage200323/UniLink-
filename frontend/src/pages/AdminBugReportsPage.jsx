import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { Bug, CheckCircle2, Clock3, Filter, Hammer, Wrench } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getBugReportsAdmin,
  updateBugReportStatus,
} from '../api';
import './AdminBugReportsPage.css';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'FIXED', label: 'Fixed' },
];

export default function AdminBugReportsPage({ currentUser, onLogout }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [savingId, setSavingId] = useState(null);
  const [notes, setNotes] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});

  const loadReports = async () => {
    try {
      const data = await getBugReportsAdmin();
      setReports(data);
    } catch (err) {
      toast.error(err.message || 'Failed to load bug reports');
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    if (filter === 'ALL') return reports;
    return reports.filter((r) => r.status === filter);
  }, [reports, filter]);

  const handleUpdate = async (report) => {
    const newStatus = statusDrafts[report.id] || report.status;
    const adminNote = notes[report.id] ?? report.adminNote ?? '';

    setSavingId(report.id);
    try {
      await updateBugReportStatus(report.id, {
        status: newStatus,
        adminNote,
        fixedById: currentUser?.id,
      });
      toast.success('Report updated');
      await loadReports();
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'FIXED':
        return <CheckCircle2 size={16} />;
      case 'IN_PROGRESS':
        return <Clock3 size={16} />;
      default:
        return <Bug size={16} />;
    }
  };

  return (
    <div className="admin-bug-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <main className="admin-bug-main">
        <section className="admin-bug-hero">
          <div className="admin-bug-hero-title">
            <Hammer size={22} />
            <h1>Admin Bug Reports</h1>
          </div>
          <p>Review incoming issues, update progress, and notify reporters when fixed.</p>
        </section>

        <section className="admin-bug-controls">
          <div className="admin-bug-filter">
            <Filter size={16} />
            <span>Filter</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="admin-bug-list">
          {filteredReports.length === 0 && (
            <div className="admin-bug-empty">No reports in this view.</div>
          )}
          {filteredReports.map((report) => (
            <article key={report.id} className="admin-bug-card">
              <header>
                <div className="admin-bug-title">
                  {statusIcon(report.status)}
                  <div>
                    <h2>{report.title}</h2>
                    <p>
                      Reported by {report.reporterName} ({report.reporterRole})
                    </p>
                  </div>
                </div>
                <span className={`admin-bug-pill admin-bug-pill--${report.status.toLowerCase()}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </header>

              <div className="admin-bug-body">
                <p>{report.description}</p>
                <div className="admin-bug-meta">
                  <span>Severity: {report.severity}</span>
                  <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div className="admin-bug-actions">
                <label>
                  Status
                  <select
                    value={statusDrafts[report.id] || report.status}
                    onChange={(e) => setStatusDrafts((prev) => ({ ...prev, [report.id]: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Admin note
                  <textarea
                    rows={2}
                    value={notes[report.id] ?? report.adminNote ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    placeholder="Context for the reporter"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => handleUpdate(report)}
                  disabled={savingId === report.id}
                >
                  <Wrench size={16} />
                  {savingId === report.id ? 'Saving...' : 'Update report'}
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
