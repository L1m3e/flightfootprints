package io.github.l1m3e.flightfootprints.auth;

import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

/**
 * Who may change data. The list of endpoints is not written down here: it is read from
 * the running application, so an endpoint that is added later is checked as well, and
 * the test fails if it was left open.
 */
class WriteAccessIntegrationTests extends IntegrationTest {

    /** Methods that only read. Everything else changes something. */
    private static final Set<RequestMethod> READING =
            Set.of(RequestMethod.GET, RequestMethod.HEAD, RequestMethod.OPTIONS, RequestMethod.TRACE);

    /** The one thing a visitor may do without an account: ask for one. */
    private static final Set<String> OPEN_TO_VISITORS = Set.of("POST /api/auth/register");

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    private RequestMappingHandlerMapping handlerMapping;

    /** One entry per endpoint that changes something, such as {@code "PUT /api/flights/{id}"}. */
    private List<String> writeEndpoints() {
        Set<String> endpoints = new TreeSet<>();
        for (RequestMappingInfo mapping : handlerMapping.getHandlerMethods().keySet()) {
            Set<RequestMethod> methods = mapping.getMethodsCondition().getMethods();
            // A mapping without a method answers every method, also the ones that write.
            Set<RequestMethod> effective = methods.isEmpty() ? Set.of(RequestMethod.values()) : methods;
            for (RequestMethod method : effective) {
                for (String path : mapping.getPatternValues()) {
                    if (!READING.contains(method) && path.startsWith("/api")) {
                        endpoints.add(method + " " + path);
                    }
                }
            }
        }
        return List.copyOf(endpoints);
    }

    private MvcTestResult call(String endpoint, MockHttpSession session) {
        String[] parts = endpoint.split(" ");
        // "/api/flights/{id}" becomes "/api/flights/1".
        var request = mvc.method(HttpMethod.valueOf(parts[0])).uri(parts[1].replaceAll("\\{[^}]+}", "1"))
                .with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}");
        return (session == null ? request : request.session(session)).exchange();
    }

    @Test
    void theApplicationHasTheWriteEndpointsThisTestExpects() {
        // If this fails, the way endpoints are found above no longer works, and the tests
        // below would pass without checking anything.
        assertThat(writeEndpoints()).contains(
                "POST /api/flights", "PUT /api/flights/{id}", "DELETE /api/flights/{id}", "POST /api/auth/register");
    }

    @Test
    void visitorsAreToldToSignInAtEveryWriteEndpoint() {
        for (String endpoint : writeEndpoints()) {
            if (OPEN_TO_VISITORS.contains(endpoint)) {
                continue;
            }
            assertThat(call(endpoint, null))
                    .as(endpoint + " without signing in")
                    .hasStatus(HttpStatus.UNAUTHORIZED)
                    .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        }
    }

    @Test
    void regularAccountsAreRefusedAtEveryWriteEndpoint() {
        register("Amelia", USER_PASSWORD);
        MockHttpSession user = signIn("Amelia", USER_PASSWORD);

        for (String endpoint : writeEndpoints()) {
            if (OPEN_TO_VISITORS.contains(endpoint)) {
                continue;
            }
            assertThat(call(endpoint, user))
                    .as(endpoint + " as a regular account")
                    .hasStatus(HttpStatus.FORBIDDEN)
                    .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
        }
    }

    @Test
    void theAdministratorIsLetThroughAtEveryWriteEndpoint() {
        MockHttpSession admin = signInAsAdmin();

        for (String endpoint : writeEndpoints()) {
            // The empty request is wrong in other ways (400, 404, 409), but it got past the door.
            assertThat(call(endpoint, admin).getResponse().getStatus())
                    .as(endpoint + " as the administrator")
                    .isNotIn(HttpStatus.UNAUTHORIZED.value(), HttpStatus.FORBIDDEN.value());
        }
    }

    /** Also where no endpoint exists yet: the rule covers all of /api, so nothing new starts out open. */
    @Test
    void anAddressWithoutAnEndpointIsClosedToRegularAccountsToo() {
        register("Amelia", USER_PASSWORD);
        MockHttpSession user = signIn("Amelia", USER_PASSWORD);

        for (HttpMethod method : List.of(HttpMethod.POST, HttpMethod.PUT, HttpMethod.PATCH, HttpMethod.DELETE)) {
            assertThat(mvc.method(method).uri("/api/anything").with(csrfToken()))
                    .as(method + " without signing in")
                    .hasStatus(HttpStatus.UNAUTHORIZED);
            assertThat(mvc.method(method).uri("/api/anything").session(user).with(csrfToken()))
                    .as(method + " as a regular account")
                    .hasStatus(HttpStatus.FORBIDDEN);
        }
    }

    @Test
    void aRegularAccountCanStillSignOut() {
        register("Amelia", USER_PASSWORD);
        MockHttpSession user = signIn("Amelia", USER_PASSWORD);

        assertThat(mvc.post().uri("/api/auth/logout").session(user).with(csrfToken()))
                .hasStatus(HttpStatus.NO_CONTENT);
        assertThat(user.isInvalid()).isTrue();
    }

    @Test
    void readingNeedsNoAccount() {
        assertThat(mvc.get().uri("/api/flights")).hasStatusOk();
        assertThat(mvc.head().uri("/api/health")).hasStatusOk();
    }
}
