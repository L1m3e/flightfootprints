package io.github.l1m3e.flightfootprints.web;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * How the built frontend is served. The files under src/test/resources/static stand in
 * for a real build, so these tests do not need Node.
 */
class FrontendIntegrationTests extends IntegrationTest {

    @Test
    void theSiteRootLeadsToThePage() {
        // Spring Boot's welcome page forwards "/" to index.html; MockMvc reports the forward.
        assertThat(mvc.get().uri("/")).hasStatusOk().hasForwardedUrl("index.html");
        assertThat(mvc.get().uri("/index.html")).hasStatusOk().bodyText().contains("frontend test page");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/map", "/stats", "/login", "/register", "/flights/new", "/flights/12/edit", "/no/such/page"})
    void anAddressThatOnlyTheFrontendKnowsIsAnsweredWithThePage(String path) {
        assertThat(mvc.get().uri(path))
                .hasStatusOk()
                .hasContentTypeCompatibleWith(MediaType.TEXT_HTML)
                .bodyText().contains("frontend test page");
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/no-such-endpoint", "/api", "/api/flights/1/nothing-here"})
    void anUnknownApiAddressStaysAnErrorInJson(String path) {
        assertThat(mvc.get().uri(path))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @ParameterizedTest
    @ValueSource(strings = {"/assets/chunk-from-an-old-build.js", "/assets/nothing", "/robots.txt", "/no/such/file.png"})
    void aMissingFileIsNotAnsweredWithThePage(String path) {
        // A script tag that received HTML would fail with a confusing syntax error.
        assertThat(mvc.get().uri(path)).hasStatus(HttpStatus.NOT_FOUND);
    }

    @Test
    void filesOfTheBuildAreServedWithTheirOwnType() {
        MvcTestResult script = mvc.get().uri("/assets/app-test.js").exchange();
        assertThat(script).hasStatusOk();
        assertThat(script.getResponse().getContentType()).matches("(text|application)/javascript.*");
    }

    @Test
    void theMapWorkerModuleIsServedAsJavaScript() {
        // Browsers refuse to start a module worker that does not arrive as JavaScript,
        // and the map would stay empty.
        MvcTestResult worker = mvc.get().uri("/assets/worker-test.mjs").exchange();
        assertThat(worker).hasStatusOk();
        assertThat(worker.getResponse().getContentType()).matches("(text|application)/javascript.*");
    }

    @Test
    void filesNamedAfterTheirContentMayBeKeptForAYear() {
        assertThat(mvc.get().uri("/assets/app-test.js"))
                .hasStatusOk()
                .headers().hasValue("Cache-Control", "max-age=31536000, public, immutable");
    }

    @Test
    void thePageItselfIsCheckedForANewVersionEveryTime() {
        assertThat(mvc.get().uri("/map")).hasStatusOk().headers().hasValue("Cache-Control", "no-cache");
    }

    @Test
    void theApiIsNotCachedLikeAFile() {
        MvcTestResult health = mvc.get().uri("/api/health").exchange();
        assertThat(health).hasStatusOk();
        assertThat(String.valueOf(health.getResponse().getHeader("Cache-Control"))).doesNotContain("immutable", "public");
    }
}
