import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, BookOpen, MapPin, Hash, GraduationCap } from 'lucide-react';
import { userApi } from '../api/chatApi';

export default function ProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await userApi.getFull(userId);
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile', err);
        setErrorMsg(err.message + (err.response ? " - " + err.response.statusText : ""));
      } finally {
        setLoading(false);
      }
    }
    if (userId) loadProfile();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3>User Profile</h3>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Loading profile...
          </div>
        ) : profile ? (
          <div className="profile-details" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '10px' }}>
              <div style={{ 
                width: 60, height: 60, borderRadius: '50%', backgroundColor: 'var(--primary)', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>{profile.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  {profile.role === 'STUDENT' ? 'Student' : 'Lecturer'} • {profile.department}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(20px, auto) 1fr', gap: '8px 12px', alignItems: 'center', fontSize: '0.95rem' }}>
              
              <Mail size={16} style={{ color: 'var(--text-muted)' }}/>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>

              {profile.phone && (
                <>
                  <Phone size={16}  style={{ color: 'var(--text-muted)' }}/>
                  <span>{profile.phone}</span>
                </>
              )}

              {profile.role === 'STUDENT' && (
                <>
                  <Hash size={16} style={{ color: 'var(--text-muted)' }}/>
                  <span>Registration No: <strong>{profile.registrationNumber || 'N/A'}</strong></span>

                  <BookOpen size={16} style={{ color: 'var(--text-muted)' }}/>
                  <span>Batch: {profile.batch || 'N/A'}</span>

                  <GraduationCap size={16}  style={{ color: 'var(--text-muted)' }}/>
                  <span>{profile.academicYear ? `Year ${profile.academicYear}` : 'N/A'} {profile.semester ? `(Sem ${profile.semester})` : ''}</span>
                </>
              )}

              {profile.role === 'LECTURER' && (
                <>
                  <Hash size={16} style={{ color: 'var(--text-muted)' }}/>
                  <span>Employee Code: {profile.employeeCode || 'N/A'}</span>

                  <User size={16} style={{ color: 'var(--text-muted)' }}/>
                  <span>Designation: {profile.designation || 'N/A'}</span>

                  {profile.officeLocation && (
                    <>
                      <MapPin size={16} style={{ color: 'var(--text-muted)' }}/>
                      <span>Office: {profile.officeLocation}</span>
                    </>
                  )}
                  {profile.expertise && (
                    <>
                      <BookOpen size={16} style={{ color: 'var(--text-muted)' }}/>
                      <span>Expertise: {profile.expertise}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {(profile.bio || profile.officeHours) && (
              <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                {profile.officeHours && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Office Hours</strong>
                    <div style={{ fontSize: '0.9rem' }}>{profile.officeHours}</div>
                  </div>
                )}
                {profile.bio && (
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Bio</strong>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{profile.bio}</div>
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--error)' }}>
            Failed to load profile. <br />
            <small style={{ color: 'gray' }}>{errorMsg}</small>
          </div>
        )}
      </div>
    </div>
  );
}