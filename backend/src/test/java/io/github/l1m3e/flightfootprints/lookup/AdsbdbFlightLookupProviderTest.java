package io.github.l1m3e.flightfootprints.lookup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AdsbdbFlightLookupProviderTest {

    private MockRestServiceServer server;
    private AdsbdbFlightLookupProvider provider;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://adsbdb.test");
        server = MockRestServiceServer.bindTo(builder).build();
        provider = new AdsbdbFlightLookupProvider(builder.build());
    }

    @Test
    void returnsTheRouteAndTheAirline() {
        server.expect(requestTo("https://adsbdb.test/v0/callsign/MU587"))
                .andRespond(withSuccess("""
                        {
                          "response": {
                            "flightroute": {
                              "airline": {"iata": "MU", "icao": "CES", "name": "China Eastern Airlines"},
                              "origin": {"iata_code": "PVG", "icao_code": "ZSPD"},
                              "destination": {"iata_code": "JFK", "icao_code": "KJFK"}
                            }
                          }
                        }
                        """, MediaType.APPLICATION_JSON));

        List<FlightLookupResult> results = provider.lookup("MU587", LocalDate.of(2026, 11, 20));

        assertThat(results).containsExactly(
                new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", null, null));
        server.verify();
    }

    @Test
    void anUnknownCallsignIsSimplyEmpty() {
        server.expect(requestTo("https://adsbdb.test/v0/callsign/ZZ999"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND).contentType(MediaType.APPLICATION_JSON).body("{}"));

        assertThat(provider.lookup("ZZ999", null)).isEmpty();
    }

    @Test
    void aRouteWithoutBothAirportsIsIgnored() {
        server.expect(requestTo("https://adsbdb.test/v0/callsign/MU587"))
                .andRespond(withSuccess("""
                        {"response": {"flightroute": {"origin": {"iata_code": "PVG"}, "destination": {}}}}
                        """, MediaType.APPLICATION_JSON));

        assertThat(provider.lookup("MU587", null)).isEmpty();
    }

    @Test
    void aServerErrorBecomesAnUnavailableException() {
        server.expect(requestTo("https://adsbdb.test/v0/callsign/MU587"))
                .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        assertThatThrownBy(() -> provider.lookup("MU587", null))
                .isInstanceOfSatisfying(FlightLookupUnavailableException.class,
                        exception -> assertThat(exception.getBody().getDetail()).contains("500"));
    }
}
