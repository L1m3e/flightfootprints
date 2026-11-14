package io.github.l1m3e.flightfootprints.flight;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import io.github.l1m3e.flightfootprints.airport.Airport;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * Reads flights together with their two airports in a single SQL query.
 *
 * <p>Writing uses the Spring Data repository, where one object is one table row. A join
 * across three tables does not fit that model, so the read side is plain SQL with a
 * hand-written row mapper.
 */
@Repository
public class FlightQueries {

    private static final String SELECT_FLIGHTS = """
            SELECT f.id, f.flight_date, f.flight_no, f.airline, f.aircraft, f.seat, f.cabin, f.distance_km, f.notes,
                   o.iata AS from_iata, o.name AS from_name, o.city AS from_city,
                   o.country AS from_country, o.lat AS from_lat, o.lon AS from_lon,
                   d.iata AS to_iata, d.name AS to_name, d.city AS to_city,
                   d.country AS to_country, d.lat AS to_lat, d.lon AS to_lon
            FROM flights f
            JOIN airports o ON o.iata = f.from_iata
            JOIN airports d ON d.iata = f.to_iata
            """;

    private final JdbcClient jdbcClient;

    FlightQueries(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    /** Newest first; flights on the same day in the reverse order they were entered. */
    List<FlightResponse> findAll() {
        return jdbcClient.sql(SELECT_FLIGHTS + "ORDER BY f.flight_date DESC, f.id DESC")
                .query(FlightQueries::toResponse)
                .list();
    }

    Optional<FlightResponse> findById(long id) {
        return jdbcClient.sql(SELECT_FLIGHTS + "WHERE f.id = :id")
                .param("id", id)
                .query(FlightQueries::toResponse)
                .optional();
    }

    /** The flight that covered the most distance. Of several equally long ones, the most recent. */
    public Optional<FlightResponse> findLongest() {
        return jdbcClient.sql(SELECT_FLIGHTS + "ORDER BY f.distance_km DESC, f.flight_date DESC, f.id DESC LIMIT 1")
                .query(FlightQueries::toResponse)
                .optional();
    }

    /** The flight that covered the least distance. Of several equally short ones, the most recent. */
    public Optional<FlightResponse> findShortest() {
        return jdbcClient.sql(SELECT_FLIGHTS + "ORDER BY f.distance_km ASC, f.flight_date DESC, f.id DESC LIMIT 1")
                .query(FlightQueries::toResponse)
                .optional();
    }

    private static FlightResponse toResponse(ResultSet row, int rowNumber) throws SQLException {
        String cabin = row.getString("cabin");
        return new FlightResponse(
                row.getLong("id"),
                row.getObject("flight_date", LocalDate.class),
                row.getString("flight_no"),
                row.getString("airline"),
                airport(row, "from_"),
                airport(row, "to_"),
                row.getString("aircraft"),
                row.getString("seat"),
                cabin == null ? null : Cabin.valueOf(cabin),
                row.getInt("distance_km"),
                row.getString("notes"));
    }

    private static Airport airport(ResultSet row, String prefix) throws SQLException {
        return new Airport(
                row.getString(prefix + "iata"),
                row.getString(prefix + "name"),
                row.getString(prefix + "city"),
                row.getString(prefix + "country"),
                row.getDouble(prefix + "lat"),
                row.getDouble(prefix + "lon"));
    }
}
