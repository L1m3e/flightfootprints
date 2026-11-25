package io.github.l1m3e.flightfootprints.contributor;

import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;
import static org.assertj.core.api.Assertions.assertThat;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

class ContributorApiIntegrationTests extends IntegrationTest {

    private static final String LIN = """
            {"name": "Lin", "link": "https://github.com/example-lin", "note": "Flight number lookup"}
            """;

    @Test
    void theListIsEmptyUntilSomebodyIsAdded() {
        assertThat(mvc.get().uri("/api/contributors")).hasStatusOk().bodyJson().isStrictlyEqualTo("[]");
    }

    @Test
    void visitorsCanReadTheListButNotChangeIt() {
        long id = create(signInAsAdmin(), LIN);

        // Reading needs no account.
        assertThat(mvc.get().uri("/api/contributors")).hasStatusOk()
                .bodyJson().extractingPath("$[*].name").asArray().containsExactly("Lin");

        assertThat(mvc.post().uri("/api/contributors").with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(LIN))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.put().uri("/api/contributors/" + id).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(LIN))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(mvc.delete().uri("/api/contributors/" + id).with(csrfToken()))
                .hasStatus(HttpStatus.UNAUTHORIZED);
        assertThat(count()).isEqualTo(1);
    }

    @Test
    void signedInRegularUsersCannotChangeTheListEither() {
        long id = create(signInAsAdmin(), LIN);
        register("Amelia", USER_PASSWORD);
        MockHttpSession user = signIn("Amelia", USER_PASSWORD);

        assertThat(mvc.post().uri("/api/contributors").session(user).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"name": "Amelia"}
                        """))
                .hasStatus(HttpStatus.FORBIDDEN)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        assertThat(mvc.delete().uri("/api/contributors/" + id).session(user).with(csrfToken()))
                .hasStatus(HttpStatus.FORBIDDEN);
        assertThat(count()).isEqualTo(1);
    }

    @Test
    void anAdministratorAddsAContributorWithALinkAndANote() {
        MvcTestResult created = mvc.post().uri("/api/contributors").session(signInAsAdmin()).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(LIN)
                .exchange();

        assertThat(created).hasStatus(HttpStatus.CREATED);
        long id = idFromLocation(created);
        assertThat(created).bodyJson().isStrictlyEqualTo("""
                {"id": %d, "name": "Lin", "link": "https://github.com/example-lin", "note": "Flight number lookup"}
                """.formatted(id));
    }

    @Test
    void onlyTheNameIsRequiredAndInputIsTidied() {
        long id = create(signInAsAdmin(), """
                {"name": "  林同学  ", "link": "   ", "note": ""}
                """);

        assertThat(mvc.get().uri("/api/contributors")).hasStatusOk().bodyJson().isStrictlyEqualTo("""
                [{"id": %d, "name": "林同学", "link": null, "note": null}]
                """.formatted(id));
    }

    @Test
    void contributorsAreListedInTheOrderTheyWereAdded() {
        MockHttpSession admin = signInAsAdmin();
        create(admin, """
                {"name": "First"}
                """);
        long second = create(admin, """
                {"name": "Second"}
                """);
        create(admin, """
                {"name": "Third"}
                """);

        // Changing an entry does not move it.
        assertThat(mvc.put().uri("/api/contributors/" + second).session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"name": "Second, renamed", "note": "Maps"}
                        """))
                .hasStatusOk()
                .bodyJson().isStrictlyEqualTo("""
                        {"id": %d, "name": "Second, renamed", "link": null, "note": "Maps"}
                        """.formatted(second));

        assertThat(mvc.get().uri("/api/contributors")).hasStatusOk()
                .bodyJson().extractingPath("$[*].name").asArray()
                .containsExactly("First", "Second, renamed", "Third");
    }

    @Test
    void deletingAContributorRemovesThem() {
        MockHttpSession admin = signInAsAdmin();
        long id = create(admin, LIN);

        assertThat(mvc.delete().uri("/api/contributors/" + id).session(admin).with(csrfToken()))
                .hasStatus(HttpStatus.NO_CONTENT);

        assertThat(count()).isZero();
        assertThat(mvc.delete().uri("/api/contributors/" + id).session(admin).with(csrfToken()))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void aContributorThatDoesNotExistCannotBeChanged() {
        assertThat(mvc.put().uri("/api/contributors/999999").session(signInAsAdmin()).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(LIN))
                .hasStatus(HttpStatus.NOT_FOUND);
        assertThat(count()).isZero();
    }

    @Test
    void theNameIsRequired() {
        assertThat(postAsAdmin("""
                {"name": "   ", "note": "Somebody"}
                """))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson().extractingPath("$.errors[*].field").asArray().containsExactly("name");
        assertThat(count()).isZero();
    }

    /**
     * The page turns the link into something a visitor can click. Only web addresses are
     * taken: a "javascript:" link would run code in the browser of whoever clicks it.
     */
    @ParameterizedTest
    @ValueSource(strings = {
            "javascript:alert(1)",
            "JavaScript:alert(1)",
            "data:text/html,<script>alert(1)</script>",
            "github.com/example-lin",
            "//example.com",
            "ftp://example.com/file",
            "https://example.com/a b",
            "mailto:lin@example.com"
    })
    void aLinkThatIsNotAWebAddressIsRefused(String link) {
        assertThat(postAsAdmin("""
                {"name": "Lin", "link": "%s"}
                """.formatted(link)))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.errors[*].field").asArray().containsExactly("link");
        assertThat(count()).isZero();
    }

    @Test
    void textThatIsTooLongIsRefused() {
        assertThat(postAsAdmin("""
                {"name": "%s", "link": "https://example.com/%s", "note": "%s"}
                """.formatted("n".repeat(61), "l".repeat(200), "x".repeat(201))))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.errors[*].field").asArray()
                .containsExactlyInAnyOrder("name", "link", "note");
        assertThat(count()).isZero();
    }

    /** The database has its own check, for anything that does not come through the API. */
    @Test
    void theDatabaseRefusesALinkThatIsNotAWebAddressToo() {
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO contributors (name, link, created_at) VALUES ('Lin', 'javascript:alert(1)', now())
                """).update())
                .hasMessageContaining("contributors_link_is_web");
    }

    private MvcTestResult postAsAdmin(String json) {
        return mvc.post().uri("/api/contributors").session(signInAsAdmin()).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(json)
                .exchange();
    }

    /** Adds a contributor and returns the id. */
    private long create(MockHttpSession admin, String json) {
        MvcTestResult created = mvc.post().uri("/api/contributors").session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON).content(json)
                .exchange();
        assertThat(created).hasStatus(HttpStatus.CREATED);
        return idFromLocation(created);
    }

    private static long idFromLocation(MvcTestResult created) {
        String location = created.getResponse().getHeader("Location");
        assertThat(location).startsWith("/api/contributors/");
        return Long.parseLong(location.substring("/api/contributors/".length()));
    }

    private long count() {
        return jdbc.sql("SELECT count(*) FROM contributors").query(Long.class).single();
    }
}
