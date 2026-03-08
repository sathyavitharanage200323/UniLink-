import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Code, Paperclip, Zap,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';

const DEBOUNCE_MS = 800;

/**
 * The message compose bar.
 * Supports: text, code mode, file / image upload, canned responses.
 *
 * Props:
 *   roomId, currentUserId, currentUserRole
 *   onSend(wsPayload)  – call the WebSocket sender
 *   onTyping(isTyping) – propagate typing state
 *   cannedResponses    – array of { id, title, content }
 *   roomClosed         – bool, disable when resolved
 */
export default function ComposeBar({
  roomId,
  currentUserId,
  currentUserRole,
  onSend,
  onTyping,
  cannedResponses = [],
  roomClosed = false,
}) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('TEXT'); // TEXT | CODE
  const [showCanned, setShowCanned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [content]);

  function handleChange(e) {
    setContent(e.target.value);

    // Typing indicator
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping && onTyping(true);
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      isTypingRef.current = false;
      onTyping && onTyping(false);
    }, DEBOUNCE_MS);
  }

  function handleKeyDown(e) {
    // Ctrl+Enter or Shift+Enter = newline; Enter alone = send
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed || roomClosed) return;

    onSend({
      senderId: currentUserId,
      content: trimmed,
      messageType: mode,
    });

    setContent('');
    isTypingRef.current = false;
    onTyping && onTyping(false);
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await chatApi.uploadFile(file);
      const { fileUrl, fileName } = res.data;
      const type = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
      onSend({
        senderId: currentUserId,
        content: fileName,
        messageType: type,
        fileUrl,
        fileName,
      });
    } catch {
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function applyCanned(cr) {
    setContent(cr.content);
    setShowCanned(false);
    textareaRef.current?.focus();
  }

  if (roomClosed) {
    return (
      <div className="compose-area" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        This chat is resolved. No new messages can be sent.
      </div>
    );
  }

  return (
    <div className="compose-area">
      {/* Canned responses panel */}
      {showCanned && cannedResponses.length > 0 && (
        <div className="canned-panel">
          {cannedResponses.map((cr) => (
            <div key={cr.id} className="canned-item" onClick={() => applyCanned(cr)}>
              <Zap size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="canned-title">{cr.title}</div>
                <div className="canned-preview">{cr.content}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="compose-toolbar">
        <button
          className={`icon-btn ${mode === 'CODE' ? 'active' : ''}`}
          title="Toggle code mode"
          onClick={() => setMode((m) => (m === 'CODE' ? 'TEXT' : 'CODE'))}
        >
          <Code size={16} />
        </button>

        <button
          className="icon-btn"
          title="Attach file or image"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.py,.js,.java,.cs,.cpp,.ts"
          onChange={handleFileChange}
        />

        {currentUserRole === 'LECTURER' && cannedResponses.length > 0 && (
          <button
            className={`icon-btn ${showCanned ? 'active' : ''}`}
            title="Quick canned responses"
            onClick={() => setShowCanned((v) => !v)}
          >
            <Zap size={16} />
          </button>
        )}

        {mode !== 'TEXT' && (
          <span className={`type-badge ${mode === 'CODE' ? 'code' : ''}`}>
            {mode}
          </span>
        )}

        {uploading && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Uploading…</span>}
      </div>

      {/* Input row */}
      <div className="compose-input-row">
        <textarea
          ref={textareaRef}
          className={`compose-textarea ${mode === 'CODE' ? 'code-mode' : ''}`}
          placeholder={
            mode === 'CODE'
              ? 'Paste your code here…'
              : 'Type a message… (Enter to send, Shift+Enter for new line)'
          }
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!content.trim()}
          title="Send"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
