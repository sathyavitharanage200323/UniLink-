import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  Calendar,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { chatApi } from '../api/chatApi';
import {
  getAllAppointments,
  getLecturerAppointments,
  getStudentAppointments,
} from '../api';
import './NotificationsPage.css';

export default function NotificationsPage({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [chatNotifications, setChatNotifications] = useState([]);
  const [appointmentNotifications, setAppointmentNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [lastUpdated, setLastUpdated] = useState(null);
  const prevUnreadRef = useRef(0);
  const appointmentStatusRef = useRef(new Map());
  const appointmentInitRef = useRef(false);
  const upcomingNotifiedRef = useRef(new Set());
  const dailySummaryDateRef = useRef('');

  const notificationsEnabled = currentUser?.role === 'STUDENT'
    ? currentUser?.notificationEnabled !== false
    : true;
  const isLecturer = currentUser?.role === 'LECTURER';

  const formatRelativeWhen = (dateValue) => {
    if (!dateValue) return 'Now';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Now';

    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString();
  };

  const parseAppointmentTime = (appointment) => {
    if (!appointment?.startTime) return null;
    const date = new Date(appointment.startTime);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const createAppointmentNotification = (id, title, meta, route = '/appointments') => ({
    id,
    title,
    meta,
    route,
    type: 'appointment',
    time: Date.now(),
  });

  const fetchAppointmentsForRole = useCallback(async () => {
    if (!currentUser?.id) return [];
    if (currentUser.role === 'STUDENT') {
      return await getStudentAppointments(currentUser.id);
    }
    if (currentUser.role === 'LECTURER') {
      return await getLecturerAppointments(currentUser.id);
    }
    return await getAllAppointments();
  }, [currentUser?.id, currentUser?.role]);

  const loadChatNotifications = useCallback(async () => {
    if (!currentUser?.id || !notificationsEnabled) return;
    try {
      const roomsRes = await chatApi.getRoomsForUser(currentUser.id);
      const rooms = roomsRes.data || [];

      const withUnread = await Promise.all(
        rooms.map(async (room) => {
          if (room?.roomStatus === 'RESOLVED' || room?.roomStatus === 'CLOSED') {
            return { ...room, unread: 0 };
          }
          try {
            const unreadRes = await chatApi.getUnreadCount(room.roomId, currentUser.id);
            return { ...room, unread: unreadRes.data?.count || 0 };
          } catch {
            return { ...room, unread: 0 };
          }
        })
      );

      const totalUnread = withUnread.reduce((sum, r) => sum + (r.unread || 0), 0);
      const newNotifications = withUnread
        .filter((r) => (r.unread || 0) > 0)
        .map((r) => ({
          id: `chat-${r.roomId}`,
          title: isLecturer ? (r.studentName || 'Student') : (r.lecturerName || 'Lecturer'),
          meta: `${r.roomType === 'DIRECT' ? 'Direct message' : `Session #${r.appointmentId}`} · ${r.unread} unread`,
          route: '/chat',
          type: 'chat',
          time: Date.now(),
        }));

      setChatNotifications(newNotifications);
      prevUnreadRef.current = totalUnread;
      setLastUpdated(new Date());
    } catch {
      // Keep existing list on polling failures.
    }
  }, [currentUser?.id, isLecturer, notificationsEnabled]);

  const loadAppointmentNotifications = useCallback(async () => {
    if (!currentUser?.id || !notificationsEnabled) return;
    try {
      const appointments = await fetchAppointmentsForRole();
      if (!Array.isArray(appointments)) return;

      const now = new Date();
      const currentStatusMap = new Map();
      const newEvents = [];

      appointments.forEach((appointment) => {
        currentStatusMap.set(appointment.id, appointment.status);
      });

      if (appointmentInitRef.current) {
        appointments.forEach((appointment) => {
          const prevStatus = appointmentStatusRef.current.get(appointment.id);
          const slotLabel = parseAppointmentTime(appointment)?.toLocaleString() || 'Scheduled slot';
          const studentName = appointment?.student?.name || 'Student';

          if (!prevStatus && appointment.status === 'PENDING' && currentUser.role !== 'STUDENT') {
            newEvents.push(
              createAppointmentNotification(
                `booked-${appointment.id}-${appointment.status}`,
                'New Slot Booked',
                `${studentName} booked ${slotLabel}`
              )
            );
          }

          if (prevStatus && prevStatus !== appointment.status) {
            if (appointment.status === 'CANCELLED') {
              newEvents.push(
                createAppointmentNotification(
                  `cancelled-${appointment.id}-${Date.now()}`,
                  'Slot Cancelled',
                  `${studentName} appointment on ${slotLabel} was cancelled`
                )
              );
            }
            if (appointment.status === 'CONFIRMED') {
              newEvents.push(
                createAppointmentNotification(
                  `confirmed-${appointment.id}-${Date.now()}`,
                  'Slot Confirmed',
                  `Appointment confirmed for ${slotLabel}`
                )
              );
            }
          }

          const startTime = parseAppointmentTime(appointment);
          const isConfirmed = appointment.status === 'CONFIRMED';
          if (startTime && isConfirmed) {
            const minutesToStart = Math.floor((startTime.getTime() - now.getTime()) / 60000);
            if (minutesToStart >= 0 && minutesToStart <= 60 && !upcomingNotifiedRef.current.has(appointment.id)) {
              upcomingNotifiedRef.current.add(appointment.id);
              newEvents.push(
                createAppointmentNotification(
                  `upcoming-${appointment.id}`,
                  'Upcoming Appointment',
                  `Starts in ${minutesToStart} minute${minutesToStart === 1 ? '' : 's'}`
                )
              );
            }
          }
        });
      }

      const todayKey = now.toISOString().slice(0, 10);
      if (dailySummaryDateRef.current !== todayKey) {
        const todayCount = appointments.filter((appointment) => {
          const d = parseAppointmentTime(appointment);
          return d && d.toISOString().slice(0, 10) === todayKey && appointment.status !== 'CANCELLED';
        }).length;
        newEvents.push(
          createAppointmentNotification(
            `daily-summary-${todayKey}`,
            'Daily Schedule Summary',
            `You have ${todayCount} appointment${todayCount === 1 ? '' : 's'} today`
          )
        );
        dailySummaryDateRef.current = todayKey;
      }

      appointmentStatusRef.current = currentStatusMap;
      appointmentInitRef.current = true;

      if (newEvents.length > 0) {
        setAppointmentNotifications((prev) => [...newEvents, ...prev]);
      }
      setLastUpdated(new Date());
    } catch {
      // Keep existing list on polling failures.
    }
  }, [currentUser?.id, currentUser?.role, fetchAppointmentsForRole, notificationsEnabled]);

  useEffect(() => {
    if (!notificationsEnabled) {
      setChatNotifications([]);
      setAppointmentNotifications([]);
      return;
    }
    loadChatNotifications();
    const timerId = setInterval(loadChatNotifications, 8000);
    return () => clearInterval(timerId);
  }, [loadChatNotifications, notificationsEnabled]);

  useEffect(() => {
    if (!notificationsEnabled) {
      setAppointmentNotifications([]);
      return;
    }
    loadAppointmentNotifications();
    const timerId = setInterval(loadAppointmentNotifications, 60000);
    return () => clearInterval(timerId);
  }, [loadAppointmentNotifications, notificationsEnabled]);

  const allNotifications = useMemo(() => {
    if (!notificationsEnabled) return [];
    return [...appointmentNotifications, ...chatNotifications]
      .sort((a, b) => (b.time || 0) - (a.time || 0));
  }, [appointmentNotifications, chatNotifications, notificationsEnabled]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'chat') return allNotifications.filter((n) => n.type === 'chat');
    if (activeTab === 'appointment') return allNotifications.filter((n) => n.type === 'appointment');
    return allNotifications;
  }, [activeTab, allNotifications]);

  const totalCount = allNotifications.length;
  const chatCount = chatNotifications.length;
  const appointmentCount = appointmentNotifications.length;

  return (
    <div className="notifications-page">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={prevUnreadRef.current} />

      <section className="notif-hero">
        <div className="notif-hero__content">
          <div className="notif-hero__eyebrow">
            <Bell size={16} /> Notification Center
          </div>
          <h1>All your messages and appointment alerts in one place.</h1>
          <p>
            Track unread chats, booking updates, and upcoming reminders without digging through pages.
          </p>
          <div className="notif-hero__actions">
            <button
              className="notif-refresh"
              type="button"
              onClick={() => {
                loadChatNotifications();
                loadAppointmentNotifications();
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
            <button
              className="notif-profile"
              type="button"
              onClick={() => navigate('/profile')}
            >
              Notification Settings <ChevronRight size={16} />
            </button>
          </div>
          {lastUpdated && (
            <div className="notif-hero__updated">
              Last updated {formatRelativeWhen(lastUpdated)}
            </div>
          )}
        </div>
        <div className="notif-hero__stats">
          <div className="notif-stat">
            <span>Total</span>
            <strong>{totalCount}</strong>
          </div>
          <div className="notif-stat">
            <span>Messages</span>
            <strong>{chatCount}</strong>
          </div>
          <div className="notif-stat">
            <span>Appointments</span>
            <strong>{appointmentCount}</strong>
          </div>
        </div>
      </section>

      <section className="notif-board">
        <div className="notif-tabs">
          <button
            type="button"
            className={activeTab === 'all' ? 'active' : ''}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            type="button"
            className={activeTab === 'chat' ? 'active' : ''}
            onClick={() => setActiveTab('chat')}
          >
            Messages
          </button>
          <button
            type="button"
            className={activeTab === 'appointment' ? 'active' : ''}
            onClick={() => setActiveTab('appointment')}
          >
            Appointments
          </button>
        </div>

        {!notificationsEnabled ? (
          <div className="notif-empty">
            <h3>Notifications are disabled</h3>
            <p>Enable notifications in your profile to start receiving updates.</p>
            <button type="button" onClick={() => navigate('/profile')}>Open Profile</button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="notif-empty">
            <h3>No new notifications</h3>
            <p>When new messages or booking updates arrive, they will appear here.</p>
          </div>
        ) : (
          <div className="notif-list">
            {filteredNotifications.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`notif-item ${item.type}`}
                onClick={() => navigate(item.route || '/appointments')}
              >
                <div className="notif-item__icon">
                  {item.type === 'chat' ? <MessageSquare size={16} /> : <Calendar size={16} />}
                </div>
                <div className="notif-item__body">
                  <div className="notif-item__title">{item.title}</div>
                  <div className="notif-item__meta">{item.meta}</div>
                </div>
                <div className="notif-item__time">{formatRelativeWhen(item.time)}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
