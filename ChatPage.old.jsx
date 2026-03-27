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
 *   currentUser ΓÇô { id, name, role, doNotDisturb, autoReplyMessage, ... }
 *   appointments ΓÇô array of { id, student, lecturer, startTime, status }
 *   (In a real app these come from a global context / router params.)
 */
export default function ChatPage({ currentUser, appointments = [], onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  // ΓöÇΓöÇ State ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
  const [savingDnd, setSavingDnd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomSummaries, setRoomSummaries] = useState([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [unreadByRoom, setUnreadByRoom] = useState({});
  const [showLecturerFinder, setShowLecturerFinder] = useState(false);
  const [searchingLecturers, setSearchingLecturers] = useState(false);
  const [lecturerFilters, setLecturerFilters] = useState({ query: '', department: '', designation: '' });
  const [lecturerResults, setLecturerResults] = useState([]);
  const totalUnread = Object.values(unreadByRoom).reduce((sum, n) => sum + (n || 0), 0);

  const messagesEndRef = useRef(null);
  const typingTimer = useRef(null);
  const seenMessageIdsRef = useRef(new Set());

  const isLecturer = currentUser?.role === 'LECTURER';

  // ΓöÇΓöÇ Current selected room summary ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ WebSocket ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ On mount: load rooms (appointment + direct) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Load messages when room changes ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Load unread counters for room list ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Check discipline block status for student -> lecturer chat ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Load room data ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Load canned responses for lecturer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    if (!isLecturer || !currentUser?.id) return;
    cannedApi.getByLecturer(currentUser.id)
      .then((r) => setCannedResponses(r.data))
      .catch(() => {});
  }, [isLecturer, currentUser?.id]);

  // ΓöÇΓöÇ Auto-scroll to bottom ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, filteredMessages]);

  useEffect(() => {
    setDnd(currentUser?.doNotDisturb ?? false);
  }, [currentUser?.doNotDisturb]);

  // ΓöÇΓöÇ Actions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇ Derived ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const displayMessages = filteredMessages ?? messages;
  const effectiveRoomStatus = selectedRoom?.roomStatus || roomData?.status;
  const roomClosed = effectiveRoomStatus === 'RESOLVED' || effectiveRoomStatus === 'CLOSED';
  const canStartNewDirectThread = !isLecturer
    && selectedRoom?.roomType === 'DIRECT'
    && roomClosed;
  const latestPinned = pinnedMessages[pinnedMessages.length - 1];

  // ΓöÇΓöÇ Render ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  return (
    <div className="chat-layout">
      <Header currentUser={currentUser} onLogout={onLogout} unreadCount={totalUnread} />
      <div className="chat-page">
      {/* ΓöÇΓöÇ Sidebar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
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
            <p>{currentUser?.name} ┬╖ {isLecturer ? 'Lecturer' : 'Student'}</p>
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
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{l.department || 'Department N/A'} ┬╖ {l.designation || 'Lecturer'}</div>
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
                    {room.roomStatus === 'RESOLVED' ? 'Γ£ô Resolved' : 'Open'} ┬╖ {room.roomType === 'DIRECT' ? `Question Thread #${room.roomId}` : `Session #${room.appointmentId}`}
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

      {/* ΓöÇΓöÇ Main ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
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
                  Chat with {otherParty?.name ?? 'ΓÇö'}
                </div>
                <div className="chat-header-status">
                  {isLecturer
                    ? `Student ┬╖ ${otherParty?.department ?? 'University'}`
                    : `Lecturer ┬╖ ${otherParty?.department ?? 'University'}`
                  }
                  &nbsp;┬╖&nbsp;{selectedRoom?.roomType === 'DIRECT' ? `Question Thread #${selectedRoom?.roomId}` : `Session #${selectedRoom?.appointmentId}`}
                </div>
              </div>
              <div className="chat-header-actions">
                {!isConnected && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--warning)', alignSelf: 'center', marginRight: 4 }}>
                    reconnectingΓÇª
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
                  placeholder="Search messagesΓÇª"
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
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>Loading messagesΓÇª</div>
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

      {/* ΓöÇΓöÇ Modals ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
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

// ΓöÇΓöÇ helpers ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
function downloadBlob(data, filename) {
  const url = window.URL.createObjectURL(new Blob([data]));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}
