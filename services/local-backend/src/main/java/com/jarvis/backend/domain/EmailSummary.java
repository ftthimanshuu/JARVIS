package com.jarvis.backend.domain;

import java.time.Instant;

public record EmailSummary(
        String id,
        String threadId,
        String from,
        String to,
        String subject,
        String snippet,
        Instant date,
        boolean isUnread,
        String urgency,
        String suggestedAction
) {}
