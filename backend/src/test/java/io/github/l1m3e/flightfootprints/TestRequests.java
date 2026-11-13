package io.github.l1m3e.flightfootprints;

import java.util.UUID;

import jakarta.servlet.http.Cookie;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.util.ObjectUtils;

/** Helpers that make a test request look like one sent by the single-page app. */
public final class TestRequests {

    private TestRequests() {
    }

    /**
     * Adds what the page's JavaScript adds to every POST, PUT and DELETE: the XSRF-TOKEN
     * cookie and the same value in the X-XSRF-TOKEN header.
     *
     * <p>This replaces {@code csrf()} from spring-security-test on purpose. That helper
     * swaps the application's real token repository for a test one, and the swap stays
     * in place for every later test that shares the application context. Tests would then
     * no longer run the cookie-based protection that production uses.
     */
    public static RequestPostProcessor csrfToken() {
        return request -> {
            String token = UUID.randomUUID().toString();
            request.setCookies(ObjectUtils.addObjectToArray(request.getCookies(), new Cookie("XSRF-TOKEN", token)));
            request.addHeader("X-XSRF-TOKEN", token);
            return request;
        };
    }
}
