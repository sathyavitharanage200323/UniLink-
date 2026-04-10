import React, { useRef, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { BACKEND_BASE_URL } from '../config';
import {
  Pin, CheckCircle2, Trash2, FileText,
} from 'lucide-react';

/**
 * Renders the full message list with date separators,
 * read receipts, pinned highlights, and context actions.
 */
export default function MessageList({
  messages,
  currentUserId,
  currentUserRole,
  onPin,
  onMarkAnswer,
  onDelete,
}) {
  // Group messages by date for dividers
  const grouped = groupByDate(messages);

  return (
    <>
      {grouped.map((group) => (
        <React.Fragment key={group.dateLabel}>
          <div className="date-divider">{group.dateLabel}</div>
          {group.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onPin={onPin}
              onMarkAnswer={onMarkAnswer}
              onDelete={onDelete}
            />
          ))}
        </React.Fragment>
      ))}
    </>
  );
}

function MessageBubble({ msg, currentUserId, currentUserRole, onPin, onMarkAnswer, onDelete }) {
  const isMe = msg.senderId === currentUserId;
  const isLecturer = msg.senderRole === 'LECTURER';
  const isSystem = msg.messageType === 'SYSTEM';

  if (isSystem) {
    return (
      <div className="message-row system">
        <div className="bubble system-bubble">{msg.content}</div>
      </div>
    );
  }

  return (
    <div className={`message-row ${isMe ? 'mine' : ''}`}>
      {!isMe && (
        <div className={`msg-avatar ${isLecturer ? 'lecturer' : ''}`}>
          {msg.senderName?.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="bubble-wrap">
        {!isMe && <span className="sender-name">{msg.senderName}</span>}

        <div
          className={[
            'bubble',
            msg.deleted ? 'deleted' : '',
            msg.markedAsAnswer ? 'marked-answer' : '',
            msg.messageType === 'CODE' ? 'code-bubble' : '',
            msg.messageType === 'AUDIO' ? 'audio-bubble' : '',
            msg.pinned ? 'pinned-highlight' : '',
          ].join(' ').trim()}
        >
          <BubbleContent msg={msg} isMe={isMe} />

          {/* Context action buttons */}
          <div className="bubble-context-menu">
            <button className="ctx-btn" title="Pin" onClick={() => onPin(msg.id)}>
              <Pin size={14} />
            </button>
            {currentUserRole === 'LECTURER' && !isMe && (
              <button className="ctx-btn" title="Mark as Answer" onClick={() => onMarkAnswer(msg.id)}>
                <CheckCircle2 size={14} />
              </button>
            )}
            {isMe && !msg.deleted && (
              <button className="ctx-btn" title="Delete" onClick={() => onDelete(msg.id)}>
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="bubble-meta">
          <span>{msg.sentAt ? format(new Date(msg.sentAt), 'HH:mm') : ''}</span>
          {isMe && (
            <span className="read-tick" title={msg.read ? 'Read' : 'Delivered'}>
              {msg.read ? '✓✓' : '✓'}
            </span>
          )}
          {msg.pinned && <Pin size={10} />}
        </div>
      </div>
    </div>
  );
}

function BubbleContent({ msg, isMe }) {
  if (msg.deleted) return <span>{msg.content}</span>;

  if (msg.messageType === 'CODE') {
    return (
      <SyntaxHighlighter
        style={atomOneDark}
        customStyle={{ margin: 0, borderRadius: 6, fontSize: '0.82rem', background: 'transparent' }}
        wrapLongLines
      >
        {msg.content}
      </SyntaxHighlighter>
    );
  }

  if (msg.messageType === 'IMAGE') {
    return (
      <div>
        {msg.fileUrl && (
          <img
            src={`${BACKEND_BASE_URL}${msg.fileUrl}`}
            alt={msg.fileName || 'image'}
            style={{ maxWidth: '100%', borderRadius: 8, display: 'block', marginBottom: 4 }}
          />
        )}
        {msg.content && msg.content !== msg.fileName && <span>{msg.content}</span>}
      </div>
    );
  }

  if (msg.messageType === 'AUDIO') {
    return <AudioMessage msg={msg} />;
  }

  if (msg.messageType === 'FILE') {
    return (
      <a
        className="file-attachment"
        href={`${BACKEND_BASE_URL}${msg.fileUrl}`}
        target="_blank"
        rel="noreferrer"        aria-label={`Download ${msg.fileName || 'file'}`}      >
        <FileText size={16} />
        <span>{msg.fileName || 'Download file'}</span>
      </a>
    );
  }

  // TEXT with markdown
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // open links in new tab
        // eslint-disable-next-line jsx-a11y/anchor-has-content
        a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer" style={{ color: isMe ? 'rgba(255,255,255,0.9)' : undefined }} />,
      }}
    >
      {msg.content}
    </ReactMarkdown>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function groupByDate(messages) {
  const groups = [];
  let currentLabel = null;
  let currentGroup = null;

  for (const msg of messages) {
    const date = msg.sentAt ? new Date(msg.sentAt) : new Date();
    const label = formatDateLabel(date);

    if (label !== currentLabel) {
      currentLabel = label;
      currentGroup = { dateLabel: label, messages: [] };
      groups.push(currentGroup);
    }
    currentGroup.messages.push(msg);
  }
  return groups;
}

function formatDateLabel(date) {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

function AudioMessage({ msg }) {
  const audioRef = useRef(null);
  const [speed, setSpeed] = useState(1);
  const [duration, setDuration] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState(false);

  const fileUrl = `${BACKEND_BASE_URL}${msg.fileUrl}`;

  const guessAudioType = (nameOrUrl = '') => {
    const value = String(nameOrUrl).toLowerCase();
    if (value.endsWith('.ogg') || value.includes('.ogg?')) return 'audio/ogg';
    if (value.endsWith('.mp3') || value.includes('.mp3?')) return 'audio/mpeg';
    if (value.endsWith('.wav') || value.includes('.wav?')) return 'audio/wav';
    if (value.endsWith('.m4a') || value.includes('.m4a?') || value.endsWith('.mp4') || value.includes('.mp4?')) return 'audio/mp4';
    return 'audio/webm';
  };

  const toggleSpeed = () => {
    const next = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1;
    setSpeed(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const handleLoaded = () => {
    if (audioRef.current?.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handlePlay = () => {
    setPlaybackError(false);
    if (audioRef.current) {
      // Defensive defaults in case browser persisted muted/low volume state.
      audioRef.current.muted = false;
      if (audioRef.current.volume === 0) {
        audioRef.current.volume = 1;
      }
    }
    setPlaying(true);
  };

  const formatDuration = (value) => {
    if (!value) return '0:00';
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className={`audio-message ${playing ? 'playing' : ''}`}>
      <div className="audio-waveform">
        {Array.from({ length: 12 }).map((_, idx) => (
          <span key={`bar-${idx}`} className="audio-wave-bar" />
        ))}
      </div>
      <div className="audio-controls">
        <audio
          ref={audioRef}
          controls
          preload="metadata"
          onLoadedMetadata={handleLoaded}
          onPlay={handlePlay}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaybackError(true)}
        >
          <source src={fileUrl} type={guessAudioType(msg.fileName || msg.fileUrl)} />
        </audio>
        <div className="audio-meta">
          <button className="audio-speed" type="button" onClick={toggleSpeed}>
            {speed}x
          </button>
          <span className="audio-duration">{formatDuration(duration)}</span>
        </div>
        {playbackError && (
          <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#b91c1c' }}>
            Audio could not be played inline. <a href={fileUrl} target="_blank" rel="noreferrer">Open file</a>
          </div>
        )}
      </div>
      {msg.fileName && <div className="audio-filename">{msg.fileName}</div>}
    </div>
  );
}
