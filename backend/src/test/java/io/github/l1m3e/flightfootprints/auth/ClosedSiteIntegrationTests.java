package io.github.l1m3e.flightfootprints.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;

import io.github.l1m3e.flightfootprints.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
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

    /**
     * The answer does not depend on what was sent. Before, a body that failed validation
     * got "400, the username must not be empty", which told a visitor how to fill in a
     * form that is not open.
     */
    @ParameterizedTest(name = "{0}")
    @CsvSource(delimiter = '|', textBlock = """
            an empty object       | application/json | {}
            invalid values        | application/json | {"username": "a!", "password": "short"}
            a missing password    | application/json | {"username": "Amelia"}
            unknown fields        | application/json | {"role": "ADMIN"}
            JSON that is cut off  | application/json | {"username":
            something else        | text/plain       | let me in
            """)
    void registrationIsRefusedWhateverTheRequestContains(String description, String contentType, String body) {
        assertThat(mvc.post().uri("/api/auth/register")
                .with(csrfToken())
                .contentType(contentType)
                .content(body))
                .hasStatus(HttpStatus.FORBIDDEN)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson().isLenientlyEqualTo("""
                        {"status": 403, "detail": "Registration is closed"}
                        """)
                // Nothing about fields: the request was not looked at.
                .doesNotHavePath("$.errors");
    }

    @Test
    void registrationIsRefusedWithoutAnyBody() {
        assertThat(mvc.post().uri("/api/auth/register").with(csrfToken()))
                .hasStatus(HttpStatus.FORBIDDEN)
                .bodyJson().extractingPath("$.detail").isEqualTo("Registration is closed");
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
