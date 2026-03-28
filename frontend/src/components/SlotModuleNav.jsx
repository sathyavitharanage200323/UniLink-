import React from 'react';
import { NavLink } from 'react-router-dom';
import './SlotModuleNav.css';

export default function SlotModuleNav() {
  return (
    <div className="sm-nav">
      <NavLink to="/lecturer/slots" className="sm-link">
        Slots
      </NavLink>

      <NavLink to="/lecturer/calendar" className="sm-link">
        Calendar
      </NavLink>

      {/* 🔥 NEW BUTTON */}
      <NavLink to="/lecturer/slots/guide" className="sm-link guide">
        Guide
      </NavLink>
    </div>
  );
}