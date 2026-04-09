import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Send, Code, Paperclip, Zap, Mic, Square, Trash2,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';

const DEBOUNCE_MS = 800;
const MAX_AUDIO_MB = 12;
const MAX_RECORD_SECONDS = 120;

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
 *   blocked            – bool, disable when student is blocked by lecturer
 */
export default function ComposeBar({
  roomId,
  currentUserId,
  currentUserRole,
  onSend,
  onTyping,
  cannedResponses = [],
  roomClosed = false,
  blocked = false,
}) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('TEXT'); // TEXT | CODE
  const [showCanned, setShowCanned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioPreview, setAudioPreview] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const recordTimerRef = useRef(null);
  const recordWarnedRef = useRef(false);
  const discardOnStopRef = useRef(false);
  const sendOnStopRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  }, [content]);

  useEffect(() => () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
    }
    if (audioPreview?.url) {
      URL.revokeObjectURL(audioPreview.url);
    }
  }, [audioPreview]);

  function clearAudioPreview() {
    if (audioPreview?.url) {
      URL.revokeObjectURL(audioPreview.url);
    }
    setAudioPreview(null);
    setAudioDuration(0);
  }

  function formatDuration(value) {
    if (!value) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

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
    if (audioPreview) {
      sendAudioMessage();
      return;
    }

    const trimmed = content.trim();

    if (roomClosed) {
      toast.info('This chat room is closed.');
      return;
    }
    if (blocked) {
      toast.error('You are currently blocked from messaging this lecturer.');
      return;
    }
    if (!trimmed) {
      toast.warning('Cannot send an empty message.');
      return;
    }
    if (trimmed.length > 2000) {
      toast.error(`Message is too long. Limit is 2000 characters.`);
      return;
    }

    onSend({
      senderId: currentUserId,
      content: trimmed,
      messageType: mode,
    });

    setContent('');
    isTypingRef.current = false;
    onTyping && onTyping(false);
  }

  async function uploadAndSendAudio(blob, mime) {
    if (!blob) return false;
    if (roomClosed) {
      toast.info('This chat room is closed.');
      return false;
    }
    if (blocked) {
      toast.error('You are currently blocked from messaging this lecturer.');
      return false;
    }

    setUploading(true);
    try {
      const safeMime = mime || 'audio/webm';
      const extension = safeMime.includes('mpeg') ? 'mp3' : 'webm';
      const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: safeMime });
      const res = await chatApi.uploadFile(file);
      const { fileUrl, fileName } = res.data;
      const sent = await Promise.resolve(onSend && onSend({
        senderId: currentUserId,
        content: 'Voice message',
        messageType: 'AUDIO',
        fileUrl,
        fileName,
      }));

      if (sent === false) {
        return false;
      }

      toast.success('Voice message sent');
      return true;
    } catch {
      toast.error('Voice upload failed. Please try again.');
      return false;
    } finally {
      setUploading(false);
    }
  }

  async function sendAudioMessage() {
    if (!audioPreview?.blob) return;
    const ok = await uploadAndSendAudio(audioPreview.blob, audioPreview.type);
    if (ok) {
      clearAudioPreview();
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // File Size Validation (limit to 5 MB)
    const MAX_FILE_SIZE_MB = 5;
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      toast.error(`File is too large! Maximum allowed size is ${MAX_FILE_SIZE_MB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`);
      e.target.value = ''; // Reset input
      return;
    }

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

  async function startRecording() {
    if (roomClosed || blocked) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported in this browser.');
      return;
    }
    try {
      if (audioPreview) {
        clearAudioPreview();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordTimerRef.current) {
          clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setIsRecording(false);

        if (discardOnStopRef.current) {
          discardOnStopRef.current = false;
          setRecordSeconds(0);
          recorderRef.current = null;
          return;
        }

        const blob = new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' });
        if (blob.size === 0) {
          toast.info('No audio captured.');
          setRecordSeconds(0);
          recorderRef.current = null;
          return;
        }
        const fileSizeMB = blob.size / (1024 * 1024);
        if (fileSizeMB > MAX_AUDIO_MB) {
          toast.error(`Audio is too large! Max ${MAX_AUDIO_MB}MB.`);
          setRecordSeconds(0);
          recorderRef.current = null;
          return;
        }
        if (sendOnStopRef.current) {
          sendOnStopRef.current = false;
          const ok = await uploadAndSendAudio(blob, blob.type || 'audio/webm');
          if (!ok) {
            setAudioPreview({ blob, url: URL.createObjectURL(blob), type: blob.type || 'audio/webm' });
          }
          setRecordSeconds(0);
          recorderRef.current = null;
          return;
        }

        setAudioPreview({ blob, url: URL.createObjectURL(blob), type: blob.type || 'audio/webm' });
        setRecordSeconds(0);
        recorderRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      recordWarnedRef.current = false;
      discardOnStopRef.current = false;
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          const next = prev + 1;
          if (!recordWarnedRef.current && next >= MAX_RECORD_SECONDS - 10) {
            recordWarnedRef.current = true;
            toast.warning('Max recording length is 2 minutes. 10 seconds left.');
          }
          if (next >= MAX_RECORD_SECONDS) {
            stopRecording();
            toast.info('Recording stopped at 2 minutes.');
            return next;
          }
          return next;
        });
      }, 1000);
    } catch {
      toast.error('Microphone permission denied.');
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    } else {
      setIsRecording(false);
    }
  }

  function discardRecording() {
    if (isRecording) {
      sendOnStopRef.current = false;
      discardOnStopRef.current = true;
      stopRecording();
      return;
    }
    if (audioPreview) {
      clearAudioPreview();
    }
  }

  function handleSendClick() {
    if (isRecording) {
      sendOnStopRef.current = true;
      discardOnStopRef.current = false;
      stopRecording();
      return;
    }
    handleSend();
  }

  function applyCanned(cr) {
    setContent(cr.content);
    setShowCanned(false);
    textareaRef.current?.focus();
  }

  if (roomClosed || blocked) {
    return (
      <div 
        className="compose-area" 
        style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '20px' }}
        onClick={() => {
          if (blocked) toast.error('You are currently blocked from messaging this lecturer.');
          else if (roomClosed) toast.info('This chat room is closed. You can no longer send messages.');
        }}
      >
        {roomClosed
          ? 'This chat is resolved. No new messages can be sent.'
          : 'You are blocked from sending messages in this chat.'}
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
          className={`icon-btn ${isRecording ? 'recording' : ''}`}
          title={isRecording ? 'Stop recording' : 'Record voice message'}
          onClick={() => (isRecording ? stopRecording() : startRecording())}
          disabled={uploading}
        >
          {isRecording ? <Square size={16} /> : <Mic size={16} />}
        </button>

        {(isRecording || audioPreview) && (
          <button
            className="icon-btn danger"
            title={isRecording ? 'Cancel recording' : 'Discard voice message'}
            onClick={discardRecording}
            disabled={uploading}
          >
            <Trash2 size={16} />
          </button>
        )}

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

        {isRecording && (
          <span className="recording-pill">
            Recording {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
          </span>
        )}
        {uploading && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Uploading…</span>}
      </div>

      {audioPreview && !isRecording && (
        <div className="audio-preview">
          <audio
            controls
            preload="metadata"
            src={audioPreview.url}
            onLoadedMetadata={(e) => setAudioDuration(e.currentTarget.duration || 0)}
          />
          <div className="audio-preview-meta">
            <span className="audio-preview-label">Voice ready</span>
            <span className="audio-preview-duration">{formatDuration(audioDuration)}</span>
          </div>
          <div className="audio-preview-hint">Press Send to deliver</div>
        </div>
      )}

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
          onClick={handleSendClick}
          disabled={uploading || (!content.trim() && !audioPreview && !isRecording)}
          title={isRecording ? 'Stop and send' : 'Send'}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}


