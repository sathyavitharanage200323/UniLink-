import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2 } from 'lucide-react';
import { cannedApi } from '../api/chatApi';
import { toast } from 'react-toastify';

/**
 * Management panel for a lecturer's canned (quick) responses.
 *
 * Props:
 *   lecturerId
 *   responses – current list
 *   onClose()
 *   onUpdated(newList)
 */
export default function CannedResponseManager({ lecturerId, responses, onClose, onUpdated }) {
  const [editing, setEditing] = useState(null); // null | { id?, title, content }
  const [loading, setLoading] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    const { id, title, content } = editing;
    if (!title.trim() || !content.trim()) { toast.warning('Fill in all fields.'); return; }
    setLoading(true);
    try {
      if (id) {
        const res = await cannedApi.update(id, title, content);
        onUpdated(responses.map((r) => (r.id === id ? res.data : r)));
        toast.success('Response updated.');
      } else {
        const res = await cannedApi.create(lecturerId, title, content);
        onUpdated([...responses, res.data]);
        toast.success('Response saved.');
      }
      setEditing(null);
    } catch {
      toast.error('Could not save response.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this canned response?')) return;
    try {
      await cannedApi.delete(id);
      onUpdated(responses.filter((r) => r.id !== id));
      toast.success('Deleted.');
    } catch {
      toast.error('Could not delete.');
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3>⚡ Quick Responses</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* List */}
        {!editing && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
              {responses.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                  No saved responses yet. Create one!
                </p>
              )}
              {responses.map((r) => (
                <div key={r.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', background: 'var(--surface2)', borderRadius: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="canned-title">{r.title}</div>
                    <div className="canned-preview">{r.content}</div>
                  </div>
                  <button className="icon-btn" onClick={() => setEditing(r)}><Pencil size={14} /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(r.id)}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 14, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={() => setEditing({ title: '', content: '' })}
            >
              <Plus size={16} /> New Response
            </button>
          </>
        )}

        {/* Edit / Create form */}
        {editing && (
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Short title (shown as button label)</label>
              <input
                className="form-control"
                placeholder="e.g. Submission Deadline"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Message content</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="The full pre-written reply…"
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
