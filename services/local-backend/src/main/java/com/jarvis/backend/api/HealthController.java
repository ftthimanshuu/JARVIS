package com.jarvis.backend.api;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health and metadata endpoint.
 * Exempt from token validation so Tauri can poll it at startup.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @Value("${spring.application.version:0.1.0}")
    private String version;

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
            "status", "UP",
            "version", version,
            "timestamp", Instant.now().toString(),
            "service", "JARVIS Local Backend"
        );
    }
}
