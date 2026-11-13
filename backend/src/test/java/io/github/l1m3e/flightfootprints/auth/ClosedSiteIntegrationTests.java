package io.github.l1m3e.flightfootprints.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;

import io.github.l1m3e.flightfootprints.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * The application as it runs with no administrator configured and registration switched
 * off. This needs its own configuration, so it does not share the context (or the
 * database) of the other integration tests.
 */
@SpringBootTest(properties = {
        "app.auth.admin-username=",
        "app.auth.admin-password=",
        "app.auth.registration-enabled=false"
})
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ClosedSiteIntegrationTests {

    @Autowired
    private MockMvcTester mvc;

    @Autowired
    private JdbcClient jdbc;

    @Test
    void registrationIsRefused() {
        assertThat(mvc.post().uri("/api/auth/register")
                .with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username": "Amelia", "password": "correct-horse-battery"}
                        """))
                .hasStatus(HttpStatus.FORBIDDEN)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson().extractingPath("$.detail").isEqualTo("Registration is closed");

        assertThat(jdbc.sql("SELECT count(*) FROM users").query(Long.class).single()).isZero();
    }

    @Test
    void thePageIsToldThatRegistrationIsClosed() {
        assertThat(mvc.get().uri("/api/auth/me"))
                .hasStatusOk()
                .bodyJson().extractingPath("$.registrationEnabled").isEqualTo(false);
    }

    @Test
    void theSiteStaysReadableWithoutAnAdministrator() {
        assertThat(mvc.get().uri("/api/health")).hasStatusOk();
    }
}
