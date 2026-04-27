import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  FileText,
  Megaphone,
  Search,
  Upload,
  Trash2,
  ExternalLink,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { BACKEND_BASE_URL } from '../config';
import { resourcesApi } from '../api/resourcesApi';
import './ResourcesPage.css';

function formatDateTime(value) {
  if (!value) return '--';
  return new Date(value).toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSize(bytes) {
  if (!bytes || Number.isNaN(bytes)) return '--';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResourcesPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const isLecturer = currentUser?.role === 'LECTURER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingPdf, setSavingPdf] = useState(false);
  const [savingNotice, setSavingNotice] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [pdfForm, setPdfForm] = useState({
    title: '',
    description: '',
    file: null,
  });
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    description: '',
  });

  async function loadResources() {
    try {
      setLoading(true);
      const res = await resourcesApi.list();
      setItems(res.data || []);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load resources.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (filter !== 'ALL' && item.type !== filter) return false;
      const haystack = `${item.title || ''} ${item.description || ''} ${item.lecturerName || ''}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [items, filter, search]);

  const pdfCount = items.filter((i) => i.type === 'PDF').length;
  const noticeCount = items.filter((i) => i.type === 'NOTICE').length;

  async function handleUploadPdf(e) {
    e.preventDefault();
    if (!isLecturer) return;
    if (!pdfForm.file) {
      toast.error('Please choose a PDF file.');
      return;
    }
    try {
      setSavingPdf(true);
      await resourcesApi.uploadPdf({
        lecturerId: currentUser.id,
        title: pdfForm.title,
        description: pdfForm.description,
        file: pdfForm.file,
      });
      toast.success('PDF uploaded successfully.');
      setPdfForm({ title: '', description: '', file: null });
      await loadResources();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload PDF.');
    } finally {
      setSavingPdf(false);
    }
  }

  async function handleCreateNotice(e) {
    e.preventDefault();
    if (!isLecturer) return;
    try {
      setSavingNotice(true);
      await resourcesApi.createNotice({
        lecturerId: currentUser.id,
        title: noticeForm.title,
        description: noticeForm.description,
      });
      toast.success('Notice published.');
      setNoticeForm({ title: '', description: '' });
      await loadResources();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to publish notice.');
    } finally {
      setSavingNotice(false);
    }
  }

  async function handleDelete(item) {
    if (!currentUser?.id) return;
    const yes = window.confirm(`Delete "${item.title}"?`);
    if (!yes) return;

    try {
      setDeletingId(item.id);
      await resourcesApi.remove({
        id: item.id,
        userId: currentUser.id,
        role: currentUser.role,
      });
      toast.success('Resource deleted.');
      await loadResources();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete resource.');
    } finally {
      setDeletingId(null);
    }
  }

  const canDelete = (item) => isAdmin || item.lecturerId === currentUser?.id;

  return (
    <div className="rp-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <main className="rp-main">
        <button
          className="rp-back-btn"
          onClick={() => navigate(currentUser?.role === 'LECTURER' ? '/lecturer/home' : '/student/home')}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <section className="rp-hero">
          <div>
            <div className="rp-badge"><BookOpen size={13} /> Learning Hub</div>
            <h1>Resources & Notices</h1>
            <p>Lecturers can upload lecture PDFs and post notices. Students can view everything in one place.</p>
          </div>
          <button className="rp-refresh-btn" onClick={loadResources} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'rp-spin' : ''} /> Refresh
          </button>
        </section>

        <section className="rp-stats">
          <div className="rp-stat"><span>Total</span><strong>{items.length}</strong></div>
          <div className="rp-stat"><span>PDF Lectures</span><strong>{pdfCount}</strong></div>
          <div className="rp-stat"><span>Notices</span><strong>{noticeCount}</strong></div>
        </section>

        {isLecturer && (
          <section className="rp-create-grid">
            <form className="rp-card" onSubmit={handleUploadPdf}>
              <h2><Upload size={16} /> Add Lecture PDF</h2>
              <label>Title</label>
              <input
                value={pdfForm.title}
                onChange={(e) => setPdfForm((p) => ({ ...p, title: e.target.value }))}
                required
                placeholder="e.g., Week 5 - Data Structures"
              />
              <label>Description</label>
              <textarea
                value={pdfForm.description}
                onChange={(e) => setPdfForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional summary or instructions"
              />
              <label>PDF File</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => setPdfForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                required
              />
              <button type="submit" className="rp-primary-btn" disabled={savingPdf}>
                {savingPdf ? 'Uploading...' : 'Upload PDF'}
              </button>
            </form>

            <form className="rp-card" onSubmit={handleCreateNotice}>
              <h2><Megaphone size={16} /> Add Notice</h2>
              <label>Notice Title</label>
              <input
                value={noticeForm.title}
                onChange={(e) => setNoticeForm((p) => ({ ...p, title: e.target.value }))}
                required
                placeholder="e.g., Quiz moved to Friday"
              />
              <label>Notice Content</label>
              <textarea
                value={noticeForm.description}
                onChange={(e) => setNoticeForm((p) => ({ ...p, description: e.target.value }))}
                rows={6}
                required
                placeholder="Share updates, reminders, or important announcements"
              />
              <button type="submit" className="rp-primary-btn" disabled={savingNotice}>
                {savingNotice ? 'Publishing...' : 'Publish Notice'}
              </button>
            </form>
          </section>
        )}

        <section className="rp-toolbar">
          <div className="rp-filter">
            {['ALL', 'PDF', 'NOTICE'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rp-filter-btn ${filter === f ? 'active' : ''}`}
              >
                {f === 'ALL' ? 'All' : f === 'PDF' ? 'PDFs' : 'Notices'}
              </button>
            ))}
          </div>
          <div className="rp-search-wrap">
            <Search size={15} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, notice, lecturer..."
            />
          </div>
        </section>

        <section className="rp-list">
          {loading && <div className="rp-empty">Loading resources...</div>}
          {!loading && visibleItems.length === 0 && <div className="rp-empty">No resources found.</div>}
          {!loading && visibleItems.map((item) => {
            const fileUrl = item.filePath ? `${BACKEND_BASE_URL}/uploads/${item.filePath}` : null;
            return (
              <article className="rp-item" key={item.id}>
                <div className="rp-item-top">
                  <span className={`rp-type rp-type--${item.type.toLowerCase()}`}>
                    {item.type === 'PDF' ? <FileText size={13} /> : <Megaphone size={13} />}
                    {item.type}
                  </span>
                  <span className="rp-time">{formatDateTime(item.createdAt)}</span>
                </div>

                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}

                <div className="rp-meta">
                  <span>By {item.lecturerName || 'Lecturer'}</span>
                  {item.type === 'PDF' && <span>{formatSize(item.fileSize)}</span>}
                </div>

                <div className="rp-actions">
                  {item.type === 'PDF' && fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="rp-open-link">
                      Open PDF <ExternalLink size={14} />
                    </a>
                  )}
                  {canDelete(item) && (
                    <button
                      className="rp-delete-btn"
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.id}
                    >
                      <Trash2 size={14} /> {deletingId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
