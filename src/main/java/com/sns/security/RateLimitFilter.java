package com.sns.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory rate limiter for auth endpoints.
 * Limits: 5 req/min on login, 3 req/min on register, 10 req/min on forgot-password.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // Map<"endpoint:ip", counter>
    private final ConcurrentHashMap<String, RateEntry> requestCounts = new ConcurrentHashMap<>();

    private static final Map<String, Integer> RATE_LIMITS = Map.of(
        "/api/auth/login", 5,
        "/api/auth/register", 3,
        "/api/auth/forgot-password", 10
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        Integer limit = RATE_LIMITS.get(path);
        
        if (limit != null && "POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = getClientIp(request);
            String key = path + ":" + clientIp;
            
            RateEntry entry = requestCounts.compute(key, (k, existing) -> {
                long now = System.currentTimeMillis();
                if (existing == null || now - existing.windowStart > 60_000) {
                    return new RateEntry(now, new AtomicInteger(1));
                }
                existing.count.incrementAndGet();
                return existing;
            });
            
            if (entry.count.get() > limit) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Too many requests. Please try again after 1 minute.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private static class RateEntry {
        long windowStart;
        AtomicInteger count;

        RateEntry(long windowStart, AtomicInteger count) {
            this.windowStart = windowStart;
            this.count = count;
        }
    }
}
