package io.github.l1m3e.flightfootprints.auth;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Makes the database agree with the configured administrators on every startup.
 *
 * <p>The environment is the single source of truth: every configured account is created
 * or updated, and any other account that still has the ADMIN role loses it. Changing a
 * password in the configuration and restarting is therefore all it takes to rotate it,
 * and removing an administrator from the configuration takes the role away.
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
        List<Administrator> administrators = configuredAdministrators();

        if (administrators.isEmpty()) {
            users.demoteAllAdmins();
            log.warn("No administrator is configured (ADMIN_USERNAME and ADMIN_PASSWORD are not set):"
                    + " nobody can add or change flights");
            return;
        }

        users.demoteAdminsOtherThan(administrators.stream().map(Administrator::key).toList());
        administrators.forEach(this::createOrUpdate);
    }

    /** One configured administrator. The password is never logged or put into a message. */
    private record Administrator(String username, String password) {

        /** Usernames are the same account whatever their case. */
        String key() {
            return username.toLowerCase(Locale.ROOT);
        }
    }

    /**
     * Reads the administrators from the configuration. A mistake in it is worth stopping
     * the startup for, not guessing around: the messages name the setting and the account,
     * never a password.
     */
    private List<Administrator> configuredAdministrators() {
        List<Administrator> administrators = new ArrayList<>();

        String username = properties.adminUsername();
        String password = properties.adminPassword();
        if (username.isEmpty() != password.isEmpty()) {
            throw new IllegalStateException("ADMIN_USERNAME and ADMIN_PASSWORD must be set together");
        }
        if (!username.isEmpty()) {
            if (!username.matches(UserAccount.USERNAME_PATTERN)) {
                throw new IllegalStateException(
                        "ADMIN_USERNAME must be 3 to 32 characters: letters, digits, dot, underscore or hyphen");
            }
            if (password.length() < MIN_ADMIN_PASSWORD_LENGTH) {
                throw new IllegalStateException(
                        "ADMIN_PASSWORD must be at least " + MIN_ADMIN_PASSWORD_LENGTH + " characters long");
            }
            administrators.add(new Administrator(username, password));
        }

        for (String entry : properties.additionalAdmins()) {
            if (entry.isBlank()) {
                continue;
            }
            // Everything after the first colon is the password, so a password may contain colons.
            int colon = entry.indexOf(':');
            if (colon < 0) {
                throw new IllegalStateException("Every entry of ADDITIONAL_ADMINS must be written as username:password");
            }
            String name = entry.substring(0, colon).strip();
            String secret = entry.substring(colon + 1);
            if (!name.matches(UserAccount.USERNAME_PATTERN)) {
                throw new IllegalStateException("ADDITIONAL_ADMINS: the username '" + name
                        + "' must be 3 to 32 characters: letters, digits, dot, underscore or hyphen");
            }
            if (secret.length() < MIN_ADMIN_PASSWORD_LENGTH) {
                throw new IllegalStateException("ADDITIONAL_ADMINS: the password of '" + name + "' must be at least "
                        + MIN_ADMIN_PASSWORD_LENGTH + " characters long");
            }
            administrators.add(new Administrator(name, secret));
        }

        Set<String> seen = new HashSet<>();
        for (Administrator administrator : administrators) {
            if (!seen.add(administrator.key())) {
                throw new IllegalStateException(
                        "The administrator '" + administrator.username() + "' is configured more than once");
            }
        }
        return administrators;
    }

    private void createOrUpdate(Administrator administrator) {
        Optional<UserAccount> existing = users.findByUsername(administrator.username());
        if (existing.isEmpty()) {
            users.save(UserAccount.create(administrator.username(),
                    passwordEncoder.encode(administrator.password()), Role.ADMIN));
            log.info("Created administrator account '{}'", administrator.username());
            return;
        }

        UserAccount account = existing.get();
        boolean passwordCurrent = passwordEncoder.matches(administrator.password(), account.passwordHash());
        if (account.role() != Role.ADMIN || !passwordCurrent) {
            String hash = passwordCurrent ? account.passwordHash() : passwordEncoder.encode(administrator.password());
            users.save(account.withCredentials(hash, Role.ADMIN));
            log.info("Updated administrator account '{}'", administrator.username());
        }
    }
}
