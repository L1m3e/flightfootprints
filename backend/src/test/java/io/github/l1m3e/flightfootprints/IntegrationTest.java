package io.github.l1m3e.flightfootprints;

import static org.assertj.core.api.Assertions.assertThat;
import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * Base class for tests that need the whole application and a real PostgreSQL.
 *
 * <p>Every subclass uses exactly the configuration declared here. Spring caches the
 * application context per configuration, so all of them share one context and one
 * database container instead of starting their own.
 */
@SpringBootTest(properties = {
        "app.auth.admin-username=" + IntegrationTest.ADMIN_USERNAME,
        "app.auth.admin-password=" + IntegrationTest.ADMIN_PASSWORD,
        "app.auth.registration-enabled=true"
})
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
public abstract class IntegrationTest {

    /** Test-only administrator. These values exist nowhere outside the test database. */
    public static final String ADMIN_USERNAME = "captain";
    public static final String ADMIN_PASSWORD = "integration-test-only";

    /** Password for the regular accounts that tests register. */
    public static final String USER_PASSWORD = "correct-horse-battery";

    @Autowired
    protected MockMvcTester mvc;

    @Autowired
    protected JdbcClient jdbc;

    /**
     * The database is shared, so each test starts from the same state: no flights, no
     * contributors and no account other than the administrator.
     */
    @BeforeEach
    void resetData() {
        jdbc.sql("DELETE FROM flights").update();
        jdbc.sql("DELETE FROM contributors").update();
        jdbc.sql("DELETE FROM users WHERE role <> 'ADMIN'").update();
    }

    /** Registers a regular account through the API, exactly as the registration page does. */
    protected MvcTestResult register(String username, String password) {
        return mvc.post().uri("/api/auth/register")
                .with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username": "%s", "password": "%s"}
                        """.formatted(username, password))
                .exchange();
    }

    /** Posts the login form and returns the session that the following requests must carry. */
    protected MockHttpSession signIn(String username, String password) {
        MvcTestResult result = postLoginForm(username, password);
        assertThat(result).hasStatus(HttpStatus.NO_CONTENT);
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    protected MvcTestResult postLoginForm(String username, String password) {
        return mvc.post().uri("/api/auth/login")
                .with(csrfToken())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("username", username)
                .param("password", password)
                .exchange();
    }

    protected MockHttpSession signInAsAdmin() {
        return signIn(ADMIN_USERNAME, ADMIN_PASSWORD);
    }
}
