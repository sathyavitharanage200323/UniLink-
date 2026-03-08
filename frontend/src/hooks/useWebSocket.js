import { useRef, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

/**
 * Custom hook for STOMP WebSocket connection.
 *
 * @param {number|null} roomId  – the chat room to join
 * @param {function}    onMessage   – called with each new ChatMessageDTO
 * @param {function}    onTyping    – called with TypingPayload
 */
export function useWebSocket(roomId, onMessage, onTyping) {
  const clientRef = useRef(null);

  useEffect(() => {
    if (!roomId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
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
      },
      onDisconnect: () => {},
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback((payload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/chat.send/${roomId}`,
        body: JSON.stringify(payload),
      });
    }
  }, [roomId]);

  const sendTyping = useCallback((payload) => {
    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: `/app/chat.typing/${roomId}`,
        body: JSON.stringify(payload),
      });
    }
  }, [roomId]);

  return { sendMessage, sendTyping };
}
