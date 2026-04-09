import React, {
  useState, useEffect, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search, Download, CheckCircle, Shield, Pin,
  Zap, Bell, BellOff, MessageSquare, ChevronDown, ArrowLeft, X, Sparkles, FileText
} from 'lucide-react';

import '../Chat.css';
import Header from './Header';
import MessageList from './MessageList';
import ComposeBar from './ComposeBar';
import DisciplineModal from './DisciplineModal';
import ProfileModal from './ProfileModal';
import CannedResponseManager from './CannedResponseManager';
import { useWebSocket } from '../hooks/useWebSocket';
import { chatApi, cannedApi, userApi, disciplineApi } from '../api/chatApi';

/**
 * Main Chat Page.
 *
 * Props:
 *   currentUser – { id, name, role, doNotDisturb, autoReplyMessage, ... }
 *   appointments – array of { id, student, lecturer, startTime, status }
 *   (In a real app these come from a global context / router params.)
 */
export default function ChatPage({ currentUser, appointments = [], onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  // ── State ──────────────────────────────────────────────────────
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomData, setRoomData] = useState(null); // ChatRoom object
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState(null); // null = show all
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [typingInfo, setTypingInfo] = useState(null); // { userName, typing }
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [showPinned, setShowPinned] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDiscipline, setShowDiscipline] = useState(false);
  const [showCannedMgr, setShowCannedMgr] = useState(false);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [dnd, setDnd] = useState(currentUser?.doNotDisturb ?? false);
  const [dndMsg] = useState(currentUser?.autoReplyMessage ?? '');
  const [savingDnd, setSavingDnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomSummaries, setRoomSummaries] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [studentDisciplines, setStudentDisciplines] = useState([]);
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const [showLecturerFinder, setShowLecturerFinder] = useState(false);
  const [searchingLecturers, setSearchingLecturers] = useState(false);
  const [lecturerFilters, setLecturerFilters] = useState({ query: '', department: '', designation: '' });
  const [lecturerResults, setLecturerResults] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [includeSystemSummary, setIncludeSystemSummary] = useState(false);
  const totalUnread = Object.values(unreadByRoom).reduce((sum, n) => sum + (n || 0), 0);

  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const seenMessageIdsRef = useRef(new Set());

  const isLecturer = currentUser?.role === 'LECTURER';

  // ── Current selected room summary ───────────────────────────────
  const selectedRoom = roomSummaries.find((r) => r.roomId === selectedRoomId) || null;
  const otherParty = selectedRoom
    ? (isLecturer
      ? { id: selectedRoom.studentId, name: selectedRoom.studentName, department: selectedRoom.studentDepartment }
      : {
        id: selectedRoom.lecturerId,
        name: selectedRoom.lecturerName,
        department: selectedRoom.lecturerDepartment,
        designation: selectedRoom.lecturerDesignation,
      })
    : null;

  // ── WebSocket ──────────────────────────────────────────────────
  const { sendTyping, sendReadReceipt, isConnected } = useWebSocket(
    selectedRoomId,
    (msg) => {
      seenMessageIdsRef.current.add(msg.id);

      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === msg.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = msg;
          return next;
        }
        return [...prev, msg];
      });
      // Play notification sound if window not focused
      if (msg.senderId !== currentUser?.id && !document.hasFocus()) {
        try { new Audio('/notification.mp3').play(); } catch {}
      }
    },
    (payload) => {
      if (payload.userId !== currentUser?.id) {
        setTypingInfo(payload.typing ? payload : null);
        clearTimeout(typingTimer.current);
        if (payload.typing) {
          typingTimer.current = setTimeout(() => setTypingInfo(null), 3000);
        }
      }
    }
  );

  // ── On mount: load rooms (appointment + direct) ─────────────────
  useEffect(() => {
    async function loadRooms() {
      if (!currentUser?.id) return;
      try {
        const res = await chatApi.getRoomsForUser(currentUser.id);
        setRoomSummaries(res.data || []);
      } catch {
        setRoomSummaries([]);
      }
    }
    loadRooms();
  }, [currentUser?.id]);

  // ── Load messages when room changes ───────────────────────────
  useEffect(() => {
    if (!selectedRoomId) return;
    setLoading(true);
    setMessages([]);
    seenMessageIdsRef.current = new Set();
    setFilteredMessages(null);
    setSearchQuery('');
    setFilterType('ALL');
    setSummaryData(null);

    Promise.all([
      chatApi.getMessages(selectedRoomId),
      chatApi.getPinnedMessages(selectedRoomId),
    ])
      .then(([msgRes, pinRes]) => {
        setMessages(msgRes.data);
        seenMessageIdsRef.current = new Set(msgRes.data.map((m) => m.id));
        setPinnedMessages(pinRes.data);
        setUnreadByRoom((prev) => ({ ...prev, [selectedRoomId]: 0 }));

        // Mark unread incoming messages as read for receipts.
        const unreadIncoming = msgRes.data.filter((m) => !m.read && m.senderId !== currentUser?.id);
        unreadIncoming.forEach(async (m) => {
          try {
            sendReadReceipt({ messageId: m.id, readerId: currentUser?.id });
          } catch {}
        });
      })
      .catch(() => toast.error('Could not load messages.'))
      .finally(() => setLoading(false));
  }, [selectedRoomId, currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load unread counters for room list ───────────────────────────────────
  useEffect(() => {
    async function loadUnreadCounts() {
      const roomIds = roomSummaries.map((r) => r?.roomId).filter(Boolean);
      if (!currentUser?.id || roomIds.length === 0) return;
      const entries = await Promise.all(
        roomIds.map(async (rid) => {
          const room = roomSummaries.find((r) => r.roomId === rid);
          if (room?.roomStatus === 'RESOLVED' || room?.roomStatus === 'CLOSED') {
            return [rid, 0];
          }
          try {
            const res = await chatApi.getUnreadCount(rid, currentUser.id);
            return [rid, res.data?.count || 0];
          } catch {
            return [rid, 0];
          }
        })
      );
      setUnreadByRoom(Object.fromEntries(entries));
    }
    loadUnreadCounts();
  }, [roomSummaries, currentUser?.id]);

  useEffect(() => {
    async function findLecturers() {
      if (isLecturer) return;
      setSearchingLecturers(true);
      try {
        const res = await userApi.searchLecturers(lecturerFilters);
        setLecturerResults(res.data || []);
      } catch {
        setLecturerResults([]);
      } finally {
        setSearchingLecturers(false);
      }
    }

    if (showLecturerFinder) {
      findLecturers();
    }
  }, [showLecturerFinder, lecturerFilters, isLecturer]);

  // ── Check discipline block status for student -> lecturer chat ───────────
  useEffect(() => {
    async function checkBlocked() {
      if (!selectedRoomId || isLecturer || !otherParty?.id || !currentUser?.id) {
        setIsBlocked(false);
        return;
      }
      try {
        const res = await disciplineApi.checkBlocked(currentUser.id, otherParty.id);
        setIsBlocked(Boolean(res.data?.blocked));
      } catch {
        setIsBlocked(false);
      }
    }
    checkBlocked();
  }, [selectedRoomId, isLecturer, otherParty?.id, currentUser?.id]);

  // ── Fetch discipline records ───────────────────────────
  useEffect(() => {
    async function fetchDisciplines() {
      if (!selectedRoomId || !otherParty?.id || !currentUser?.id) {
        setStudentDisciplines([]);
        return;
      }
      try {
        const targetStudentId = isLecturer ? otherParty.id : currentUser.id;
        const res = await disciplineApi.getByStudent(targetStudentId);
        
        let activeRecords = (res.data || []).filter((d) => d.active);
        // If student, only show records applied by this specific lecturer
        if (!isLecturer) {
          activeRecords = activeRecords.filter(d => d.lecturer?.id === otherParty.id);
        }
        
        setStudentDisciplines(activeRecords);
      } catch (err) {
        setStudentDisciplines([]);
      }
    }
    fetchDisciplines();
  }, [selectedRoomId, isLecturer, otherParty?.id, currentUser?.id]);

  const handleRevokeDiscipline = async (id) => {
    if (!window.confirm("Are you sure you want to remove this label?")) return;
    try {
      await disciplineApi.revoke(id);
      setStudentDisciplines(prev => {
        const next = prev.filter(d => d.id !== id);
        if (!next.some(d => d.type === 'PERM_BLOCK' || d.type === 'TEMP_BLOCK')) {
          setIsBlocked(false);
        }
        return next;
      });
      toast.success('Label removed successfully.');
    } catch {
      toast.error('Failed to remove label.');
    }
  };

  // ── Load room data ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRoomId) {
      setRoomData(null);
      return;
    }
    setRoomData(null);
    chatApi.getRoom(selectedRoomId)
      .then((r) => setRoomData(r.data))
      .catch(() => {});
  }, [selectedRoomId]);

  // ── Load canned responses for lecturer ────────────────────────
  useEffect(() => {
    if (!isLecturer || !currentUser?.id) return;
    cannedApi.getByLecturer(currentUser.id)
      .then((r) => setCannedResponses(r.data))
      .catch(() => {});
  }, [isLecturer, currentUser?.id]);

  // ── Auto-scroll to bottom ─────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, filteredMessages]);

  useEffect(() => {
    setDnd(currentUser?.doNotDisturb ?? false);
  }, [currentUser?.doNotDisturb]);

  // ── Actions ───────────────────────────────────────────────────
  async function handleSend(payload) {
    if (!selectedRoomId) return;
    try {
      const res = await chatApi.sendMessage(selectedRoomId, payload);
      const saved = res.data;
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === saved.id);
        return exists ? prev : [...prev, saved];
      });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not send message.';
      toast.error(msg);
    }
  }

  function handleTyping(isTyping) {
    sendTyping({
      userId: currentUser?.id,
      userName: currentUser?.name,
      typing: isTyping,
    });
  }

  async function handlePin(messageId) {
    try {
      const res = await chatApi.togglePin(messageId);
      updateMessage(res.data);
      const pinnedRes = await chatApi.getPinnedMessages(selectedRoomId);
      setPinnedMessages(pinnedRes.data);
    } catch { toast.error('Could not pin message.'); }
  }

  async function handleMarkAnswer(messageId) {
    try {
      const res = await chatApi.markAsAnswer(messageId);
      updateMessage(res.data);
    } catch { toast.error('Could not mark answer.'); }
  }

  async function handleDelete(messageId) {
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await chatApi.deleteMessage(messageId, currentUser?.id);
      updateMessage(res.data);
    } catch { toast.error('Could not delete message.'); }
  }

  function updateMessage(updated) {
    setMessages((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  async function handleSearch(e) {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) { setFilteredMessages(null); return; }
    try {
      const res = await chatApi.searchMessages(selectedRoomId, q);
      setFilteredMessages(res.data);
    } catch {}
  }

  async function handleFilterType(type) {
    setFilterType(type);
    if (type === 'ALL') { setFilteredMessages(null); return; }
    try {
      const res = await chatApi.filterByType(selectedRoomId, type);
      setFilteredMessages(res.data);
    } catch {}
  }

  async function handleResolve() {
    if (!window.confirm('Mark this chat as Resolved? No new messages can be sent.')) return;
    try {
      const res = await chatApi.resolveRoom(selectedRoomId, currentUser?.id);
      setRoomData(res.data);
      setRoomSummaries((prev) => prev.map((r) => (
        r.roomId === selectedRoomId ? { ...r, roomStatus: 'RESOLVED' } : r
      )));
      setUnreadByRoom((prev) => ({ ...prev, [selectedRoomId]: 0 }));
      toast.success('Chat marked as Resolved.');
    } catch { toast.error('Could not resolve chat.'); }
  }

  async function exportPdf() {
    try {
      const res = await chatApi.exportPdf(selectedRoomId);
      downloadBlob(res.data, `chat-${selectedRoomId}.pdf`);
    } catch { toast.error('PDF export failed.'); }
  }

  async function exportTxt() {
    try {
      const res = await chatApi.exportTxt(selectedRoomId);
      downloadBlob(res.data, `chat-${selectedRoomId}.txt`);
    } catch { toast.error('TXT export failed.'); }
  }

  async function handleGenerateSummary() {
    if (!selectedRoomId) return;
    setSummaryLoading(true);
    try {
      const res = await chatApi.generateSummary(selectedRoomId, includeSystemSummary);
      setSummaryData(res.data);
      toast.success('Summary generated for this chat.');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not generate summary. Check Gemini API key.';
      toast.error(msg);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function exportSummaryPdf() {
    if (!selectedRoomId) return;
    try {
      const res = await chatApi.exportSummaryPdf(selectedRoomId, includeSystemSummary);
      downloadBlob(res.data, `chat-summary-${selectedRoomId}.pdf`);
    } catch {
      toast.error('Summary PDF export failed.');
    }
  }

  async function exportSummaryTxt() {
    if (!selectedRoomId) return;
    try {
      const res = await chatApi.exportSummaryTxt(selectedRoomId, includeSystemSummary);
      downloadBlob(res.data, `chat-summary-${selectedRoomId}.txt`);
    } catch {
      toast.error('Summary TXT export failed.');
    }
  }

  async function handleDndToggle(val) {
    if (!currentUser?.id || savingDnd) return;
    const prev = dnd;
    setDnd(val);
    setSavingDnd(true);
    try {
      const res = await userApi.toggleDnd(currentUser?.id, val, dndMsg);
      const updatedUser = res.data;
      if (onUserUpdate) {
        onUserUpdate({
          ...currentUser,
          doNotDisturb: updatedUser.doNotDisturb,
          autoReplyMessage: updatedUser.autoReplyMessage,
        });
      }
      toast.success(val ? 'Do Not Disturb ON' : 'Do Not Disturb OFF');
    } catch {
      setDnd(prev);
      toast.error('Failed to save Do Not Disturb setting.');
    } finally {
      setSavingDnd(false);
    }
  }

  async function handleStartDirectChat(lecturerId) {
    try {
      let res;
      try {
        res = await chatApi.createDirectRoomNew(currentUser?.id, lecturerId);
      } catch {
        // Fallback for older backend builds that do not expose /rooms/direct/new yet.
        res = await chatApi.createDirectRoom(currentUser?.id, lecturerId);
      }
      const roomId = res.data?.id;
      const roomsRes = await chatApi.getRoomsForUser(currentUser?.id);
      setRoomSummaries(roomsRes.data || []);
      if (roomId) {
        setSelectedRoomId(roomId);
      }
      setShowLecturerFinder(false);
      toast.success('New question chat started.');
    } catch {
      toast.error('Could not start direct chat.');
    }
  }

  async function handleStartNewQuestionThread() {
    if (!currentUser?.id || !selectedRoom?.lecturerId) return;
    try {
      let res;
      try {
        res = await chatApi.createDirectRoomNew(currentUser.id, selectedRoom.lecturerId);
      } catch {
        // Fallback so "Start New Question" still works even before backend restart.
        res = await chatApi.createDirectRoom(currentUser.id, selectedRoom.lecturerId);
      }
      const roomId = res.data?.id;
      const roomsRes = await chatApi.getRoomsForUser(currentUser.id);
      setRoomSummaries(roomsRes.data || []);
      if (roomId) {
        setSelectedRoomId(roomId);
        setUnreadByRoom((prev) => ({ ...prev, [roomId]: 0 }));
      }
      toast.success(`Opened Question Thread #${roomId || 'new'} for your new question.`);
    } catch {
      toast.error('Could not open a new chat thread.');
    }
  }

  // ── Derived ────────────────────────────────────────────────────
  const displayMessages = filteredMessages ?? messages;
  const effectiveRoomStatus = selectedRoom?.roomStatus || roomData?.status;
  const roomClosed = effectiveRoomStatus === 'RESOLVED' || effectiveRoomStatus === 'CLOSED';
  const canStartNewDirectThread = !isLecturer
    && selectedRoom?.roomType === 'DIRECT'
    && roomClosed;
  const latestPinned = pinnedMessages[pinnedMessages.length - 1];

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="chat-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={totalUnread} />
      <div className="chat-page">
      {/* ── Sidebar ─────────────────────────── */}
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <button
            className="sidebar-back-btn"
            onClick={() => navigate(isLecturer ? '/lecturer/home' : '/student/home')}
            title="Back to home"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="sidebar-header-text">
            <h2>UniLink Chat</h2>
            <p>{currentUser?.name} · {isLecturer ? 'Lecturer' : 'Student'}</p>
          </div>
        </div>
        {!isLecturer && (
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowLecturerFinder((v) => !v)}>
              {showLecturerFinder ? 'Hide Lecturer Finder' : 'Find Lecturer'}
            </button>
            {showLecturerFinder && (
              <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                <input
                  className="search-input"
                  placeholder="Search lecturer name / expertise"
                  value={lecturerFilters.query}
                  onChange={(e) => setLecturerFilters((p) => ({ ...p, query: e.target.value }))}
                />
                <select
                  className="search-input"
                  value={lecturerFilters.department}
                  onChange={(e) => setLecturerFilters((p) => ({ ...p, department: e.target.value }))}
                >
                  <option value="">All Departments</option>
                  <option value="Faculty Of Computing">Faculty Of Computing</option>
                  <option value="Faculty Of Engineering">Faculty Of Engineering</option>
                  <option value="Faculty Of Business">Faculty Of Business</option>
                  <option value="Faculty Of Humanities and Sciences">Faculty Of Humanities and Sciences</option>
                </select>
                <select
                  className="search-input"
                  value={lecturerFilters.designation}
                  onChange={(e) => setLecturerFilters((p) => ({ ...p, designation: e.target.value }))}
                >
                  <option value="">All Designations</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Lecturer In Charge">Lecturer In Charge</option>
                  <option value="Senior Lecturer">Senior Lecturer</option>
                  <option value="Professor">Professor</option>
                </select>

                <div style={{ maxHeight: 180, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 8, background: 'white' }}>
                  {searchingLecturers && (
                    <div style={{ padding: 10, color: 'var(--text-muted)', fontSize: '0.82rem' }}>Searching...</div>
                  )}
                  {!searchingLecturers && lecturerResults.map((l) => (
                    <div key={l.id} style={{ padding: 10, borderBottom: '1px solid var(--line)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{l.name}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{l.department || 'Department N/A'} · {l.designation || 'Lecturer'}</div>
                      {l.expertise && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{l.expertise}</div>}
                      <button className="btn btn-ghost" style={{ marginTop: 6, padding: '4px 8px' }} onClick={() => handleStartDirectChat(l.id)}>
                        Send Message
                      </button>
                    </div>
                  ))}
                  {!searchingLecturers && lecturerResults.length === 0 && (
                    <div style={{ padding: 10, color: 'var(--text-muted)', fontSize: '0.82rem' }}>No lecturers found for this filter.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="sidebar-list">
          {roomSummaries.map((room) => {
            const counterpart = isLecturer
              ? { name: room.studentName }
              : { name: room.lecturerName };
            const isActive = room?.roomId === selectedRoomId;
            const isResolved = room?.roomStatus === 'RESOLVED' || room?.roomStatus === 'CLOSED';
            const isOpenIssue = room?.roomStatus === 'OPEN';
            const displayUnread = isResolved ? 0 : (unreadByRoom[room.roomId] || 0);
            return (
              <div
                key={room.roomId}
                className={`sidebar-item ${isActive ? 'active' : ''} ${isOpenIssue ? 'needs-attention' : ''} ${isResolved ? 'resolved' : ''}`}
                onClick={() => setSelectedRoomId(room.roomId)}
              >
                <div className="sidebar-item-avatar">
                  {counterpart?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="sidebar-item-info">
                  <div className="sidebar-item-name">{counterpart?.name ?? 'Unknown'}</div>
                  <div className="sidebar-item-meta">
                    {room.roomStatus === 'RESOLVED' ? '✓ Resolved' : 'Open'} · {room.roomType === 'DIRECT' ? `Question Thread #${room.roomId}` : `Session #${room.appointmentId}`}
                  </div>
                </div>
                {displayUnread > 0 && (
                  <span className="unread-badge">{displayUnread}</span>
                )}
              </div>
            );
          })}
          {roomSummaries.length === 0 && (
            <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No chats yet. Start by finding a lecturer.
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ────────────────────────────── */}
      <main className="chat-main">
        {!selectedRoomId ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
            <MessageSquare size={48} strokeWidth={1} />
            <p>Select a conversation to start chatting</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-avatar">
                {otherParty?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="chat-header-info">
                <div className="chat-header-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Chat with <button onClick={() => setShowProfile(true)} style={{ background: 'none', border: 'none', color: 'inherit', padding: 0, font: 'inherit', cursor: 'pointer', textDecoration: 'underline' }}>{otherParty?.name ?? '—'}</button>
                  {studentDisciplines.map(d => (
                    <span key={d.id} title={d.reason} style={{
                      fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: d.type === 'WARNING' ? '#fef08a' : '#fecaca',
                      color: d.type === 'WARNING' ? '#854d0e' : '#991b1b',
                      display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid currentColor'
                    }}>
                      {d.type === 'WARNING' ? '⚠️ Warning' : '🚫 Blocked'}
                      {isLecturer && (
                        <button onClick={(e) => { e.stopPropagation(); handleRevokeDiscipline(d.id); }} style={{
                          background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                        }} title="Remove label">
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="chat-header-status">
                  {isLecturer
                    ? `Student · ${otherParty?.department ?? 'University'}`
                    : `Lecturer · ${otherParty?.department ?? 'University'}`
                  }
                  &nbsp;·&nbsp;{selectedRoom?.roomType === 'DIRECT' ? `Question Thread #${selectedRoom?.roomId}` : `Session #${selectedRoom?.appointmentId}`}
                </div>
              </div>
              <div className="chat-header-actions">
                {!isConnected && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--warning)', alignSelf: 'center', marginRight: 4 }}>
                    reconnecting…
                  </span>
                )}
                <button className={`icon-btn ${searchOpen ? 'active' : ''}`} title="Search" onClick={() => setSearchOpen((v) => !v)}>
                  <Search size={18} />
                </button>
                <button className={`icon-btn ${showPinned ? 'active' : ''}`} title="Pinned messages" onClick={() => setShowPinned((v) => !v)}>
                  <Pin size={18} />
                </button>
                <button className="icon-btn" title="Export" onClick={exportPdf}>
                  <Download size={18} />
                </button>
                {isLecturer && (
                  <>
                    <button className="icon-btn danger" title="Moderation" onClick={() => setShowDiscipline(true)}>
                      <Shield size={18} />
                    </button>
                    <button className="icon-btn" title="Manage quick responses" onClick={() => setShowCannedMgr(true)}>
                      <Zap size={18} />
                    </button>
                    <button className={`icon-btn ${dnd ? 'active' : ''}`} title="Do Not Disturb" disabled={savingDnd} onClick={() => handleDndToggle(!dnd)}>
                      {dnd ? <BellOff size={18} /> : <Bell size={18} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Warnings / Discipline Banner for Students */}
            {!isLecturer && studentDisciplines.length > 0 && (
              <div className="room-banner" style={{ background: '#fef08a', color: '#854d0e', borderBottom: '1px solid #fde047', flexDirection: 'column', alignItems: 'flex-start', padding: '8px 16px', gap: '4px' }}>
                {studentDisciplines.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {d.type === 'WARNING' ? '⚠️' : '🚫'}
                    <span><strong>{d.type === 'WARNING' ? 'Warning' : 'Blocked'}:</strong> {d.reason}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Room status */}
            {roomClosed && (
              <div className={`room-banner resolved`}>
                <CheckCircle size={14} />
                This chat has been resolved. The transcript is read-only.
                {canStartNewDirectThread && (
                  <button
                    className="btn btn-primary"
                    style={{ marginLeft: 10, padding: '4px 10px', fontSize: '0.78rem' }}
                    onClick={handleStartNewQuestionThread}
                  >
                    Start New Question
                  </button>
                )}
              </div>
            )}

            {isBlocked && (
              <div className={`room-banner resolved`}>
                <Shield size={14} />
                You are temporarily blocked by this lecturer and cannot send messages.
              </div>
            )}

            {/* Search panel */}
            {searchOpen && (
              <div className="search-panel">
                <input
                  className="search-input"
                  placeholder="Search messages…"
                  value={searchQuery}
                  onChange={handleSearch}
                />
                <div className="filter-tabs">
                  {['ALL', 'TEXT', 'CODE', 'FILE', 'IMAGE', 'AUDIO'].map((t) => (
                    <button
                      key={t}
                      className={`filter-tab ${filterType === t ? 'active' : ''}`}
                      onClick={() => handleFilterType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned messages strip */}
            {showPinned && pinnedMessages.length > 0 && (
              <div className="pinned-banner" onClick={() => setShowPinned(false)}>
                <Pin size={14} />
                <strong>Pinned:</strong>&nbsp;{latestPinned?.content?.slice(0, 80)}
                {pinnedMessages.length > 1 && <span style={{ marginLeft: 4, color: 'var(--primary)' }}>+{pinnedMessages.length - 1} more</span>}
                <ChevronDown size={14} style={{ marginLeft: 'auto' }} />
              </div>
            )}

            {/* Messages */}
            <div className="messages-area">
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Loading messages…</div>
              ) : (
                <MessageList
                  messages={displayMessages}
                  currentUserId={currentUser?.id}
                  currentUserRole={currentUser?.role}
                  onPin={handlePin}
                  onMarkAnswer={handleMarkAnswer}
                  onDelete={handleDelete}
                />
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            <div className="typing-indicator">
              {typingInfo?.typing && (
                <>
                  <span>{typingInfo.userName} is typing</span>
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                </>
              )}
            </div>

            {/* Resolve + Export bar (lecturer only) */}
            {isLecturer && !roomClosed && (
              <div className="resolve-section">
                <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '0.82rem' }} onClick={handleResolve}>
                  <CheckCircle size={14} style={{ marginRight: 4 }} /> Mark as Resolved
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Close the thread once the issue is solved.</span>
              </div>
            )}

            {/* Export row (visible to everyone) */}
            <div className="export-row">
              <span style={{ color: 'var(--text-muted)' }}>Export transcript:</span>
              <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={exportPdf}>PDF</button>
              <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={exportTxt}>TXT</button>
            </div>

            <div className="summary-panel">
              <div className="summary-panel-header">
                <div className="summary-title-wrap">
                  <Sparkles size={16} />
                  <strong>AI Chat Summary</strong>
                </div>
                <div className="summary-controls">
                  <label className="summary-checkbox">
                    <input
                      type="checkbox"
                      checked={includeSystemSummary}
                      onChange={(e) => setIncludeSystemSummary(e.target.checked)}
                    />
                    Include system messages
                  </label>
                  <button className="btn btn-primary" onClick={handleGenerateSummary} disabled={summaryLoading}>
                    {summaryLoading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              </div>

              {!summaryData ? (
                <p className="summary-empty">Generate a room-specific summary. Each chat thread gets its own summary content.</p>
              ) : (
                <div className="summary-body">
                  <div className="summary-meta">
                    <span>Model: {summaryData.model || 'Gemini'}</span>
                    {summaryData.generatedAt && <span>Generated: {new Date(summaryData.generatedAt).toLocaleString()}</span>}
                  </div>

                  <div className="summary-block">
                    <h4>Summary</h4>
                    <p>{summaryData.summary}</p>
                  </div>

                  <div className="summary-columns">
                    <div className="summary-block">
                      <h4>Key Points</h4>
                      <ul>
                        {(summaryData.keyPoints || []).length === 0
                          ? <li>No key points.</li>
                          : summaryData.keyPoints.map((item, idx) => <li key={`kp-${idx}`}>{item}</li>)}
                      </ul>
                    </div>
                    <div className="summary-block">
                      <h4>Action Items</h4>
                      <ul>
                        {(summaryData.actionItems || []).length === 0
                          ? <li>No action items.</li>
                          : summaryData.actionItems.map((item, idx) => <li key={`ai-${idx}`}>{item}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="summary-export-row">
                    <span><FileText size={14} /> Export summary only:</span>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={exportSummaryPdf}>PDF</button>
                    <button className="btn btn-ghost" style={{ padding: '4px 10px' }} onClick={exportSummaryTxt}>TXT</button>
                  </div>
                </div>
              )}
            </div>

            {/* Compose */}
            <ComposeBar
              roomId={selectedRoomId}
              currentUserId={currentUser?.id}
              currentUserRole={currentUser?.role}
              onSend={handleSend}
              onTyping={handleTyping}
              cannedResponses={cannedResponses}
              roomClosed={roomClosed}
              blocked={isBlocked}
            />
          </>
        )}
      </main>

      {/* ── Modals ──────────────────────────── */}
      {showProfile && otherParty?.id && (
        <ProfileModal 
          userId={otherParty.id} 
          onClose={() => setShowProfile(false)} 
        />
      )}

      {showDiscipline && isLecturer && (
        <DisciplineModal
          studentId={otherParty?.id}
          studentName={otherParty?.name}
          lecturerId={currentUser?.id}
          onClose={() => setShowDiscipline(false)}
          onApplied={(record) => {
            setStudentDisciplines(prev => [...prev, record]);
            if (record.type === 'PERM_BLOCK' || record.type === 'TEMP_BLOCK') {
              setIsBlocked(true);
            }
          }}
        />
      )}

      {showCannedMgr && isLecturer && (
        <CannedResponseManager
          lecturerId={currentUser?.id}
          responses={cannedResponses}
          onClose={() => setShowCannedMgr(false)}
          onUpdated={(list) => setCannedResponses(list)}
        />
      )}
      </div>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────
function downloadBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
