import React, { useState } from 'react';
import { X } from 'lucide-react';
import { disciplineApi } from '../api/chatApi';
import { toast } from 'react-toastify';

/**
 * Modal for lecturers to apply a disciplinary action on a student.
 *
 * Props:
 *   studentId, studentName, lecturerId
 *   onClose()
 *   onApplied(record)
 */
export default function DisciplineModal({
  studentId, studentName, lecturerId, onClose, onApplied
}) {
  const [type, setType] = useState('WARNING');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason.trim()) { toast.warning('Please enter a reason.'); return; }
    setLoading(true);
    try {
      const payload = {
        lecturerId,
        studentId,
        type,
        reason,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString().slice(0, 19) : null,
      };
      const res = await disciplineApi.apply(payload);
      toast.success(`${type} applied to ${studentName}.`);
      onApplied && onApplied(res.data);
      onClose();
    } catch {
      toast.error('Failed to apply discipline action.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3>Moderation: {studentName}</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Action Type</label>
            <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="WARNING">⚠️ Warning (visible label)</option>
              <option value="TEMP_BLOCK">⏱ Temporary Block</option>
              <option value="PERM_BLOCK">🚫 Permanent Block</option>
            </select>
          </div>

          <div className="form-group">
            <label>Reason</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Describe the behaviour…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          {type === 'TEMP_BLOCK' && (
            <div className="form-group">
              <label>Block expires at (optional)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-danger" disabled={loading}>
              {loading ? 'Applying…' : 'Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
