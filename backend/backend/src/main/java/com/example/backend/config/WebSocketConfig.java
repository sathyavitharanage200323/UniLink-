package com.example.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configures STOMP over WebSocket for real-time chat.
 *
 * Clients connect to ws://localhost:8080/ws
 * Subscribe to:  /topic/room/{roomId}          -> broadcast messages
 *                /user/queue/notifications      -> personal notifications
 * Send to:       /app/chat.sendMessage/{roomId}
 *                /app/chat.typing/{roomId}
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory broker; destinations starting with /topic are broadcast
        config.enableSimpleBroker("/topic", "/queue");
        // Client sends messages to /app/...
        config.setApplicationDestinationPrefixes("/app");
        // For user-specific messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Restrict to frontend origin in production
                .withSockJS();  // Fallback for browsers that don't support native WebSocket
    }
}
