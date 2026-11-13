package io.github.l1m3e.flightfootprints.auth;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Makes the database agree with the configured administrator on every startup.
 *
 * <p>The environment is the single source of truth: the configured account is created
 * or updated, and any other account that still has the ADMIN role loses it. Changing
 * ADMIN_PASSWORD and restarting is therefore all it takes to rotate the password.
 */
@Component
@Transactional
public class AdminAccountSynchronizer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminAccountSynchronizer.class);

    static final int MIN_ADMIN_PASSWORD_LENGTH = 12;

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties properties;

    public AdminAccountSynchronizer(UserAccountRepository users, PasswordEncoder passwordEncoder,
            AuthProperties properties) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        synchronize();
    }

    public void synchronize() {
        String username = properties.adminUsername();
        String password = properties.adminPassword();

        if (username.isEmpty() && password.isEmpty()) {
            users.demoteAllAdmins();
            log.warn("No administrator is configured (ADMIN_USERNAME and ADMIN_PASSWORD are not set):"
                    + " nobody can add or change flights");
            return;
        }
        // A half-configured administrator is a mistake worth stopping for, not guessing around.
        if (username.isEmpty() || password.isEmpty()) {
            throw new IllegalStateException("ADMIN_USERNAME and ADMIN_PASSWORD must be set together");
        }
        if (!username.matches(UserAccount.USERNAME_PATTERN)) {
            throw new IllegalStateException(
                    "ADMIN_USERNAME must be 3 to 32 characters: letters, digits, dot, underscore or hyphen");
        }
        if (password.length() < MIN_ADMIN_PASSWORD_LENGTH) {
            throw new IllegalStateException(
                    "ADMIN_PASSWORD must be at least " + MIN_ADMIN_PASSWORD_LENGTH + " characters long");
        }

        users.demoteAdminsOtherThan(username);

        Optional<UserAccount> existing = users.findByUsername(username);
        if (existing.isEmpty()) {
            users.save(UserAccount.create(username, passwordEncoder.encode(password), Role.ADMIN));
            log.info("Created administrator account '{}'", username);
            return;
        }

        UserAccount account = existing.get();
        boolean passwordCurrent = passwordEncoder.matches(password, account.passwordHash());
        if (account.role() != Role.ADMIN || !passwordCurrent) {
            String hash = passwordCurrent ? account.passwordHash() : passwordEncoder.encode(password);
            users.save(account.withCredentials(hash, Role.ADMIN));
            log.info("Updated administrator account '{}'", username);
        }
    }
}
