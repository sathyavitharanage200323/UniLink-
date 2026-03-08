import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap, Mail, Phone, MapPin,
  Github, Twitter, Linkedin, Globe,
} from 'lucide-react';
import './Footer.css';

/**
 * Footer — shared site footer for all pages.
 * No props required.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* ── Brand column ── */}
        <div className="footer__brand-col footer__col">
          <Link to="/" className="footer__brand-heading">
            <div className="footer__brand-logo-box">
              <GraduationCap size={20} />
            </div>
            Uni<strong>Link</strong>
          </Link>
          <p className="footer__tagline">
            Connecting students and lecturers for a smarter, seamless
            university appointment and communication experience.
          </p>
          <div className="footer__socials">
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
            <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="footer__social-btn">
              <Github size={16} />
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter" className="footer__social-btn">
              <Twitter size={16} />
            </a>
            {/* eslint-disable-next-line jsx-a11y/anchor-has-content */}
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="footer__social-btn">
              <Linkedin size={16} />
            </a>
            <button type="button" aria-label="Website" className="footer__social-btn">
              <Globe size={16} />
            </button>
          </div>
        </div>

        {/* ── Portals column ── */}
        <div className="footer__col">
          <h4>Portals</h4>
          <ul>
            <li><Link to="/student/home">Student Portal</Link></li>
            <li><Link to="/lecturer/home">Lecturer Portal</Link></li>
            <li><Link to="/appointments">Appointments</Link></li>
            <li><Link to="/chat">Messages</Link></li>
            <li><Link to="/profile">My Profile</Link></li>
          </ul>
        </div>

        {/* ── Support column ── */}
        <div className="footer__col">
          <h4>Support</h4>
          <ul>
            <li><button type="button" onClick={() => {}}>Help Centre</button></li>
            <li><button type="button" onClick={() => {}}>User Guide</button></li>
            <li><button type="button" onClick={() => {}}>Privacy Policy</button></li>
            <li><button type="button" onClick={() => {}}>Terms of Service</button></li>
            <li><button type="button" onClick={() => {}}>Accessibility</button></li>
          </ul>
        </div>

        {/* ── Contact column ── */}
        <div className="footer__col">
          <h4>Contact Us</h4>
          <div className="footer__contact-item">
            <Mail size={14} />
            <span>support@unilink.edu.lk</span>
          </div>
          <div className="footer__contact-item">
            <Phone size={14} />
            <span>+94 11 234 5678</span>
          </div>
          <div className="footer__contact-item">
            <MapPin size={14} />
            <span>University of Technology,<br />Colombo 10, Sri Lanka</span>
          </div>
        </div>

      </div>

      {/* ── Bottom bar ── */}
      <div className="footer__bottom">
        <span>
          © {year} UniLink — University Lecturer Appointment Booking System.
          All rights reserved.
        </span>
        <span>Crafted with ♥ for better university experiences.</span>
      </div>
    </footer>
  );
}
