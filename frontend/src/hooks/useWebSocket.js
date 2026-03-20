import { useRef, useEffect, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BACKEND_BASE_URL } from '../config';

/**
 * Custom hook for STOMP WebSocket connection.
 *
 * @param {number|null} roomId  – the chat room to join
 * @param {function}    onMessage   – called with each new ChatMessageDTO
 * @param {function}    onTyping    – called with TypingPayload
 */
export function useWebSocket(roomId, onMessage, onTyping) {
  const clientRef = useRef(null);
  const queueRef = useRef([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BACKEND_BASE_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        // Subscribe to broadcasted messages
        client.subscribe(`/topic/room/${roomId}`, (frame) => {
          const msg = JSON.parse(frame.body);
          onMessage && onMessage(msg);
        });
        // Subscribe to typing indicators
        client.subscribe(`/topic/typing/${roomId}`, (frame) => {
          const payload = JSON.parse(frame.body);
          onTyping && onTyping(payload);
        });

        // Flush queued messages after reconnect.
        while (queueRef.current.length > 0) {
          const body = queueRef.current.shift();
          client.publish({
            destination: `/app/chat.send/${roomId}`,
            body,
          });
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      setIsConnected(false);
      client.deactivate();
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((payload) => {
    const body = JSON.stringify(payload);
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/chat.send/${roomId}`,
        body,
      });
      return true;
    }
    queueRef.current.push(body);
    return false;
  }, [roomId]);

  const sendTyping = useCallback((payload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/chat.typing/${roomId}`,
        body: JSON.stringify(payload),
      });
    }
  }, [roomId]);

  const sendReadReceipt = useCallback((payload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/chat.read/${roomId}`,
        body: JSON.stringify(payload),
      });
    }
  }, [roomId]);

  return { sendMessage, sendTyping, sendReadReceipt, isConnected };
}
