package io.github.l1m3e.flightfootprints.airline;

import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Read-only access to the airlines. */
@Repository
class AirlineQueries {

    private final JdbcClient jdbcClient;

    AirlineQueries(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    List<Airline> findAll() {
        return jdbcClient.sql("""
                SELECT iata, icao, name, name_zh, aliases
                FROM airlines
                ORDER BY lower(name)
                """)
                // The aliases are a PostgreSQL array, which the driver hands over as a String[].
                .query((row, rowNumber) -> new Airline(
                        row.getString("iata"),
                        row.getString("icao"),
                        row.getString("name"),
                        row.getString("name_zh"),
                        List.of((String[]) row.getArray("aliases").getArray())))
                .list();
    }
}
