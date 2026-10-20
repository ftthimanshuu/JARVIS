package com.jarvis.backend.api;

import com.jarvis.backend.domain.EmailSummary;
import com.jarvis.backend.integrations.ai.GroqService;
import com.jarvis.backend.integrations.gmail.GmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GroqService groqService;
    private final GmailService gmailService;

    public AiController(GroqService groqService, GmailService gmailService) {
        this.groqService = groqService;
        this.gmailService = gmailService;
    }

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of(
                "configured", groqService.isConfigured(),
                "model", groqService.getModel(),
                "maskedApiKey", groqService.getMaskedApiKey()
        ));
    }

    public record SaveConfigRequest(String apiKey, String model) {}

    @PostMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody SaveConfigRequest request) {
        if (request.apiKey() != null && !request.apiKey().isBlank()) {
            groqService.saveApiKey(request.apiKey().trim());
        }
        if (request.model() != null && !request.model().isBlank()) {
            groqService.saveModel(request.model().trim());
        }
        return ResponseEntity.ok(Map.of(
                "message", "Groq AI configuration saved successfully.",
                "configured", groqService.isConfigured(),
                "model", groqService.getModel()
        ));
    }

    public record SummarizeRequest(String from, String subject, String snippet) {}

    @PostMapping("/summarize")
    public ResponseEntity<?> summarizeEmail(@RequestBody SummarizeRequest request) {
        if (!groqService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "groq_not_configured",
                    "message", "Please configure your Groq API key in Settings."
            ));
        }

        try {
            Map<String, Object> summary = groqService.summarizeEmail(
                    request.from() != null ? request.from() : "",
                    request.subject() != null ? request.subject() : "",
                    request.snippet() != null ? request.snippet() : ""
            );
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "ai_error",
                    "message", e.getMessage()
            ));
        }
    }

    public record DraftReplyRequest(String from, String subject, String snippet, String guidance) {}

    @PostMapping("/draft-reply")
    public ResponseEntity<?> draftReply(@RequestBody DraftReplyRequest request) {
        if (!groqService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "groq_not_configured",
                    "message", "Please configure your Groq API key in Settings."
            ));
        }

        try {
            String draftText = groqService.generateReplyDraft(
                    request.from() != null ? request.from() : "",
                    request.subject() != null ? request.subject() : "",
                    request.snippet() != null ? request.snippet() : "",
                    request.guidance()
            );
            return ResponseEntity.ok(Map.of("draft", draftText));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "ai_error",
                    "message", e.getMessage()
            ));
        }
    }

    public record ChatRequest(String prompt) {}

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest request) {
        if (!groqService.isConfigured()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "groq_not_configured",
                    "message", "Please configure your Groq API key in Settings to enable natural language chat."
            ));
        }

        try {
            List<EmailSummary> emails = null;
            if (gmailService.isConnected()) {
                try {
                    emails = gmailService.getRecentEmails(8);
                } catch (Exception ignored) {}
            }

            String answer = groqService.chat(request.prompt(), emails);
            return ResponseEntity.ok(Map.of("reply", answer));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "chat_error",
                    "message", e.getMessage()
            ));
        }
    }
}
