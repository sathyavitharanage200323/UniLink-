package com.example.backend.controller;

import com.example.backend.dto.ChatMessageDTO;
import com.example.backend.dto.SendMessageRequest;
import com.example.backend.dto.TypingPayload;
import com.example.backend.model.ChatMessage;
import com.example.backend.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

/**
 * Handles real-time WebSocket STOMP messages.
 *
 * Clients send to:    /app/chat.send/{roomId}
 *                     /app/chat.typing/{roomId}
 * Clients subscribe:  /topic/room/{roomId}
 *                     /topic/typing/{roomId}
 */
@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Receive a new message from a client and broadcast to all subscribers
     * of /topic/room/{roomId}.
     */
    @MessageMapping("/chat.send/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,
                            @Payload SendMessageRequest request) {
        ChatMessage saved = chatService.sendMessage(
                roomId,
                request.getSenderId(),
                request.getContent(),
                request.getMessageType(),
                request.getFileUrl(),
                request.getFileName());

        ChatMessageDTO dto = ChatMessageDTO.from(saved);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, dto);
    }

    /**
     * Broadcast typing indicator to /topic/typing/{roomId}.
     * Payload: { userId, userName, typing: true/false }
     */
    @MessageMapping("/chat.typing/{roomId}")
    public void handleTyping(@DestinationVariable Long roomId,
                             @Payload TypingPayload payload) {
        messagingTemplate.convertAndSend("/topic/typing/" + roomId, payload);
    }
}
