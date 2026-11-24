package io.github.l1m3e.flightfootprints.lookup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import io.github.l1m3e.flightfootprints.IntegrationTest;

/**
 * The endpoint through the whole stack: security, JSON and error shapes. The provider is
 * replaced with a mock so no test ever calls the real ADSBDB or AeroDataBox.
 */
class FlightLookupApiIntegrationTests extends IntegrationTest {

    private static final LocalDate DATE = LocalDate.of(2026, 11, 20);

    @MockitoBean
    private FlightLookupProvider provider;

    @Test
    void visitorsCannotSpendTheLookupQuota() {
        assertThat(mvc.get().uri("/api/flights/lookup").param("flightNo", "MU587"))
                .hasStatus(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void signedInRegularUsersCannotLookFlightsUpEither() {
        register("Amelia", USER_PASSWORD);

        assertThat(mvc.get().uri("/api/flights/lookup").param("flightNo", "MU587")
                .session(signIn("Amelia", USER_PASSWORD)))
                .hasStatus(HttpStatus.FORBIDDEN);
    }

    @Test
    void theAdministratorGetsTheResolvedRouteAndAircraft() {
        when(provider.lookup("MU587", DATE)).thenReturn(List.of(
                new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", "B77W",
                        "Boeing 777-300ER")));

        assertThat(mvc.get().uri("/api/flights/lookup")
                .param("flightNo", "mu 587")
                .param("date", DATE.toString())
                .session(signInAsAdmin()))
                .hasStatusOk()
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON)
                .bodyJson().isLenientlyEqualTo("""
                        [
                          {
                            "flightNo": "MU587",
                            "from": {"iata": "PVG", "city": "Shanghai (Pudong)", "country": "CN"},
                            "to": {"iata": "JFK", "city": "New York", "country": "US"},
                            "aircraftIcao": "B77W",
                            "aircraftModel": "Boeing 777-300ER",
                            "airline": {"iata": "MU", "name": "China Eastern Airlines", "nameZh": "中国东方航空"}
                          }
                        ]
                        """);
        verify(provider).lookup("MU587", DATE);
    }

    @Test
    void anUnknownFlightIsA404Problem() {
        when(provider.lookup("ZZ999", DATE)).thenReturn(List.of());

        assertThat(mvc.get().uri("/api/flights/lookup")
                .param("flightNo", "ZZ999")
                .param("date", DATE.toString())
                .session(signInAsAdmin()))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void aProviderFailureIsA502Problem() {
        when(provider.lookup("MU587", DATE))
                .thenThrow(new FlightLookupUnavailableException("AeroDataBox is down.", null));

        assertThat(mvc.get().uri("/api/flights/lookup")
                .param("flightNo", "MU587")
                .param("date", DATE.toString())
                .session(signInAsAdmin()))
                .hasStatus(HttpStatus.BAD_GATEWAY)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON);
    }

    @Test
    void aMalformedFlightNumberIsAFieldError() {
        assertThat(mvc.get().uri("/api/flights/lookup")
                .param("flightNo", "MU")
                .session(signInAsAdmin()))
                .hasStatus(HttpStatus.BAD_REQUEST)
                .bodyJson().extractingPath("$.errors[0].field").isEqualTo("flightNo");
        verifyNoInteractions(provider);
    }
}
