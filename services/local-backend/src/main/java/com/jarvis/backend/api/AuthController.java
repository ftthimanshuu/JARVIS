package com.jarvis.backend.api;

import com.jarvis.backend.domain.OAuthAccount;
import com.jarvis.backend.integrations.googleauth.GoogleAuthService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth/google")
public class AuthController {

    private final GoogleAuthService googleAuthService;

    public AuthController(GoogleAuthService googleAuthService) {
        this.googleAuthService = googleAuthService;
    }

    @GetMapping("/url")
    public ResponseEntity<?> getAuthUrl(@RequestParam(value = "state", defaultValue = "jarvis_oauth") String state) {
        try {
            if (!googleAuthService.isCredentialsConfigured()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "credentials_not_found",
                        "message", "Google credentials.json is not configured on the local backend."
                ));
            }
            String url = googleAuthService.getAuthorizationUrl(state);
            return ResponseEntity.ok(Map.of("authUrl", url));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping(value = "/callback", produces = MediaType.TEXT_HTML_VALUE)
    public String handleCallback(@RequestParam("code") String code) {
        try {
            OAuthAccount account = googleAuthService.handleCallback(code);
            String email = account.getEmail() != null ? account.getEmail() : "your Google Account";

            return """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <title>JARVIS — Google Account Connected</title>
                    <style>
                        body {
                            background-color: #0b0f19;
                            color: #e2e8f0;
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            height: 100vh;
                            margin: 0;
                        }
                        .card {
                            background: rgba(18, 24, 38, 0.85);
                            border: 1px solid rgba(255, 255, 255, 0.1);
                            padding: 40px;
                            border-radius: 20px;
                            text-align: center;
                            max-width: 420px;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
                        }
                        .ring {
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            border: 3.5px solid #22c55e;
                            margin: 0 auto 20px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .checkmark {
                            color: #22c55e;
                            font-size: 24px;
                            font-weight: bold;
                        }
                        h2 {
                            margin: 0 0 10px;
                            font-size: 22px;
                            font-weight: 600;
                            color: #ffffff;
                        }
                        p {
                            color: #94a3b8;
                            font-size: 14px;
                            line-height: 1.5;
                            margin: 0 0 24px;
                        }
                        .email-badge {
                            background: rgba(255, 255, 255, 0.08);
                            padding: 6px 14px;
                            border-radius: 9999px;
                            font-size: 13px;
                            color: #60a5fa;
                            display: inline-block;
                            margin-bottom: 24px;
                        }
                        .hint {
                            font-size: 12px;
                            color: #64748b;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <div class="ring">
                            <span class="checkmark">&#10003;</span>
                        </div>
                        <h2>Connected to JARVIS</h2>
                        <div class="email-badge">%s</div>
                        <p>Google authentication was successful. Your Gmail inbox and draft assistance are now active.</p>
                        <div class="hint">You may safely close this browser window and return to JARVIS.</div>
                    </div>
                </body>
                </html>
                """.formatted(email);
        } catch (Exception e) {
            return """
                <!DOCTYPE html>
                <html>
                <body style="background:#0b0f19; color:#f87171; font-family:sans-serif; text-align:center; padding-top:100px;">
                    <h2>OAuth Connection Failed</h2>
                    <p style="color:#94a3b8;">%s</p>
                </body>
                </html>
                """.formatted(e.getMessage());
        }
    }

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        Optional<OAuthAccount> opt = googleAuthService.getConnectedAccount();
        if (opt.isPresent()) {
            OAuthAccount acc = opt.get();
            return ResponseEntity.ok(Map.of(
                    "connected", true,
                    "email", acc.getEmail() != null ? acc.getEmail() : "",
                    "configured", googleAuthService.isCredentialsConfigured()
            ));
        } else {
            return ResponseEntity.ok(Map.of(
                    "connected", false,
                    "configured", googleAuthService.isCredentialsConfigured()
            ));
        }
    }

    @PostMapping("/disconnect")
    public ResponseEntity<?> disconnect() {
        googleAuthService.disconnect();
        return ResponseEntity.ok(Map.of("message", "Disconnected successfully."));
    }
}
