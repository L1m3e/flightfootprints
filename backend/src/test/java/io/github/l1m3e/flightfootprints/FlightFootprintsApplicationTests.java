package io.github.l1m3e.flightfootprints;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import io.github.l1m3e.flightfootprints.airport.Airport;
import io.github.l1m3e.flightfootprints.airport.AirportImporter;
import io.github.l1m3e.flightfootprints.airport.AirportRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

/**
 * Starts the whole application against a real PostgreSQL container, so these tests
 * cover what unit tests cannot: Flyway migrations, the startup import and the HTTP layer.
 */
class FlightFootprintsApplicationTests extends IntegrationTest {

    @Autowired
    private AirportRepository airports;

    @Autowired
    private AirportImporter importer;

    @Test
    void startupCreatesTheSchemaAndImportsAirports() {
        assertThat(airports.count()).isGreaterThan(4000);

        assertThat(airports.findById("PVG")).hasValueSatisfying(pvg -> {
            assertThat(pvg.name()).isEqualTo("Shanghai Pudong International Airport");
            assertThat(pvg.country()).isEqualTo("CN");
            assertThat(pvg.lat()).isCloseTo(31.14, within(0.01));
            assertThat(pvg.lon()).isCloseTo(121.81, within(0.01));
        });
        assertThat(airports.findById("JFK")).map(Airport::country).contains("US");
        assertThat(airports.findById("ZZZ")).isEmpty();
    }

    @Test
    void importIsSkippedWhenAirportsAlreadyExist() {
        long before = airports.count();

        assertThat(importer.importIfEmpty()).isZero();

        assertThat(airports.count()).isEqualTo(before);
    }

    @Test
    void healthReportsTheAirportCount() {
        assertThat(mvc.get().uri("/api/health"))
                .hasStatusOk()
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON)
                .bodyJson()
                .isStrictlyEqualTo("""
                        {"status": "UP", "airports": %d}
                        """.formatted(airports.count()));
    }

    @Test
    void unknownApiPathsAnswerWithProblemDetail() {
        assertThat(mvc.get().uri("/api/does-not-exist"))
                .hasStatus(HttpStatus.NOT_FOUND)
                .hasContentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON)
                .bodyJson()
                .extractingPath("$.status")
                .isEqualTo(404);
    }
}
