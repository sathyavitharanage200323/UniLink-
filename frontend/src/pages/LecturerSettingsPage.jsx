import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LecturerPreferencesPage.css'; // Reuse the CSS for now

export default function LecturerSettingsPage({ currentUser, onLogout }) {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: false,
    darkMode: false,
    language: 'en',
  });

  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });

  const handleSave = async () => {
    try {
      // TODO: Implement save settings API
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
    }
  };

  return (
    <div className="lp-layout">
      <Header currentUser={currentUser} onLogout={onLogout} />

      <main className="lp-main">
        <div className="lp-container">
          <div className="lp-header">
            <button
              type="button"
              className="lp-back-btn"
              onClick={() => navigate('/lecturer/slots')}
            >
              ← Back to Slots
            </button>
            <h1>Settings</h1>
          </div>

          {saveStatus.message && (
            <div className={`lp-banner lp-banner--${saveStatus.type}`}>
              {saveStatus.message}
            </div>
          )}

          <div className="lp-content">
            <div className="lp-section">
              <h2>Notifications</h2>
              <div className="lp-field">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                  />
                  Enable push notifications
                </label>
              </div>
              <div className="lp-field">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.emailAlerts}
                    onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                  />
                  Email alerts for appointments
                </label>
              </div>
            </div>

            <div className="lp-section">
              <h2>Appearance</h2>
              <div className="lp-field">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.darkMode}
                    onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                  />
                  Dark mode
                </label>
              </div>
            </div>

            <div className="lp-section">
              <h2>Language</h2>
              <div className="lp-field">
                <label>Preferred Language</label>
                <select
                  className="lp-input"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
            </div>

            <div className="lp-actions">
              <button
                type="button"
                className="lp-btn lp-btn--primary"
                onClick={handleSave}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}