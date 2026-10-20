package com.jarvis.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Validates the per-session startup token on every request.
 *
 * The token is generated at startup, printed to stdout (so Tauri can read it),
 * and must be sent by the frontend on every request via the X-JARVIS-Token header.
 * This prevents other local processes from calling the API.
 *
 * Actuator /actuator/health is exempt so Tauri can poll it before the token is wired up.
 */
@Component
public class StartupTokenFilter extends OncePerRequestFilter {

    public static final String TOKEN_HEADER = "X-JARVIS-Token";

    @Value("${jarvis.startup-token}")
    private String expectedToken;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Allow health check and Google callback without token
        if (path.startsWith("/actuator/health") || path.equals("/api/health") || path.equals("/api/auth/google/callback")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = request.getHeader(TOKEN_HEADER);
        if (expectedToken == null || !expectedToken.equals(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Unauthorized: invalid or missing X-JARVIS-Token\"}");
            return;
        }

        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(
                new org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken(
                        "jarvis-desktop",
                        token,
                        java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_CLIENT"))
                )
        );

        filterChain.doFilter(request, response);
    }
}
