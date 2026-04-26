import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Send, Code, Paperclip, Zap, Mic, Square, Trash2, Vote,
} from 'lucide-react';
import { chatApi } from '../api/chatApi';

const DEBOUNCE_MS = 800;
const MAX_AUDIO_MB = 12;
const MAX_RECORD_SECONDS = 120;

function getAudioExtensionFromMime(mime = '') {
  const normalized = String(mime).toLowerCase();
  if (normalized.includes('webm')) return 'webm';
  if (normalized.includes('ogg')) return 'ogg';
  if (normalized.includes('mp4') || normalized.includes('aac') || normalized.includes('m4a')) return 'm4a';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'mp3';
  if (normalized.includes('wav')) return 'wav';
  return 'webm';
}

function pickRecordingMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }
  const candidates = [
    'audio/ogg;codecs=opus',
    'audio/webm;codecs=opus',
    'audio/webm',
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
}

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
  replyTarget = null,
  onClearReply,
  onCreatePoll,
}) {
  const [content, setContent] = useState('');
  const [mode, setMode] = useState('TEXT'); // TEXT | CODE
  const [showCanned, setShowCanned] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordSecondsRef = useRef(0);
  const [audioPreview, setAudioPreview] = useState(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const textareaRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);
  const fileInputRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const recordTimerRef = useRef(null);
  const monitorRafRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const inputDetectedRef = useRef(false);
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
    if (monitorRafRef.current) {
      cancelAnimationFrame(monitorRafRef.current);
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioPreview?.url) {
      URL.revokeObjectURL(audioPreview.url);
    }
  }, [audioPreview]);

  function cleanupAudioMonitoring() {
    if (monitorRafRef.current) {
      cancelAnimationFrame(monitorRafRef.current);
      monitorRafRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    analyserRef.current = null;
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }

  function startInputMonitor(stream) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioContext = new AudioCtx();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const sourceNode = audioContext.createMediaStreamSource(stream);
    sourceNode.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceNodeRef.current = sourceNode;
    inputDetectedRef.current = false;

    const dataArray = new Uint8Array(analyser.fftSize);
    const threshold = 2; // lower threshold to avoid false negatives on quiet mics

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteTimeDomainData(dataArray);

      let avg = 0;
      for (let i = 0; i < dataArray.length; i += 1) {
        avg += Math.abs(dataArray[i] - 128);
      }
      avg /= dataArray.length;

      if (avg > threshold) {
        inputDetectedRef.current = true;
      }
      monitorRafRef.current = requestAnimationFrame(tick);
    };

    monitorRafRef.current = requestAnimationFrame(tick);
  }

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
      replyToMessageId: replyTarget?.id || null,
    });

    setContent('');
    isTypingRef.current = false;
    onTyping && onTyping(false);
    onClearReply && onClearReply();
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

    // Guard against near-empty captures that can upload but contain no usable audio.
    if (blob.size < 1024) {
      toast.error('Recorded audio is too short or empty. Please record again.');
      return false;
    }

    setUploading(true);
    try {
      const safeMime = mime || 'audio/webm';
      const extension = getAudioExtensionFromMime(safeMime);
      const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: safeMime });
      const res = await chatApi.uploadFile(file);
      const { fileUrl, fileName } = res.data;
      const sent = await Promise.resolve(onSend && onSend({
        senderId: currentUserId,
        content: 'Voice message',
        messageType: 'AUDIO',
        fileUrl,
        fileName,
        replyToMessageId: replyTarget?.id || null,
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
        replyToMessageId: replyTarget?.id || null,
      });
      onClearReply && onClearReply();
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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      const liveTracks = stream.getAudioTracks();
      if (!liveTracks.length || liveTracks.every((t) => t.readyState !== 'live')) {
        throw new Error('No live microphone track available');
      }

      startInputMonitor(stream);
      const preferredMime = pickRecordingMimeType();
      const recorder = preferredMime
        ? new MediaRecorder(stream, { mimeType: preferredMime })
        : new MediaRecorder(stream);
      const chunks = [];

      recorder.onerror = () => {
        toast.error('Microphone recording failed. Please check mic device and browser permissions.');
      };

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunks.push(event.data);
      };

      recorder.onstop = async () => {
        cleanupAudioMonitoring();
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
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

        const resolvedMime = recorder.mimeType || chunks[0]?.type || preferredMime || 'audio/webm';
        const blob = new Blob(chunks, { type: resolvedMime });
        if (blob.size === 0) {
          toast.info('No audio captured.');
          setRecordSeconds(0);
          recorderRef.current = null;
          return;
        }
        // Keep the recording even if input monitor looks quiet; some devices report very low levels.
        const fileSizeMB = blob.size / (1024 * 1024);
        if (fileSizeMB > MAX_AUDIO_MB) {
          toast.error(`Audio is too large! Max ${MAX_AUDIO_MB}MB.`);
          setRecordSeconds(0);
          recordSecondsRef.current = 0;
          recorderRef.current = null;
          return;
        }
        if (sendOnStopRef.current) {
          sendOnStopRef.current = false;
          const ok = await uploadAndSendAudio(blob, resolvedMime);
          if (!ok) {
            setAudioPreview({ blob, url: URL.createObjectURL(blob), type: resolvedMime });
          }
          setRecordSeconds(0);
          recordSecondsRef.current = 0;
          recorderRef.current = null;
          return;
        }

        setAudioPreview({ blob, url: URL.createObjectURL(blob), type: resolvedMime });
        setRecordSeconds(0);
        recordSecondsRef.current = 0;
        recorderRef.current = null;
      };

      recorderRef.current = recorder;
      recorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      recordWarnedRef.current = false;
      discardOnStopRef.current = false;
      recordTimerRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          const next = prev + 1;
          recordSecondsRef.current = next;
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
    } catch (err) {
      const errorName = err?.name || '';
      if (errorName === 'NotAllowedError' || errorName === 'SecurityError') {
        toast.error('Microphone permission is blocked. Please allow microphone access in the browser site settings.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        toast.error('No microphone device found. Connect a microphone and try again.');
      } else {
        toast.error('Microphone access failed. Allow microphone permission and select a working input device.');
      }
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
      cleanupAudioMonitoring();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
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

        <button
          className="icon-btn"
          title="Create poll"
          onClick={() => onCreatePoll && onCreatePoll()}
          disabled={uploading}
        >
          <Vote size={16} />
        </button>

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

      {replyTarget && (
        <div className="audio-preview" style={{ marginTop: 0 }}>
          <div className="audio-preview-meta">
            <span className="audio-preview-label">Replying to {replyTarget.senderName || 'message'}</span>
            <button type="button" className="icon-btn danger" onClick={() => onClearReply && onClearReply()}>
              <Trash2 size={14} />
            </button>
          </div>
          <div className="audio-preview-hint" style={{ color: 'var(--text)' }}>
            {(replyTarget.content || '').slice(0, 120)}
          </div>
        </div>
      )}

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


