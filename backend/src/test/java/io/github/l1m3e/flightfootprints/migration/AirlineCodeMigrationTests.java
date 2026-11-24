package io.github.l1m3e.flightfootprints.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import io.github.l1m3e.flightfootprints.IntegrationTest;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Migration V5 moves the flights that exist already from "airline as typed" to "airline
 * code and both names". The other tests start from an empty flights table and cannot
 * show what it does to existing rows, so this one builds the database as it was before
 * (up to V4, in a schema of its own), adds flights the old way and then runs V5.
 */
class AirlineCodeMigrationTests extends IntegrationTest {

    private static final String SCHEMA = "airline_code_migration";

    @Autowired
    private PostgreSQLContainer postgres;

    /** Flyway with connections of its own, so the schema it switches to never leaks into the shared pool. */
    private Flyway flywayUpTo(String version) {
        return Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .schemas(SCHEMA)
                .locations("classpath:db/migration")
                .target(version)
                .load();
    }

    @BeforeEach
    @AfterEach
    void dropTheSchema() {
        jdbc.sql("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE").update();
    }

    private void addFlightTheOldWay(int day, String flightNo, String airline) {
        jdbc.sql("""
                INSERT INTO %s.flights (flight_date, flight_no, airline, from_iata, to_iata, distance_km,
                                        notes, created_at, updated_at)
                VALUES (make_date(2024, 1, :day), :flightNo, :airline, 'HKG', 'JFK', 12990, :notes, now(), now())
                """.formatted(SCHEMA))
                .param("day", day).param("flightNo", flightNo).param("airline", airline)
                .param("notes", "typed as " + airline)
                .update();
    }

    @Test
    void existingFlightsGetTheCodeAndBothNamesOfTheAirlineThatWasTyped() {
        flywayUpTo("4").migrate();
        jdbc.sql("""
                INSERT INTO %s.airports (iata, name, city, country, lat, lon)
                VALUES ('HKG', 'Hong Kong International Airport', 'Hong Kong', 'HK', 22.308901, 113.914603),
                       ('JFK', 'John F. Kennedy International Airport', 'New York', 'US', 40.639447, -73.779317)
                """.formatted(SCHEMA)).update();

        addFlightTheOldWay(1, "CX844", "国泰航空");
        addFlightTheOldWay(2, "MU587", "中国东方航空");
        addFlightTheOldWay(3, "NH9", "All Nippon Airways");
        addFlightTheOldWay(4, "CA981", "国航");
        addFlightTheOldWay(5, "CX840", "cathay pacific");
        addFlightTheOldWay(6, "CX846", "cathaypacific");
        addFlightTheOldWay(7, null, "CX");
        addFlightTheOldWay(8, "TW251", "Tway Air");
        addFlightTheOldWay(9, "YP101", "Air Premia");
        // Not an airline the table knows, although the flight number is Cathay Pacific's:
        // what somebody typed is never replaced by a guess.
        addFlightTheOldWay(10, "CX100", "Footprint Air");
        addFlightTheOldWay(11, null, "某某航空");

        flywayUpTo("5").migrate();

        List<Map<String, Object>> flights = jdbc.sql("""
                SELECT extract(day FROM flight_date)::int AS day, flight_no, airline_iata, airline_name,
                       airline_name_zh, notes
                FROM %s.flights
                ORDER BY flight_date
                """.formatted(SCHEMA)).query().listOfRows();

        // Nothing was dropped.
        assertThat(flights).hasSize(11);
        assertThat(flights).extracting(flight -> flight.get("day") + " " + flight.get("airline_iata") + " "
                        + flight.get("airline_name") + " " + flight.get("airline_name_zh"))
                .containsExactly(
                        "1 CX Cathay Pacific 国泰航空",
                        "2 MU China Eastern Airlines 中国东方航空",
                        "3 NH All Nippon Airways 全日空",
                        "4 CA Air China 中国国际航空",
                        "5 CX Cathay Pacific 国泰航空",
                        "6 CX Cathay Pacific 国泰航空",
                        "7 CX Cathay Pacific 国泰航空",
                        "8 TW T'way Air 德威航空",
                        "9 YP Air Premia null",
                        "10 null Footprint Air null",
                        "11 null 某某航空 null");
        // The rest of each row is untouched.
        assertThat(flights).extracting(flight -> flight.get("flight_no"))
                .containsExactly("CX844", "MU587", "NH9", "CA981", "CX840", "CX846", null, "TW251", "YP101",
                        "CX100", null);
        assertThat(flights).extracting(flight -> flight.get("notes"))
                .first().isEqualTo("typed as 国泰航空");
    }

    @Test
    void theMigrationRunsOnADatabaseWithoutFlights() {
        flywayUpTo("4").migrate();

        flywayUpTo("5").migrate();

        assertThat(jdbc.sql("SELECT count(*) FROM %s.flights".formatted(SCHEMA)).query(Long.class).single()).isZero();
    }
}
