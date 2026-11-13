package io.github.l1m3e.flightfootprints.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Registration and "who am I". Signing in and out have no methods here: Spring Security
 * handles POST /api/auth/login and POST /api/auth/logout in its filter chain (see SecurityConfig).
 */
@RestController
@RequestMapping("/api/auth")
class AuthController {

    private final RegistrationService registrationService;
    private final AuthProperties properties;

    AuthController(RegistrationService registrationService, AuthProperties properties) {
        this.registrationService = registrationService;
        this.properties = properties;
    }

    /**
     * Always answers 200, also for visitors who are not signed in. A 401 here would put an
     * error in the browser console on every page view of a perfectly normal visitor.
     */
    @GetMapping("/me")
    SessionResponse me(Authentication authentication) {
        boolean signedIn = authentication != null && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
        if (!signedIn) {
            return new SessionResponse(false, null, null, properties.registrationEnabled());
        }
        boolean admin = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + Role.ADMIN));
        return new SessionResponse(true, authentication.getName(), admin ? Role.ADMIN : Role.USER,
                properties.registrationEnabled());
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    UserResponse register(@Valid @RequestBody RegistrationRequest request) {
        UserAccount account = registrationService.register(request.username(), request.password());
        return new UserResponse(account.username(), account.role());
    }

    record RegistrationRequest(
            @NotNull @Pattern(regexp = UserAccount.USERNAME_PATTERN) String username,
            @NotNull @Size(min = 8, max = 72) String password) {

        RegistrationRequest {
            username = username == null ? null : username.strip();
        }

        /** Keeps the password out of anything that prints the request. */
        @Override
        public String toString() {
            return "RegistrationRequest[username=" + username + "]";
        }
    }

    record UserResponse(String username, Role role) {
    }

    record SessionResponse(boolean authenticated, String username, Role role, boolean registrationEnabled) {
    }
}
