package io.github.l1m3e.flightfootprints.stats;

import static io.github.l1m3e.flightfootprints.TestRequests.csrfToken;
import static org.assertj.core.api.Assertions.assertThat;

import java.io.UnsupportedEncodingException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

class StatsIntegrationTests extends IntegrationTest {

    /**
     * Four flights over three years with a gap in 2020:
     * Shanghai to Tokyo and back in 2019, Tokyo to Los Angeles and Shanghai to New York in 2021.
     * The return flight spells the airline in lower case on purpose.
     */
    private record Distances(int shanghaiTokyo, int tokyoLosAngeles, int shanghaiNewYork) {

        int total() {
            return 2 * shanghaiTokyo + tokyoLosAngeles + shanghaiNewYork;
        }
    }

    private Distances addFourFlights() {
        MockHttpSession admin = signInAsAdmin();
        int shanghaiTokyo = addFlight(admin, "2019-03-01", "China Eastern", "PVG", "NRT");
        addFlight(admin, "2019-03-08", "china eastern", "NRT", "PVG");
        int tokyoLosAngeles = addFlight(admin, "2021-07-01", "All Nippon Airways", "NRT", "LAX");
        int shanghaiNewYork = addFlight(admin, "2021-12-24", "China Eastern", "PVG", "JFK");
        return new Distances(shanghaiTokyo, tokyoLosAngeles, shanghaiNewYork);
    }

    @Test
    void withoutFlightsEverythingIsZeroOrEmpty() {
        assertThat(mvc.get().uri("/api/stats"))
                .hasStatusOk()
                .bodyJson().isStrictlyEqualTo("""
                        {"flights": 0, "totalDistanceKm": 0, "airports": 0, "countries": 0,
                         "airlines": [], "topAirports": [],
                         "longestFlight": null, "shortestFlight": null, "flightsPerYear": []}
                        """);
    }

    @Test
    void countsFlightsDistanceAirportsAndCountries() {
        Distances distances = addFourFlights();

        // Read without signing in: the statistics are public.
        assertThat(mvc.get().uri("/api/stats"))
                .hasStatusOk()
                // Airports: PVG, NRT, LAX, JFK. Countries: China, Japan, United States.
                .bodyJson().isLenientlyEqualTo("""
                        {"flights": 4, "totalDistanceKm": %d, "airports": 4, "countries": 3}
                        """.formatted(distances.total()));
    }

    @Test
    void ranksAirlinesByFlightsAndTreatsSpellingsThatDifferOnlyInCaseAsOne() {
        Distances distances = addFourFlights();

        assertThat(mvc.get().uri("/api/stats"))
                .hasStatusOk()
                // Three flights were entered as "China Eastern" twice and "china eastern" once.
                // They count as one airline, shown with the spelling that was used most.
                .bodyJson().isLenientlyEqualTo("""
                        {"airlines": [
                           {"airline": "China Eastern", "flights": 3, "distanceKm": %d},
                           {"airline": "All Nippon Airways", "flights": 1, "distanceKm": %d}
                        ]}
                        """.formatted(2 * distances.shanghaiTokyo() + distances.shanghaiNewYork(),
                        distances.tokyoLosAngeles()))
                .extractingPath("$.airlines[*].airline").asArray()
                .containsExactly("China Eastern", "All Nippon Airways");
    }

    @Test
    void ranksAirportsByTakeOffsAndLandings() {
        addFourFlights();

        MvcTestResult result = mvc.get().uri("/api/stats").exchange();

        // Tokyo and Shanghai are each touched by three flights; equal counts are ordered by code.
        assertThat(result).bodyJson().extractingPath("$.topAirports[*].airport.iata").asArray()
                .containsExactly("NRT", "PVG", "JFK", "LAX");
        assertThat(result).bodyJson().extractingPath("$.topAirports[*].flights").asArray()
                .containsExactly(3, 3, 1, 1);
        assertThat(result).bodyJson().extractingPath("$.topAirports[0].airport.country").isEqualTo("JP");
    }

    @Test
    void findsTheLongestAndTheShortestFlight() {
        Distances distances = addFourFlights();

        assertThat(mvc.get().uri("/api/stats"))
                .hasStatusOk()
                // The two Shanghai-Tokyo flights are equally short; the more recent one is reported.
                .bodyJson().isLenientlyEqualTo("""
                        {"longestFlight": {"flightDate": "2021-12-24", "from": {"iata": "PVG"}, "to": {"iata": "JFK"},
                                           "distanceKm": %d},
                         "shortestFlight": {"flightDate": "2019-03-08", "from": {"iata": "NRT"}, "to": {"iata": "PVG"},
                                            "distanceKm": %d}}
                        """.formatted(distances.shanghaiNewYork(), distances.shanghaiTokyo()));
    }

    @Test
    void listsEveryYearFromTheFirstFlightToTheLastIncludingYearsWithoutFlights() {
        Distances distances = addFourFlights();

        assertThat(mvc.get().uri("/api/stats"))
                .hasStatusOk()
                .bodyJson().isLenientlyEqualTo("""
                        {"flightsPerYear": [
                           {"year": 2019, "flights": 2, "distanceKm": %d},
                           {"year": 2020, "flights": 0, "distanceKm": 0},
                           {"year": 2021, "flights": 2, "distanceKm": %d}
                        ]}
                        """.formatted(2 * distances.shanghaiTokyo(),
                        distances.tokyoLosAngeles() + distances.shanghaiNewYork()))
                .extractingPath("$.flightsPerYear[*].year").asArray()
                .containsExactly(2019, 2020, 2021);
    }

    @Test
    void aSingleFlightIsBothTheLongestAndTheShortest() {
        int distance = addFlight(signInAsAdmin(), "2022-05-05", "China Eastern", "PVG", "NRT");

        assertThat(mvc.get().uri("/api/stats"))
                .hasStatusOk()
                .bodyJson().isLenientlyEqualTo("""
                        {"flights": 1, "totalDistanceKm": %1$d, "airports": 2, "countries": 2,
                         "longestFlight": {"distanceKm": %1$d}, "shortestFlight": {"distanceKm": %1$d},
                         "flightsPerYear": [{"year": 2022, "flights": 1, "distanceKm": %1$d}]}
                        """.formatted(distance));
    }

    private static final Pattern DISTANCE = Pattern.compile("\"distanceKm\":(\\d+)");

    /** Adds a flight through the API, the way the form does, and returns the distance the backend computed. */
    private int addFlight(MockHttpSession admin, String date, String airline, String from, String to) {
        MvcTestResult created = mvc.post().uri("/api/flights").session(admin).with(csrfToken())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"flightDate": "%s", "airline": "%s", "fromIata": "%s", "toIata": "%s"}
                        """.formatted(date, airline, from, to))
                .exchange();
        assertThat(created).hasStatus(HttpStatus.CREATED);
        try {
            Matcher matcher = DISTANCE.matcher(created.getResponse().getContentAsString());
            assertThat(matcher.find()).isTrue();
            return Integer.parseInt(matcher.group(1));
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException(e);
        }
    }
}
