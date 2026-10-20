package com.jarvis.backend.integrations.googleauth;

import com.google.api.client.auth.oauth2.BearerToken;
import com.google.api.client.auth.oauth2.ClientParametersAuthentication;
import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.RefreshTokenRequest;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeTokenRequest;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleTokenResponse;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.jarvis.backend.domain.OAuthAccount;
import com.jarvis.backend.persistence.OAuthAccountRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
public class GoogleAuthService {

    private static final Logger log = LoggerFactory.getLogger(GoogleAuthService.class);
    private static final String PROVIDER_GOOGLE = "google";

    public static final List<String> SCOPES = Arrays.asList(
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.compose",
            "https://www.googleapis.com/auth/userinfo.email"
    );

    private final OAuthAccountRepository accountRepository;

    @Value("${jarvis.google.redirect-uri:http://127.0.0.1:48765/api/auth/google/callback}")
    private String redirectUri;

    @Value("${jarvis.google.credentials-path:}")
    private String configuredCredentialsPath;

    private GoogleClientSecrets clientSecrets;
    private HttpTransport httpTransport;

    public GoogleAuthService(OAuthAccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @PostConstruct
    public void init() {
        try {
            this.httpTransport = GoogleNetHttpTransport.newTrustedTransport();
            loadClientSecrets();
        } catch (Exception e) {
            log.error("Failed to initialize Google Auth Transport: {}", e.getMessage());
        }
    }

    private void loadClientSecrets() {
        try {
            InputStream in = findCredentialsStream();
            if (in != null) {
                try (InputStreamReader reader = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                    this.clientSecrets = GoogleClientSecrets.load(GsonFactory.getDefaultInstance(), reader);
                    log.info("Google OAuth credentials loaded successfully.");
                }
            } else {
                log.warn("Google credentials.json not found in search paths. Place it in project root or ~/.jarvis/credentials.json");
            }
        } catch (Exception e) {
            log.error("Error reading credentials.json: {}", e.getMessage());
        }
    }

    private InputStream findCredentialsStream() throws Exception {
        // 1. Configured path
        if (configuredCredentialsPath != null && !configuredCredentialsPath.isBlank()) {
            File f = new File(configuredCredentialsPath);
            if (f.exists()) return new FileInputStream(f);
        }

        // 2. Project root d:/Projects/JARVIS/credentials.json or ./credentials.json
        File rootFile = new File("credentials.json");
        if (rootFile.exists()) return new FileInputStream(rootFile);

        File explicitRoot = new File("d:/Projects/JARVIS/credentials.json");
        if (explicitRoot.exists()) return new FileInputStream(explicitRoot);

        // 3. User home ~/.jarvis/credentials.json
        String userHome = System.getProperty("user.home");
        File jarvisDirFile = new File(userHome + "/.jarvis/credentials.json");
        if (jarvisDirFile.exists()) return new FileInputStream(jarvisDirFile);

        // 4. Classpath
        InputStream cp = getClass().getClassLoader().getResourceAsStream("credentials.json");
        if (cp != null) return cp;

        return null;
    }

    public boolean isCredentialsConfigured() {
        if (this.clientSecrets == null) {
            loadClientSecrets();
        }
        return this.clientSecrets != null;
    }

    public String getAuthorizationUrl(String state) {
        if (!isCredentialsConfigured()) {
            throw new IllegalStateException("Google credentials.json not configured on local backend.");
        }

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                clientSecrets,
                SCOPES
        )
        .setAccessType("offline")
        .build();

        return flow.newAuthorizationUrl()
                .setRedirectUri(redirectUri)
                .setState(state)
                .set("prompt", "consent")
                .build();
    }

    public OAuthAccount handleCallback(String code) throws Exception {
        if (!isCredentialsConfigured()) {
            throw new IllegalStateException("Google credentials.json not configured on local backend.");
        }

        String clientId = clientSecrets.getDetails().getClientId();
        String clientSecret = clientSecrets.getDetails().getClientSecret();

        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
                httpTransport,
                GsonFactory.getDefaultInstance(),
                clientId,
                clientSecret,
                code,
                redirectUri
        ).execute();

        String email = "User";
        try {
            GoogleIdToken idToken = tokenResponse.parseIdToken();
            if (idToken != null && idToken.getPayload() != null && idToken.getPayload().getEmail() != null) {
                email = idToken.getPayload().getEmail();
            }
        } catch (Exception e) {
            log.warn("Could not parse email from ID token: {}", e.getMessage());
        }

        Instant expiresAt = Instant.now().plusSeconds(
                tokenResponse.getExpiresInSeconds() != null ? tokenResponse.getExpiresInSeconds() : 3600
        );

        Optional<OAuthAccount> existingOpt = accountRepository.findByProvider(PROVIDER_GOOGLE);
        OAuthAccount account;
        if (existingOpt.isPresent()) {
            account = existingOpt.get();
            account.setEmail(email);
            account.setAccessToken(tokenResponse.getAccessToken());
            if (tokenResponse.getRefreshToken() != null && !tokenResponse.getRefreshToken().isBlank()) {
                account.setRefreshToken(tokenResponse.getRefreshToken());
            }
            account.setExpiresAt(expiresAt);
            account.setUpdatedAt(Instant.now());
        } else {
            account = new OAuthAccount(
                    PROVIDER_GOOGLE,
                    email,
                    tokenResponse.getAccessToken(),
                    tokenResponse.getRefreshToken(),
                    expiresAt
            );
        }

        return accountRepository.save(account);
    }

    public String getValidAccessToken() throws Exception {
        Optional<OAuthAccount> opt = accountRepository.findByProvider(PROVIDER_GOOGLE);
        if (opt.isEmpty()) {
            throw new IllegalStateException("No Google account connected.");
        }

        OAuthAccount account = opt.get();
        // If token expires in less than 2 minutes, refresh it
        if (account.getExpiresAt() != null && account.getExpiresAt().isBefore(Instant.now().plusSeconds(120))) {
            if (account.getRefreshToken() == null || account.getRefreshToken().isBlank()) {
                throw new IllegalStateException("Access token expired and no refresh token available. Reconnection required.");
            }

            String clientId = clientSecrets.getDetails().getClientId();
            String clientSecret = clientSecrets.getDetails().getClientSecret();

            TokenResponse response = new RefreshTokenRequest(
                    httpTransport,
                    GsonFactory.getDefaultInstance(),
                    new GenericUrl("https://oauth2.googleapis.com/token"),
                    account.getRefreshToken()
            )
            .setClientAuthentication(new ClientParametersAuthentication(clientId, clientSecret))
            .execute();

            account.setAccessToken(response.getAccessToken());
            if (response.getExpiresInSeconds() != null) {
                account.setExpiresAt(Instant.now().plusSeconds(response.getExpiresInSeconds()));
            }
            account.setUpdatedAt(Instant.now());
            accountRepository.save(account);
        }

        return account.getAccessToken();
    }

    public HttpRequestInitializer getHttpRequestInitializer() {
        return request -> {
            try {
                String token = getValidAccessToken();
                request.getHeaders().setAuthorization("Bearer " + token);
            } catch (Exception e) {
                throw new java.io.IOException("Failed to obtain valid Google access token: " + e.getMessage(), e);
            }
        };
    }

    public Optional<OAuthAccount> getConnectedAccount() {
        return accountRepository.findByProvider(PROVIDER_GOOGLE);
    }

    public void disconnect() {
        accountRepository.findByProvider(PROVIDER_GOOGLE).ifPresent(accountRepository::delete);
    }

    public HttpTransport getHttpTransport() {
        return httpTransport;
    }
}
