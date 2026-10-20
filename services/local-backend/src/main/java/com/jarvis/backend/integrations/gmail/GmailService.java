package com.jarvis.backend.integrations.gmail;

import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.Draft;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.api.services.gmail.model.MessagePartHeader;
import com.jarvis.backend.domain.EmailSummary;
import com.jarvis.backend.integrations.googleauth.GoogleAuthService;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Properties;

@Service
public class GmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailService.class);

    private final GoogleAuthService googleAuthService;

    public GmailService(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    private Gmail getGmailClient() {
        return new Gmail.Builder(
                googleAuthService.getHttpTransport(),
                GsonFactory.getDefaultInstance(),
                googleAuthService.getHttpRequestInitializer()
        )
        .setApplicationName("JARVIS")
        .build();
    }

    public boolean isConnected() {
        return googleAuthService.getConnectedAccount().isPresent();
    }

    public List<EmailSummary> getRecentEmails(int maxResults) throws Exception {
        Gmail client = getGmailClient();

        ListMessagesResponse listResponse = client.users().messages()
                .list("me")
                .setQ("in:inbox")
                .setMaxResults((long) Math.min(maxResults, 20))
                .execute();

        List<Message> messageList = listResponse.getMessages();
        if (messageList == null || messageList.isEmpty()) {
            return List.of();
        }

        List<EmailSummary> summaries = new ArrayList<>();
        for (Message m : messageList) {
            try {
                Message fullMsg = client.users().messages()
                        .get("me", m.getId())
                        .setFormat("metadata")
                        .setMetadataHeaders(List.of("From", "To", "Subject", "Date"))
                        .execute();

                String from = "";
                String to = "";
                String subject = "(No Subject)";
                if (fullMsg.getPayload() != null && fullMsg.getPayload().getHeaders() != null) {
                    for (MessagePartHeader header : fullMsg.getPayload().getHeaders()) {
                        if ("From".equalsIgnoreCase(header.getName())) {
                            from = header.getValue();
                        } else if ("To".equalsIgnoreCase(header.getName())) {
                            to = header.getValue();
                        } else if ("Subject".equalsIgnoreCase(header.getName())) {
                            subject = header.getValue();
                        }
                    }
                }

                boolean isUnread = fullMsg.getLabelIds() != null && fullMsg.getLabelIds().contains("UNREAD");
                Instant date = fullMsg.getInternalDate() != null
                        ? Instant.ofEpochMilli(fullMsg.getInternalDate())
                        : Instant.now();

                String snippet = fullMsg.getSnippet() != null ? fullMsg.getSnippet() : "";

                String lowerSubj = subject.toLowerCase();
                String lowerSnip = snippet.toLowerCase();
                String urgency = "normal";
                if (lowerSubj.contains("urgent") || lowerSubj.contains("asap") || lowerSubj.contains("action required")
                        || lowerSnip.contains("urgent") || lowerSnip.contains("deadline")) {
                    urgency = "high";
                } else if (!isUnread) {
                    urgency = "low";
                }

                String suggestedAction = urgency.equals("high") ? "Urgent Review & Reply" : (isUnread ? "Review & Draft Reply" : "Read");

                summaries.add(new EmailSummary(
                        fullMsg.getId(),
                        fullMsg.getThreadId(),
                        from,
                        to,
                        subject,
                        snippet,
                        date,
                        isUnread,
                        urgency,
                        suggestedAction
                ));
            } catch (Exception e) {
                log.warn("Error fetching email metadata for ID {}: {}", m.getId(), e.getMessage());
            }
        }

        return summaries;
    }

    /**
     * Strictly creates a draft in Gmail. Never sends autonomous emails.
     */
    public Map<String, Object> createDraft(String to, String subject, String bodyText, String threadId) throws Exception {
        Gmail client = getGmailClient();

        Properties props = new Properties();
        Session session = Session.getDefaultInstance(props, null);
        MimeMessage email = new MimeMessage(session);

        if (to != null && !to.isBlank()) {
            email.addRecipient(jakarta.mail.Message.RecipientType.TO, new InternetAddress(to));
        }
        email.setSubject(subject != null ? subject : "Draft Reply");
        email.setText(bodyText != null ? bodyText : "");

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        email.writeTo(buffer);
        byte[] rawBytes = buffer.toByteArray();
        String encodedEmail = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);

        Message message = new Message();
        message.setRaw(encodedEmail);
        if (threadId != null && !threadId.isBlank()) {
            message.setThreadId(threadId);
        }

        Draft draft = new Draft();
        draft.setMessage(message);

        Draft createdDraft = client.users().drafts().create("me", draft).execute();

        return Map.of(
                "draftId", createdDraft.getId(),
                "status", "Draft · Not sent",
                "message", "Draft created successfully in Gmail.",
                "to", to != null ? to : "",
                "subject", subject != null ? subject : ""
        );
    }
}
