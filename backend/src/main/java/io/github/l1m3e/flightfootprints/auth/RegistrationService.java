package io.github.l1m3e.flightfootprints.auth;

import java.nio.charset.StandardCharsets;

import io.github.l1m3e.flightfootprints.web.FieldValidationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationService {

    /** bcrypt only reads the first 72 bytes of a password, so anything longer is refused. */
    static final int MAX_PASSWORD_BYTES = 72;

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties properties;

    RegistrationService(UserAccountRepository users, PasswordEncoder passwordEncoder, AuthProperties properties) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    /** Creates a regular account. Registration can never produce an administrator. */
    public UserAccount register(String username, String rawPassword) {
        // RegistrationGate already refuses the HTTP request. This is for any other caller.
        if (!properties.registrationEnabled()) {
            throw RegistrationGate.registrationClosed();
        }
        if (rawPassword.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new FieldValidationException("password", "TooLong", "Password is too long");
        }
        if (users.findByUsername(username).isPresent()) {
            throw usernameTaken();
        }
        try {
            return users.save(UserAccount.create(username, passwordEncoder.encode(rawPassword), Role.USER));
        } catch (RuntimeException e) {
            // Two requests for the same name can both pass the check above. The unique index
            // lets only one insert through; the other one lands here.
            if (isDuplicateKey(e)) {
                throw usernameTaken();
            }
            throw e;
        }
    }

    /** Spring Data may wrap the database error, so look through the whole cause chain. */
    private static boolean isDuplicateKey(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof DuplicateKeyException) {
                return true;
            }
        }
        return false;
    }

    private static ResponseStatusException usernameTaken() {
        return new ResponseStatusException(HttpStatus.CONFLICT, "That username is already taken");
    }
}
