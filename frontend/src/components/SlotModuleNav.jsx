import React from 'react';
import { NavLink } from 'react-router-dom';

export default function SlotModuleNav() {
  const linkStyle = ({ isActive }) => ({
    padding: '10px 16px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '0.92rem',
    color: isActive ? '#ffffff' : '#4b5563',
    background: isActive ? '#7c3aed' : '#f3f4f6',
    border: isActive ? 'none' : '1px solid #e5e7eb',
  });

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '18px auto 0',
        padding: '0 20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '14px',
          boxShadow: '0 10px 25px rgba(15, 23, 42, 0.06)',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        <NavLink to="/lecturer/slots" style={linkStyle}>
          Manage Slots
        </NavLink>
        <NavLink to="/lecturer/slots/calendar" style={linkStyle}>
          Calendar
        </NavLink>
        <NavLink to="/lecturer/slots/history" style={linkStyle}>
          History
        </NavLink>
        <NavLink to="/lecturer/slots/summary" style={linkStyle}>
          Summary
        </NavLink>
        <NavLink to="/lecturer/slots/guide" style={linkStyle}>
          Guide
        </NavLink>
        <NavLink to="/lecturer/slots/settings" style={linkStyle}>
          Settings
        </NavLink>
      </div>
    </div>
  );
}