package com.example.backend.service;

import com.example.backend.dto.ChatSummaryDTO;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.ChatMessage;
import com.example.backend.model.ChatRoom;
import com.example.backend.repository.ChatMessageRepository;
import com.example.backend.repository.ChatRoomRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatSummaryService {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm");

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplateBuilder restTemplateBuilder;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-2.0-flash}")
    private String geminiModel;

    @Value("${gemini.base-url:https://generativelanguage.googleapis.com/v1/models}")
    private String geminiBaseUrl;

    public ChatSummaryDTO generateSummary(Long roomId, boolean includeSystemMessages) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            throw new IllegalStateException("Gemini API key is missing. Set gemini.api.key in application.properties.");
        }

        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", roomId));

        List<ChatMessage> messages = chatMessageRepository.findByRoomOrderBySentAtAsc(room).stream()
                .filter(m -> !m.isDeleted())
                .filter(m -> includeSystemMessages || m.getMessageType() != ChatMessage.MessageType.SYSTEM)
                .collect(Collectors.toList());

        String transcript = buildTranscript(room, messages);
        GeminiCallResult result = callGemini(transcript);

        ChatSummaryDTO parsed = parseSummaryJson(roomId, result.text());
        parsed.setModel(result.model());
        parsed.setGeneratedAt(LocalDateTime.now());
        return parsed;
    }

    public String exportSummaryToText(ChatSummaryDTO summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("UniLink Chat Summary\n");
        sb.append("Room: ").append(summary.getRoomId()).append("\n");
        sb.append("Model: ").append(summary.getModel()).append("\n");
        sb.append("Generated: ").append(summary.getGeneratedAt() != null ? summary.getGeneratedAt().format(FMT) : "")
                .append("\n");
        sb.append("-".repeat(60)).append("\n\n");
        sb.append("Summary\n");
        sb.append(summary.getSummary() == null ? "" : summary.getSummary()).append("\n\n");

        sb.append("Key Points\n");
        if (summary.getKeyPoints() == null || summary.getKeyPoints().isEmpty()) {
            sb.append("- None\n");
        } else {
            summary.getKeyPoints().forEach(p -> sb.append("- ").append(p).append("\n"));
        }
        sb.append("\nAction Items\n");
        if (summary.getActionItems() == null || summary.getActionItems().isEmpty()) {
            sb.append("- None\n");
        } else {
            summary.getActionItems().forEach(a -> sb.append("- ").append(a).append("\n"));
        }
        return sb.toString();
    }

    public byte[] exportSummaryToPdf(ChatSummaryDTO summary) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 50, 50, 60, 60);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font title = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Font body = FontFactory.getFont(FontFactory.HELVETICA, 11);
            Font h = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
            Font meta = FontFactory.getFont(FontFactory.HELVETICA, 9, Font.ITALIC);

            doc.add(new Paragraph("UniLink - Chat Summary", title));
            doc.add(new Paragraph("Room: " + summary.getRoomId() + "  |  Model: " + summary.getModel(), meta));
            doc.add(new Paragraph("Generated: " +
                    (summary.getGeneratedAt() != null ? summary.getGeneratedAt().format(FMT) : ""), meta));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Summary", h));
            doc.add(new Paragraph(summary.getSummary() == null ? "" : summary.getSummary(), body));
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Key Points", h));
            if (summary.getKeyPoints() == null || summary.getKeyPoints().isEmpty()) {
                doc.add(new Paragraph("- None", body));
            } else {
                for (String p : summary.getKeyPoints()) {
                    doc.add(new Paragraph("- " + p, body));
                }
            }
            doc.add(new Paragraph(" "));

            doc.add(new Paragraph("Action Items", h));
            if (summary.getActionItems() == null || summary.getActionItems().isEmpty()) {
                doc.add(new Paragraph("- None", body));
            } else {
                for (String a : summary.getActionItems()) {
                    doc.add(new Paragraph("- " + a, body));
                }
            }

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate summary PDF: " + e.getMessage(), e);
        }
    }

    private String buildTranscript(ChatRoom room, List<ChatMessage> messages) {
        StringBuilder sb = new StringBuilder();
        if (room.getAppointment() != null) {
            sb.append("Context: Appointment #").append(room.getAppointment().getId()).append("\n");
        } else {
            sb.append("Context: Direct question thread #").append(room.getId()).append("\n");
        }
        sb.append("Messages:\n");

        if (messages.isEmpty()) {
            sb.append("(no messages)\n");
            return sb.toString();
        }

        for (ChatMessage m : messages) {
            String when = m.getSentAt() != null ? m.getSentAt().format(FMT) : "";
            sb.append("[").append(when).append("] ")
                    .append(m.getSender().getName())
                    .append(" (").append(m.getSender().getRole().name()).append(")")
                    .append(": ")
                    .append(m.getFilteredContent() != null ? m.getFilteredContent() : m.getContent());

            if (m.getFileName() != null && !m.getFileName().isBlank()) {
                sb.append(" [Attachment: ").append(m.getFileName()).append("]");
            }
            sb.append("\n");
        }

        return sb.toString();
    }

    private GeminiCallResult callGemini(String transcript) {
        RestTemplate restTemplate = restTemplateBuilder.build();

        String prompt = "You are a university chat summarizer. Return ONLY valid JSON with this shape: " +
                "{\"summary\":\"...\",\"keyPoints\":[\"...\"],\"actionItems\":[\"...\"]}. " +
                "Keep it factual and concise. Do not invent details. Transcript:\n\n" + transcript;

        Map<String, Object> request = new HashMap<>();
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(textPart));
        request.put("contents", List.of(content));
        request.put("generationConfig", Map.of("temperature", 0.2));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        List<String> candidateModels = buildCandidateModels(restTemplate);

        RuntimeException lastError = null;

        for (String model : candidateModels) {
            try {
                String text = generateWithModel(restTemplate, request, headers, model);
                return new GeminiCallResult(text, model);
            } catch (HttpClientErrorException.NotFound nf) {
                // Try next candidate model.
                lastError = new RuntimeException("Gemini model not found or not supported: " + model, nf);
            } catch (Exception e) {
                lastError = new RuntimeException("Gemini request failed for model " + model + ": " + e.getMessage(), e);
            }
        }

        if (lastError != null) {
            throw lastError;
        }
        throw new RuntimeException("Gemini request failed: no usable model available.");
    }

    private List<String> buildCandidateModels(RestTemplate restTemplate) {
        Set<String> models = new LinkedHashSet<>();

        String configured = normalizeModelName(geminiModel);
        if ("gemini-1.5-flash".equalsIgnoreCase(configured)) {
            configured = "gemini-2.0-flash";
        }

        models.add(configured);
        models.add("gemini-2.5-flash");
        models.add("gemini-2.5-flash-lite");
        models.add("gemini-2.5-pro");
        models.add("gemini-2.0-flash");
        models.add("gemini-2.0-flash-lite");
        models.add("gemini-1.5-flash-latest");
        models.add("gemini-1.5-pro-latest");

        models.addAll(fetchFallbackModels(restTemplate));

        return models.stream()
                .filter(m -> m != null && !m.isBlank())
                .toList();
    }

    private String generateWithModel(RestTemplate restTemplate,
                                     Map<String, Object> request,
                                     HttpHeaders headers,
                                     String model) {
        String baseUrl = normalizeBaseUrl(geminiBaseUrl);
        String url = baseUrl + "/" + model + ":generateContent?key=" + geminiApiKey;
        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(request, headers),
                String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini request failed with status: " + response.getStatusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new RuntimeException("Gemini returned no candidates.");
            }
            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new RuntimeException("Gemini returned no content parts.");
            }

            StringBuilder text = new StringBuilder();
            for (JsonNode p : parts) {
                String chunk = p.path("text").asText("");
                if (!chunk.isBlank()) {
                    text.append(chunk).append("\n");
                }
            }
            String output = text.toString().trim();
            if (output.isBlank()) {
                throw new RuntimeException("Gemini returned empty text.");
            }
            return output;
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Gemini response: " + e.getMessage(), e);
        }
    }

    private List<String> fetchFallbackModels(RestTemplate restTemplate) {
        try {
            String listUrl = normalizeBaseUrl(geminiBaseUrl) + "?key=" + geminiApiKey;
            ResponseEntity<String> response = restTemplate.getForEntity(listUrl, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode models = root.path("models");
            if (!models.isArray() || models.isEmpty()) {
                return List.of();
            }

            List<String> preferred = new ArrayList<>();
            List<String> others = new ArrayList<>();

            for (JsonNode modelNode : models) {
                JsonNode methods = modelNode.path("supportedGenerationMethods");
                boolean supportsGenerate = false;
                if (methods.isArray()) {
                    for (JsonNode method : methods) {
                        if ("generateContent".equalsIgnoreCase(method.asText(""))) {
                            supportsGenerate = true;
                            break;
                        }
                    }
                }
                if (!supportsGenerate) continue;

                String name = normalizeModelName(modelNode.path("name").asText(""));
                if (name.isBlank()) continue;

                if (name.contains("flash")) {
                    preferred.add(name);
                } else {
                    others.add(name);
                }
            }

            List<String> all = new ArrayList<>();
            all.addAll(preferred);
            all.addAll(others);
            return all;
        } catch (Exception e) {
            return List.of();
        }
    }

    private String normalizeModelName(String raw) {
        if (raw == null) return "";
        String cleaned = raw.trim();
        if (cleaned.startsWith("models/")) {
            cleaned = cleaned.substring("models/".length());
        }
        return cleaned;
    }

    private String normalizeBaseUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return "https://generativelanguage.googleapis.com/v1/models";
        }
        String cleaned = raw.trim();
        if (cleaned.contains("/v1beta/")) {
            return cleaned.replace("/v1beta/", "/v1/");
        }
        return cleaned;
    }

    private ChatSummaryDTO parseSummaryJson(Long roomId, String rawOutput) {
        String trimmed = rawOutput.trim();
        String normalized = trimmed
                .replace("```json", "")
                .replace("```", "")
                .trim();

        int firstBrace = normalized.indexOf('{');
        int lastBrace = normalized.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            normalized = normalized.substring(firstBrace, lastBrace + 1);
        }

        try {
            Map<String, Object> parsed = objectMapper.readValue(normalized, new TypeReference<>() {});
            String summary = valueAsString(parsed.get("summary"));
            List<String> keyPoints = valueAsList(parsed.get("keyPoints"));
            List<String> actionItems = valueAsList(parsed.get("actionItems"));

            if (summary == null || summary.isBlank()) {
                summary = "Summary could not be parsed cleanly. See generated text in key points.";
                if (keyPoints.isEmpty()) {
                    keyPoints.add(trimmed);
                }
            }

            return ChatSummaryDTO.builder()
                    .roomId(roomId)
                    .summary(summary)
                    .keyPoints(keyPoints)
                    .actionItems(actionItems)
                    .build();
        } catch (Exception e) {
            return ChatSummaryDTO.builder()
                    .roomId(roomId)
                    .summary("Auto summary generated, but JSON structure was not strict.")
                    .keyPoints(List.of(trimmed))
                    .actionItems(List.of())
                    .build();
        }
    }

    private String valueAsString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private List<String> valueAsList(Object value) {
        if (!(value instanceof List<?> items)) {
            return new ArrayList<>();
        }
        return items.stream()
                .map(String::valueOf)
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.toList());
    }

    private record GeminiCallResult(String text, String model) {}
}
