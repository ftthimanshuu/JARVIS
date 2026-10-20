package com.jarvis.backend.api;

import com.jarvis.backend.domain.EmailSummary;
import com.jarvis.backend.integrations.gmail.GmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    private final GmailService gmailService;

    public EmailController(GmailService gmailService) {
        this.gmailService = gmailService;
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecentEmails(@RequestParam(value = "maxResults", defaultValue = "10") int maxResults) {
        if (!gmailService.isConnected()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "not_connected",
                    "message", "Google account is not connected."
            ));
        }

        try {
            List<EmailSummary> emails = gmailService.getRecentEmails(maxResults);
            return ResponseEntity.ok(Map.of(
                    "count", emails.size(),
                    "emails", emails
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "gmail_error",
                    "message", e.getMessage()
            ));
        }
    }

    public record CreateDraftRequest(String to, String subject, String body, String threadId) {}

    @PostMapping("/draft")
    public ResponseEntity<?> createDraft(@RequestBody CreateDraftRequest request) {
        if (!gmailService.isConnected()) {
            return ResponseEntity.status(401).body(Map.of(
                    "error", "not_connected",
                    "message", "Google account is not connected."
            ));
        }

        try {
            Map<String, Object> result = gmailService.createDraft(
                    request.to(),
                    request.subject(),
                    request.body(),
                    request.threadId()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "draft_failed",
                    "message", e.getMessage()
            ));
        }
    }
}
