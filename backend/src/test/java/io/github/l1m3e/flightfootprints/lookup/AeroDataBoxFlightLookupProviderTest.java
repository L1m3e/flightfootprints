package io.github.l1m3e.flightfootprints.lookup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AeroDataBoxFlightLookupProviderTest {

    private static final String BASE_URL = "https://aerodatabox.test";
    private static final String FLIGHT_URL = BASE_URL
            + "/flights/number/MU587/2026-11-20?dateLocalRole=Both&withAircraftImage=false&withLocation=false";

    private MockRestServiceServer server;
    private AeroDataBoxFlightLookupProvider provider;

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(Instant.parse("2026-11-20T00:00:00Z"), ZoneOffset.UTC);
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new AeroDataBoxFlightLookupProvider(builder.build(), "secret", "x-rapidapi-key", clock);
    }

    @Test
    void returnsTheRouteAirlineAndAircraftType() {
        server.expect(requestTo(FLIGHT_URL))
                .andExpect(header("x-rapidapi-key", "secret"))
                .andRespond(withSuccess("""
                        [{
                          "departure": {"airport": {"iata": "PVG", "icao": "ZSPD"}},
                          "arrival": {"airport": {"iata": "JFK", "icao": "KJFK"}},
                          "airline": {"iata": "MU", "icao": "CES", "name": "China Eastern Airlines"},
                          "aircraft": {"reg": "B-2021", "model": "Boeing 777-300ER", "icaoCode": "B77W"}
                        }]
                        """, MediaType.APPLICATION_JSON));

        List<FlightLookupResult> results = provider.lookup("MU587", LocalDate.of(2026, 11, 20));

        assertThat(results).containsExactly(
                new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", "B77W",
                        "Boeing 777-300ER"));
        server.verify();
    }

    @Test
    void withoutADateItAsksForToday() {
        server.expect(requestTo(BASE_URL
                + "/flights/number/MU587/2026-11-20?dateLocalRole=Both&withAircraftImage=false&withLocation=false"))
                .andRespond(withStatus(HttpStatus.NO_CONTENT));

        assertThat(provider.lookup("MU587", null)).isEmpty();
    }

    @Test
    void aRegistrationOnlyFlightAsksTheAircraftEndpoint() {
        server.expect(requestTo(FLIGHT_URL))
                .andRespond(withSuccess("""
                        [{
                          "departure": {"airport": {"iata": "PVG"}},
                          "arrival": {"airport": {"iata": "JFK"}},
                          "aircraft": {"reg": "B-2021"}
                        }]
                        """, MediaType.APPLICATION_JSON));
        server.expect(requestTo(BASE_URL + "/aircrafts/reg/B-2021"))
                .andExpect(header("x-rapidapi-key", "secret"))
                .andRespond(withSuccess("""
                        {"reg": "B-2021", "model": "Boeing 777-300ER", "icaoCode": "B77W"}
                        """, MediaType.APPLICATION_JSON));

        List<FlightLookupResult> results = provider.lookup("MU587", LocalDate.of(2026, 11, 20));

        assertThat(results).singleElement()
                .extracting(FlightLookupResult::aircraftIcao, FlightLookupResult::aircraftModel)
                .containsExactly("B77W", "Boeing 777-300ER");
        server.verify();
    }

    @Test
    void aFlightWithoutBothAirportsIsIgnored() {
        server.expect(requestTo(FLIGHT_URL))
                .andRespond(withSuccess("""
                        [{"departure": {"airport": {"iata": "PVG"}}, "arrival": {"airport": {}}}]
                        """, MediaType.APPLICATION_JSON));

        assertThat(provider.lookup("MU587", LocalDate.of(2026, 11, 20))).isEmpty();
    }

    @Test
    void aRejectedKeyBecomesAnUnavailableException() {
        server.expect(requestTo(FLIGHT_URL))
                .andRespond(withStatus(HttpStatus.FORBIDDEN));

        assertThatThrownBy(() -> provider.lookup("MU587", LocalDate.of(2026, 11, 20)))
                .isInstanceOfSatisfying(FlightLookupUnavailableException.class,
                        exception -> assertThat(exception.getBody().getDetail()).contains("API key"));
    }

    @Test
    void aDateBeyondOneYearIsAFieldError() {
        assertThatThrownBy(() -> provider.lookup("MU587", LocalDate.of(2024, 1, 1)))
                .isInstanceOf(FlightLookupDateRangeException.class);
    }
}
