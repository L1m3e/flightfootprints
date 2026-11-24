package io.github.l1m3e.flightfootprints.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Turns registration requests away while registration is switched off.
 *
 * <p>The check cannot sit inside the controller method: Spring reads and validates the
 * request body before it calls the method, so a request with an empty or broken body
 * would be answered with "400, username must not be empty" and a visitor would be told
 * what a valid registration looks like on a site that accepts none. An interceptor runs
 * before the body is read, so every request gets the same 403, whatever it contains.
 *
 * <p>A Spring Security rule would not do either. For a visitor who is not signed in,
 * Spring Security answers a refusal with 401 "sign in first", which is wrong here:
 * signing in does not open registration.
 */
@Component
class RegistrationGate implements HandlerInterceptor, WebMvcConfigurer {

    static final String REGISTRATION_PATH = "/api/auth/register";

    private final AuthProperties properties;

    RegistrationGate(AuthProperties properties) {
        this.properties = properties;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(this).addPathPatterns(REGISTRATION_PATH);
    }

    /** The exception is rendered by ApiExceptionHandler like every other error of the API. */
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!properties.registrationEnabled()) {
            throw registrationClosed();
        }
        return true;
    }

    static ResponseStatusException registrationClosed() {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, "Registration is closed");
    }
}
