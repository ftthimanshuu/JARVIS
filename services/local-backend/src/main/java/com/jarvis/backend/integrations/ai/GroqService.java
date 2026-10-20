package com.jarvis.backend.integrations.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jarvis.backend.domain.AppSetting;
import com.jarvis.backend.domain.EmailSummary;
import com.jarvis.backend.persistence.AppSettingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class GroqService {

    private static final Logger log = LoggerFactory.getLogger(GroqService.class);
    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String SETTING_KEY_GROQ = "groq_api_key";
    private static final String SETTING_KEY_MODEL = "groq_model";
    public static final String DEFAULT_MODEL = "llama-3.3-70b-versatile";

    private final AppSettingRepository settingRepository;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${jarvis.groq.api-key:}")
    private String envApiKey;

    public GroqService(AppSettingRepository settingRepository, ObjectMapper objectMapper) {
        this.settingRepository = settingRepository;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return getApiKey().isPresent();
    }

    public Optional<String> getApiKey() {
        Optional<AppSetting> dbSetting = settingRepository.findByKey(SETTING_KEY_GROQ);
        if (dbSetting.isPresent() && dbSetting.get().getValue() != null && !dbSetting.get().getValue().isBlank()) {
            return Optional.of(dbSetting.get().getValue().trim());
        }

        if (envApiKey != null && !envApiKey.isBlank()) {
            return Optional.of(envApiKey.trim());
        }

        String env = System.getenv("GROQ_API_KEY");
        if (env != null && !env.isBlank()) {
            return Optional.of(env.trim());
        }

        return Optional.empty();
    }

    public void saveApiKey(String apiKey) {
        AppSetting setting = settingRepository.findByKey(SETTING_KEY_GROQ)
                .orElse(new AppSetting(SETTING_KEY_GROQ, apiKey));
        setting.setValue(apiKey != null ? apiKey.trim() : "");
        setting.setUpdatedAt(Instant.now());
        settingRepository.save(setting);
    }

    public String getModel() {
        return settingRepository.findByKey(SETTING_KEY_MODEL)
                .map(AppSetting::getValue)
                .filter(v -> !v.isBlank())
                .orElse(DEFAULT_MODEL);
    }

    public void saveModel(String model) {
        AppSetting setting = settingRepository.findByKey(SETTING_KEY_MODEL)
                .orElse(new AppSetting(SETTING_KEY_MODEL, model));
        setting.setValue(model);
        setting.setUpdatedAt(Instant.now());
        settingRepository.save(setting);
    }

    public String getMaskedApiKey() {
        return getApiKey().map(key -> {
            if (key.length() <= 8) return "••••••••";
            return key.substring(0, 4) + "••••••••" + key.substring(key.length() - 4);
        }).orElse("");
    }

    private String callGroq(List<Map<String, String>> messages, double temperature, Integer maxTokens) throws Exception {
        String apiKey = getApiKey().orElseThrow(() -> new IllegalStateException("Groq API key is not configured."));

        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("model", getModel());
        requestPayload.put("messages", messages);
        requestPayload.put("temperature", temperature);
        if (maxTokens != null) {
            requestPayload.put("max_tokens", maxTokens);
        }

        String jsonBody = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 400) {
            log.error("Groq API returned error {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Groq API error (" + response.statusCode() + "): " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            return choices.get(0).path("message").path("content").asText();
        }

        throw new RuntimeException("Invalid response format from Groq API.");
    }

    public Map<String, Object> summarizeEmail(String from, String subject, String bodyOrSnippet) throws Exception {
        String systemPrompt = """
                You are JARVIS, an elite desktop AI assistant.
                Analyze the provided email and output a concise summary in valid JSON format.
                Follow these strict rules:
                1. Clearly separate confirmed facts found in the email from recommendations.
                2. Extract any specific dates, deadlines, or timings mentioned.
                3. Determine urgency: 'HIGH', 'NORMAL', or 'LOW'.
                4. Output ONLY valid JSON matching this schema:
                {
                  "summary": "1-2 sentence core overview",
                  "urgency": "HIGH|NORMAL|LOW",
                  "actionRequired": "Recommended action or 'None'",
                  "keyDates": ["Extracted dates or deadlines"],
                  "senderIntent": "Why the sender contacted"
                }
                """;

        String userContent = String.format("From: %s\nSubject: %s\nContent:\n%s", from, subject, bodyOrSnippet);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userContent)
        );

        String rawResponse = callGroq(messages, 0.2, 500);

        // Parse JSON or extract json block if wrapped in markdown
        String cleaned = rawResponse.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        cleaned = cleaned.trim();

        try {
            return objectMapper.readValue(cleaned, Map.class);
        } catch (Exception e) {
            log.warn("Failed to parse Groq response as JSON, returning fallback structure: {}", rawResponse);
            return Map.of(
                    "summary", rawResponse,
                    "urgency", "NORMAL",
                    "actionRequired", "Review message",
                    "keyDates", List.of(),
                    "senderIntent", "Informational"
            );
        }
    }

    public String generateReplyDraft(String from, String subject, String bodyOrSnippet, String userGuidance) throws Exception {
        String systemPrompt = """
                You are JARVIS, drafting an email reply on behalf of the user (Himanshu).
                Strict rules:
                1. Professional, warm, and concise tone.
                2. NEVER promise actions or commitments not explicitly mentioned by the user.
                3. If the user provided guidance, prioritize and follow it accurately.
                4. Output ONLY the email body text. Do not include subject lines or Markdown quotes.
                """;

        StringBuilder userContent = new StringBuilder();
        userContent.append("Original Email:\n");
        userContent.append("From: ").append(from).append("\n");
        userContent.append("Subject: ").append(subject).append("\n");
        userContent.append("Content: ").append(bodyOrSnippet).append("\n\n");

        if (userGuidance != null && !userGuidance.isBlank()) {
            userContent.append("User instructions for the reply: ").append(userGuidance).append("\n");
        } else {
            userContent.append("Write a standard polite reply acknowledging the message and confirming next steps.\n");
        }

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userContent.toString())
        );

        return callGroq(messages, 0.4, 750);
    }

    public String chat(String userPrompt, List<EmailSummary> recentEmails) throws Exception {
        String systemPrompt = """
                You are JARVIS, a desktop AI companion inspired by Marvel's JARVIS and modern executive assistants.
                You are running locally on the user's machine.
                You have access to the user's recent Gmail inbox.
                Answer concisely, intelligently, and helpfully.
                If the user asks about emails, refer to the provided context emails.
                """;

        StringBuilder context = new StringBuilder();
        if (recentEmails != null && !recentEmails.isEmpty()) {
            context.append("Current Inbox Context (Recent Emails):\n");
            for (int i = 0; i < Math.min(recentEmails.size(), 8); i++) {
                EmailSummary e = recentEmails.get(i);
                context.append(String.format("- [%d] From: %s | Subject: %s | Snippet: %s | Urgency: %s\n",
                        i + 1, e.from(), e.subject(), e.snippet(), e.urgency()));
            }
            context.append("\n");
        }

        context.append("User Query: ").append(userPrompt);

        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", context.toString())
        );

        return callGroq(messages, 0.5, 600);
    }
}
