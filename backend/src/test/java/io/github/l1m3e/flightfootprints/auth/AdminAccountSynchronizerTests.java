package io.github.l1m3e.flightfootprints.auth;

import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalStateException;

import java.util.List;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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

    @Test
    void additionalAdministratorsGetTheRoleAndCanSignIn() {
        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "amy:first-long-password", "ben:second-long-password");

        assertThat(users.findByUsername("amy").orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(users.findByUsername("ben").orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(users.findByUsername(ADMIN_USERNAME).orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(postLoginForm("amy", "first-long-password")).hasStatus(HttpStatus.NO_CONTENT);
        assertThat(postLoginForm("ben", "second-long-password")).hasStatus(HttpStatus.NO_CONTENT);
        // Each account has its own password.
        assertThat(postLoginForm("amy", "second-long-password")).hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void anAdditionalAdministratorMayDoWhatTheFirstOneMay() {
        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "amy:first-long-password");

        assertThat(mvc.post().uri("/api/flights")
                .session(signIn("amy", "first-long-password"))
                .with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"flightDate": "2024-05-01", "airline": "Test Air", "fromIata": "PVG", "toIata": "NRT"}
                        """))
                .hasStatus(HttpStatus.CREATED);
    }

    @Test
    void anAdministratorRemovedFromTheConfigurationKeepsTheAccountButLosesTheRole() {
        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "amy:first-long-password");

        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD);

        assertThat(users.findByUsername("amy").orElseThrow().role()).isEqualTo(Role.USER);
        assertThat(postLoginForm("amy", "first-long-password")).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void additionalAdministratorsAloneAreEnough() {
        synchronizeWith("", "", "amy:first-long-password");

        assertThat(users.findByUsername("amy").orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(users.findByUsername(ADMIN_USERNAME).orElseThrow().role()).isEqualTo(Role.USER);
    }

    @Test
    void aPasswordMayContainColonsAndEmptyEntriesAreSkipped() {
        synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "", "amy:pass:with:colons", " ");

        assertThat(postLoginForm("amy", "pass:with:colons")).hasStatus(HttpStatus.NO_CONTENT);
    }

    @Test
    void aBadlyWrittenAdditionalAdministratorStopsTheStartup() {
        assertThatIllegalStateException()
                .isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "no-colon-in-this-entry"))
                .withMessageContaining("username:password");
        assertThatIllegalStateException()
                .isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "amy:too-short"))
                .withMessageContaining("at least 12 characters")
                .withMessageContaining("amy");
        assertThatIllegalStateException()
                .isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "a b:first-long-password"))
                .withMessageContaining("ADDITIONAL_ADMINS");
        // The same account twice, also when only the case differs.
        assertThatIllegalStateException()
                .isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "Captain:first-long-password"))
                .withMessageContaining("more than once");
    }

    @Test
    void aMistakeInTheConfigurationIsReportedWithoutThePassword() {
        assertThatIllegalStateException()
                .isThrownBy(() -> synchronizeWith(ADMIN_USERNAME, ADMIN_PASSWORD, "amy:first-long-password",
                        "Amy:another-long-secret"))
                .withMessageNotContaining("first-long-password")
                .withMessageNotContaining("another-long-secret");
        assertThat(new AuthProperties("captain", "primary-secret", List.of("amy:first-long-password"), true).toString())
                .doesNotContain("primary-secret", "first-long-password");
    }

    @Test
    void aFailedSynchronizationChangesNothing() {
        // The mistake is found before anyone is demoted or created.
        assertThatIllegalStateException()
                .isThrownBy(() -> synchronizeWith("newcaptain", "another-long-password", "amy:too-short"));

        assertThat(users.findByUsername(ADMIN_USERNAME).orElseThrow().role()).isEqualTo(Role.ADMIN);
        assertThat(users.findByUsername("newcaptain")).isEmpty();
    }

    private void synchronizeWith(String username, String password, String... additionalAdmins) {
        new AdminAccountSynchronizer(users, passwordEncoder,
                new AuthProperties(username, password, List.of(additionalAdmins), true))
                .synchronize();
    }
}
