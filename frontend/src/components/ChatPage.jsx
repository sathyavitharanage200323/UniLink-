import React, {
  useState, useEffect, useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search, Download, CheckCircle, Shield, Pin,
  Zap, Bell, BellOff, MessageSquare, ChevronDown, ArrowLeft,
} from 'lucide-react';

import '../Chat.css';
import Header from './Header';
import MessageList from './MessageList';
import ComposeBar from './ComposeBar';
import DisciplineModal from './DisciplineModal';
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
export default function ChatPage({ currentUser, appointments = [], onLogout }) {
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
  const [showDiscipline, setShowDiscipline] = useState(false);
  const [showCannedMgr, setShowCannedMgr] = useState(false);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [dnd, setDnd] = useState(currentUser?.doNotDisturb ?? false);
  const [dndMsg] = useState(currentUser?.autoReplyMessage ?? '');
  const [loading, setLoading] = useState(false);
  const [roomsMap, setRoomsMap] = useState({}); // appointmentId -> room
  const [isBlocked, setIsBlocked] = useState(false);
  const [unreadByRoom, setUnreadByRoom] = useState({});

  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const seenMessageIdsRef = useRef(new Set());

  const isLecturer = currentUser?.role === 'LECTURER';

  // ── Get room info for the current appointment ──────────────────
  const currentAppointment = appointments.find((a) =>
    roomsMap[a.id]?.id === selectedRoomId
  );
  const otherParty = currentAppointment
    ? (isLecturer ? currentAppointment.student : currentAppointment.lecturer)
    : null;

  function getRoomCounterpartyName(roomId) {
    const appt = appointments.find((a) => roomsMap[a.id]?.id === roomId);
    if (!appt) return 'New message';
    const party = isLecturer ? appt.student : appt.lecturer;
    return party?.name || 'New message';
  }

  // ── WebSocket ──────────────────────────────────────────────────
  const { sendMessage: wsSend, sendTyping, sendReadReceipt, isConnected } = useWebSocket(
    selectedRoomId,
    (msg) => {
      const isIncoming = msg.senderId !== currentUser?.id;
      const isFreshMessage = !seenMessageIdsRef.current.has(msg.id);
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

  // ── On mount: load rooms for all confirmed appointments ────────
  useEffect(() => {
    async function loadRooms() {
      const map = {};
      for (const appt of appointments) {
        if (appt.status === 'CONFIRMED') {
          try {
            const res = await chatApi.getRoomByAppointment(appt.id);
            map[appt.id] = res.data;
          } catch {
            // Room may not exist yet – create it
            try {
              const res = await chatApi.createRoom(appt.id);
              map[appt.id] = res.data;
            } catch {}
          }
        }
      }
      setRoomsMap(map);
    }
    if (appointments.length > 0) loadRooms();
  }, [appointments]);

  // ── Load messages when room changes ───────────────────────────
  useEffect(() => {
    if (!selectedRoomId) return;
    setLoading(true);
    setMessages([]);
    seenMessageIdsRef.current = new Set();
    setFilteredMessages(null);
    setSearchQuery('');
    setFilterType('ALL');

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
      const roomIds = Object.values(roomsMap).map((r) => r?.id).filter(Boolean);
      if (!currentUser?.id || roomIds.length === 0) return;
      const entries = await Promise.all(
        roomIds.map(async (rid) => {
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
  }, [roomsMap, currentUser?.id]);

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

  // ── Load room data ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedRoomId) return;
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

  // ── Actions ───────────────────────────────────────────────────
  function handleSend(payload) {
    const sent = wsSend(payload);
    if (!sent) {
      toast.info('Connection lost. Message queued and will send after reconnect.');
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

  async function handleDndToggle(val) {
    setDnd(val);
    try {
      await userApi.toggleDnd(currentUser?.id, val, dndMsg);
      toast.success(val ? 'Do Not Disturb ON' : 'Do Not Disturb OFF');
    } catch {}
  }

  // ── Derived ────────────────────────────────────────────────────
  const displayMessages = filteredMessages ?? messages;
  const roomClosed = roomData?.status === 'RESOLVED' || roomData?.status === 'CLOSED';
  const latestPinned = pinnedMessages[pinnedMessages.length - 1];

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="chat-layout">
      <Header currentUser={currentUser} onLogout={onLogout} />
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
        <div className="sidebar-list">
          {appointments.filter((a) => roomsMap[a.id]).map((appt) => {
            const room = roomsMap[appt.id];
            const counterpart = isLecturer ? appt.student : appt.lecturer;
            const isActive = room?.id === selectedRoomId;
            return (
              <div
                key={appt.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <div className="sidebar-item-avatar">
                  {counterpart?.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="sidebar-item-info">
                  <div className="sidebar-item-name">{counterpart?.name ?? 'Unknown'}</div>
                  <div className="sidebar-item-meta">
                    {room.status === 'RESOLVED' ? '✓ Resolved' : 'Open'}
                  </div>
                </div>
                {(unreadByRoom[room.id] || 0) > 0 && (
                  <span className="unread-badge">{unreadByRoom[room.id]}</span>
                )}
              </div>
            );
          })}
          {appointments.filter((a) => roomsMap[a.id]).length === 0 && (
            <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              No confirmed appointments yet.
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
                <div className="chat-header-name">
                  Chat with {otherParty?.name ?? '—'}
                </div>
                <div className="chat-header-status">
                  {isLecturer
                    ? `Student · ${otherParty?.department ?? 'University'}`
                    : `Lecturer · ${otherParty?.department ?? 'University'}`
                  }
                  &nbsp;·&nbsp;Session #{currentAppointment?.id}
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
                    <button className={`icon-btn ${dnd ? 'active' : ''}`} title="Do Not Disturb" onClick={() => handleDndToggle(!dnd)}>
                      {dnd ? <BellOff size={18} /> : <Bell size={18} />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Room status */}
            {roomClosed && (
              <div className={`room-banner resolved`}>
                <CheckCircle size={14} />
                This chat has been resolved. The transcript is read-only.
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
                  {['ALL', 'TEXT', 'CODE', 'FILE', 'IMAGE'].map((t) => (
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
      {showDiscipline && isLecturer && (
        <DisciplineModal
          studentId={otherParty?.id}
          studentName={otherParty?.name}
          lecturerId={currentUser?.id}
          onClose={() => setShowDiscipline(false)}
          onApplied={() => {}}
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
