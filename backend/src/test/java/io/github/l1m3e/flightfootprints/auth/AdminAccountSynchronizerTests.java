package io.github.l1m3e.flightfootprints.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Runs the startup synchronisation again with other settings, as if the application
 * had been restarted with different environment variables.
 */
class AdminAccountSynchronizerTests extends IntegrationTest {

    @Autowired
    private UserAccountRepository users;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /** Puts the shared database back to the administrator that every other test expects. */
    @AfterEach
    void restoreConfiguredAdministrator() {
        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD);
    }

    @Test
    void aNewPasswordInTheConfigurationReplacesTheOldOne() {
        synchronizeWith(ADMIN_USERNAME, "a-brand-new-password");

        assertThat(postLoginForm(ADMIN_USERNAME, ADMIN_PASSWORD)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(postLoginForm(ADMIN_USERNAME, "a-brand-new-password")).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void anUnchangedConfigurationLeavesTheAccountAlone() {
        String hashBefore = users.findByUsername(ADMIN_USERNAME).orElseThrow().passwordHash();

        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD);

        assertThat(users.findByUsername(ADMIN_USERNAME).orElseThrow().passwordHash()).isEqualTo(hashBefore);
    }

    @Test
    void onlyTheConfiguredAccountKeepsTheAdminRole() {
        users.save(UserAccount.create("mallory", passwordEncoder.encode(USER_PASSWORD), Role.ADMIN));

        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD);

        assertThat(users.findByUsername("mallory").orElseThrow().role()).isEqualTo(Role.USER);
        assertThat(users.findByUsername(ADMIN_USERNAME).orElseThrow().role()).isEqualTo(Role.ADMIN);
    }

    @Test
    void renamingTheAdministratorMovesTheRoleToTheNewAccount() {
        synchronizeWith("newcaptain", "another-long-password");

        assertThat(users.findByUsername("newcaptain").orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(users.findByUsername(ADMIN_USERNAME).orElseThrow().role()).isEqualTo(Role.USER);
    }

    @Test
    void anExistingRegularAccountIsPromotedAndGetsTheConfiguredPassword() {
        register("Amelia", USER_PASSWORD);

        synchronizeWith("amelia", "another-long-password");

        assertThat(users.findByUsername("Amelia").orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(postLoginForm("Amelia", USER_PASSWORD)).hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(postLoginForm("Amelia", "another-long-password")).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void withoutConfigurationNobodyIsAdministrator() {
        synchronizeWith("", "");

        assertThat(users.findAll()).noneMatch(account -> account.role() == Role.ADMIN);
    }

    @Test
    void aHalfOrBadlyConfiguredAdministratorStopsTheStartup() {
        assertThatIllegalStateException().isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, ""))
                .withMessageContaining("must be set together");
        assertThatIllegalStateException().isThrownBy(() -> synchronizeWith("", ADMIN_PASSWORD))
                .withMessageContaining("must be set together");
        assertThatIllegalStateException().isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, "too-short"))
                .withMessageContaining("at least 12 characters");
        assertThatIllegalStateException().isThrownBy(() -> synchronizeWith("no spaces allowed", ADMIN_PASSWORD))
                .withMessageContaining("ADMIN_USERNAME");
    }

    private void synchronizeWith(String username, String password) {
        new AdminAccountSynchronizer(users, passwordEncoder, new AuthProperties(username, password, true))
                .synchronize();
    }
}
