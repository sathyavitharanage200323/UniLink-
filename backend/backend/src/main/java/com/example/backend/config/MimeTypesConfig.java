package com.example.backend.config;

import org.springframework.boot.web.server.MimeMappings;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MimeTypesConfig {
    @Bean
    public WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> mimeTypesCustomizer() {
        return factory -> {
            MimeMappings mappings = new MimeMappings(MimeMappings.DEFAULT);
            mappings.add("webm", "audio/webm");
            mappings.add("weba", "audio/webm");
            mappings.add("ogg", "audio/ogg");
            mappings.add("oga", "audio/ogg");
            mappings.add("mp3", "audio/mpeg");
            mappings.add("m4a", "audio/mp4");
            mappings.add("wav", "audio/wav");
            factory.setMimeMappings(mappings);
        };
    }
}
