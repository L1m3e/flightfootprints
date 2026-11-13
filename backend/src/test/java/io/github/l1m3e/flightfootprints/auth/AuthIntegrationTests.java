package io.github.l1m3e.flightfootprints.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;

import java.util.Arrays;
import java.util.List;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

class AuthIntegrationTests extends IntegrationTest {

    @Test
    void visitorIsNotSignedInAndGetsACsrfCookieButNoSession() {
        MvcTestResult result = mvc.get().uri("/api/auth/me").exchange();

        assertThat(result).hasStatusOk().bodyJson().isStrictlyEqualTo("""
                {"authenticated": false, "username": null, "role": null, "registrationEnabled": true}
                """);
        assertThat(result.getResponse().getCookie("XSRF-TOKEN")).isNotNull();
        assertThat(result.getRequest().getSession(false)).isNull();
    }

    @Test
    void registrationCreatesARegularAccountAndStoresOnlyAHash() {
        assertThat(register("Amelia", USER_PASSWORD))
                .hasStatus(HttpStatus.CREATED)
                .bodyJson().isStrictlyEqualTo("""
                        {"username": "Amelia", "role": "USER"}
                        """);

        String storedHash = jdbc.sql("SELECT password_hash FROM users WHERE username = 'Amelia'")
                .query(String.class).single();
        assertThat(storedHash).startsWith("{bcrypt}").doesNotContain(USER_PASSWORD);
    }

    @Test
    void registrationReportsEveryInvalidField() {
        assertThat(register("a!", "short"))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.errors[*].field").asArray()
                .containsExactlyInAnyOrder("username", "password");
    }

    @Test
    void usernamesAreUniqueWhateverTheirCase() {
        assertThat(register("Amelia", USER_PASSWORD)).hasStatus(HttpStatus.CREATED);

        assertThat(register("amelia", USER_PASSWORD))
                .hasStatus(HttpStatus.CONFLICT)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void theAdministratorNameCannotBeRegistered() {
        assertThat(register(ADMIN_USERNAME.toUpperCase(), USER_PASSWORD)).hasStatus(HttpStatus.CONFLICT);

        assertThat(jdbc.sql("SELECT count(*) FROM users").query(Long.class).single()).isEqualTo(1);
    }

    @Test
    void requestsThatChangeSomethingNeedACsrfToken() {
        assertThat(mvc.post().uri("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"username": "Amelia", "password": "%s"}
                        """.formatted(USER_PASSWORD)))
                .hasStatus(HttpStatus.FORBIDDEN)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    /** The real browser flow: read the token from the cookie, send it back in the header. */
    @Test
    void theTokenFromTheCookieIsAcceptedInTheHeader() {
        Cookie csrfCookie = mvc.get().uri("/api/auth/me").exchange().getResponse().getCookie("XSRF-TOKEN");
        assertThat(csrfCookie).isNotNull();
        String body = """
                {"username": "Amelia", "password": "%s"}
                """.formatted(USER_PASSWORD);

        assertThat(mvc.post().uri("/api/auth/register")
                .cookie(csrfCookie).header("X-XSRF-TOKEN", "not-the-token")
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .hasStatus(HttpStatus.FORBIDDEN);

        assertThat(mvc.post().uri("/api/auth/register")
                .cookie(csrfCookie).header("X-XSRF-TOKEN", csrfCookie.getValue())
                .contentType(MediaType.APPLICATION_JSON).content(body))
                .hasStatus(HttpStatus.CREATED);
    }

    @Test
    void signingInStartsASessionAndSigningOutEndsIt() {
        register("Amelia", USER_PASSWORD);

        // The username is matched without regard to case.
        MockHttpSession session = signIn("amelia", USER_PASSWORD);

        assertThat(mvc.get().uri("/api/auth/me").session(session))
                .hasStatusOk().bodyJson().isStrictlyEqualTo("""
                        {"authenticated": true, "username": "Amelia", "role": "USER", "registrationEnabled": true}
                        """);

        assertThat(mvc.post().uri("/api/auth/logout").session(session).with(csrfToken()))
                .hasStatus(HttpStatus.NO_CONTENT);

        assertThat(session.isInvalid()).isTrue();
    }

    @Test
    void signingInIssuesAFreshCsrfToken() {
        register("Amelia", USER_PASSWORD);
        Cookie before = mvc.get().uri("/api/auth/me").exchange().getResponse().getCookie("XSRF-TOKEN");
        assertThat(before).isNotNull();

        MvcTestResult login = mvc.post().uri("/api/auth/login")
                .cookie(before).header("X-XSRF-TOKEN", before.getValue())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("username", "Amelia").param("password", USER_PASSWORD)
                .exchange();

        assertThat(login).hasStatus(HttpStatus.NO_CONTENT);
        // The response first deletes the old cookie and then sets the new one. A browser
        // applies them in order, so the last one is what the page reads for its next request.
        List<String> tokens = Arrays.stream(login.getResponse().getCookies())
                .filter(cookie -> cookie.getName().equals("XSRF-TOKEN"))
                .map(Cookie::getValue)
                .toList();
        assertThat(tokens).isNotEmpty();
        assertThat(tokens.getLast()).isNotEmpty().isNotEqualTo(before.getValue());
    }

    @Test
    void aWrongPasswordAndAnUnknownUserGetTheSameAnswer() {
        register("Amelia", USER_PASSWORD);

        MvcTestResult wrongPassword = postLoginForm("Amelia", "not-the-password");
        MvcTestResult unknownUser = postLoginForm("nobody", "not-the-password");

        assertThat(wrongPassword)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson().extractingPath("$.detail").isEqualTo("Invalid username or password.");
        assertThat(unknownUser)
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .bodyJson().extractingPath("$.detail").isEqualTo("Invalid username or password.");
    }

    @Test
    void theConfiguredAdministratorCanSignIn() {
        MockHttpSession session = signInAsAdmin();

        assertThat(mvc.get().uri("/api/auth/me").session(session))
                .hasStatusOk()
                .bodyJson().extractingPath("$.role").isEqualTo("ADMIN");
    }

    @Test
    void changingAnythingUnderApiNeedsASignedInUser() {
        assertThat(mvc.delete().uri("/api/anything").with(csrfToken()))
                .hasStatus(HttpStatus.UNAUTHORIZED)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson().extractingPath("$.detail").isEqualTo("You need to sign in to do this.");
    }
}
