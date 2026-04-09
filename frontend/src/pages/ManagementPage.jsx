import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Users, GraduationCap, Search, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import {
  getManagedStudents,
  getManagedLecturers,
  updateManagedStudent,
  updateManagedLecturer,
  deleteManagedUser,
} from '../api';
import './ManagementPage.css';

function EditableRow({ person, role, onSave, onDelete }) {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState(person);

  useEffect(() => setForm(person), [person]);

  const onChange = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSave = async () => {
    await onSave(form);
    setEdit(false);
  };

  return (
    <tr>
      <td>{person.id}</td>
      <td>
        {edit ? <input value={form.name || ''} onChange={(e) => onChange('name', e.target.value)} /> : person.name}
      </td>
      <td>{person.email}</td>
      <td>
        {edit ? <input value={form.department || ''} onChange={(e) => onChange('department', e.target.value)} /> : (person.department || '-')}
      </td>
      <td>
        {edit ? <input value={form.phone || ''} onChange={(e) => onChange('phone', e.target.value)} /> : (person.phone || '-')}
      </td>
      <td>
        {role === 'STUDENT' ? (
          edit ? <input value={form.registrationNumber || ''} onChange={(e) => onChange('registrationNumber', e.target.value)} /> : (person.registrationNumber || '-')
        ) : (
          edit ? <input value={form.employeeCode || ''} onChange={(e) => onChange('employeeCode', e.target.value)} /> : (person.employeeCode || '-')
        )}
      </td>
      <td>
        {edit ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mg-btn" onClick={handleSave}>Save</button>
            <button className="mg-btn ghost" onClick={() => { setForm(person); setEdit(false); }}>Cancel</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="mg-btn" onClick={() => setEdit(true)}>Edit</button>
            <button className="mg-btn danger" onClick={() => onDelete(person.id)} title="Delete user">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function ManagementPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('STUDENT');
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [query, setQuery] = useState('');

  const load = async () => {
    try {
      const [s, l] = await Promise.all([getManagedStudents(), getManagedLecturers()]);
      setStudents(s);
      setLecturers(l);
    } catch (e) {
      toast.error(e.message || 'Failed to load management data');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => {
    const base = activeTab === 'STUDENT' ? students : lecturers;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((u) =>
      [u.name, u.email, u.department, u.registrationNumber, u.employeeCode]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [activeTab, students, lecturers, query]);

  const save = async (item) => {
    try {
      if (activeTab === 'STUDENT') {
        await updateManagedStudent(item.id, item);
      } else {
        await updateManagedLecturer(item.id, item);
      }
      toast.success('Updated successfully');
      await load();
    } catch (e) {
      toast.error(e.message || 'Update failed');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await deleteManagedUser(id);
      toast.success('User deleted');
      await load();
    } catch (e) {
      toast.error(e.message || 'Delete failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={0} />
      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: 16 }}>
        <button className="mg-back" onClick={() => navigate('/lecturer/home')}>
          <ArrowLeft size={16} /> Back
        </button>

        <section className="mg-card">
          <h1 style={{ marginTop: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Users size={22} /> Student & Lecturer Management
          </h1>

          <div className="mg-toolbar">
            <div className="mg-tabs">
              <button className={activeTab === 'STUDENT' ? 'active' : ''} onClick={() => setActiveTab('STUDENT')}><GraduationCap size={14} /> Students</button>
              <button className={activeTab === 'LECTURER' ? 'active' : ''} onClick={() => setActiveTab('LECTURER')}><Users size={14} /> Lecturers</button>
            </div>
            <div className="mg-search">
              <Search size={14} />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email, code..." />
            </div>
          </div>

          <div className="mg-table-wrap">
            <table className="mg-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>{activeTab === 'STUDENT' ? 'Reg. Number' : 'Employee Code'}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <EditableRow key={r.id} person={r} role={activeTab} onSave={save} onDelete={remove} />
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>No records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

