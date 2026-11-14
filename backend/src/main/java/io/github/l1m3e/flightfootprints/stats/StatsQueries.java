package io.github.l1m3e.flightfootprints.stats;

import java.util.List;

import io.github.l1m3e.flightfootprints.airport.Airport;
import io.github.l1m3e.flightfootprints.stats.StatsResponse.AirlineCount;
import io.github.l1m3e.flightfootprints.stats.StatsResponse.AirportCount;
import io.github.l1m3e.flightfootprints.stats.StatsResponse.YearCount;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/**
 * The statistics, each computed by the database in one query. Counting and summing in
 * SQL means the application never has to load every flight just to add them up.
 */
@Repository
class StatsQueries {

    private static final int TOP_AIRPORTS = 10;

    private final JdbcClient jdbcClient;

    StatsQueries(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    record Totals(long flights, long distanceKm) {
    }

    record Places(long airports, long countries) {
    }

    Totals totals() {
        // sum() of no rows is NULL, not 0, hence the coalesce.
        return jdbcClient.sql("""
                SELECT count(*) AS flights, coalesce(sum(distance_km), 0) AS distance_km
                FROM flights
                """)
                .query(Totals.class)
                .single();
    }

    Places places() {
        // UNION (without ALL) removes duplicates, so every airport appears once whether
        // it was a departure, an arrival or both.
        return jdbcClient.sql("""
                WITH visited AS (
                    SELECT from_iata AS iata FROM flights
                    UNION
                    SELECT to_iata FROM flights
                )
                SELECT count(*) AS airports, count(DISTINCT a.country) AS countries
                FROM visited v
                JOIN airports a ON a.iata = v.iata
                """)
                .query(Places.class)
                .single();
    }

    List<AirlineCount> airlines() {
        // The airline is free text, so "China Eastern" and "china eastern" are grouped
        // together. mode() picks the spelling that was used most often for the group.
        return jdbcClient.sql("""
                SELECT mode() WITHIN GROUP (ORDER BY airline) AS airline,
                       count(*) AS flights,
                       sum(distance_km) AS distance_km
                FROM flights
                GROUP BY lower(airline)
                ORDER BY flights DESC, distance_km DESC, airline
                """)
                .query(AirlineCount.class)
                .list();
    }

    List<AirportCount> topAirports() {
        // UNION ALL keeps duplicates: here every take-off and every landing counts.
        return jdbcClient.sql("""
                SELECT a.iata, a.name, a.city, a.country, a.lat, a.lon, visits.flights
                FROM (
                    SELECT iata, count(*) AS flights
                    FROM (
                        SELECT from_iata AS iata FROM flights
                        UNION ALL
                        SELECT to_iata FROM flights
                    ) ends
                    GROUP BY iata
                ) visits
                JOIN airports a ON a.iata = visits.iata
                ORDER BY visits.flights DESC, a.iata
                LIMIT :limit
                """)
                .param("limit", TOP_AIRPORTS)
                .query((row, rowNumber) -> new AirportCount(
                        new Airport(row.getString("iata"), row.getString("name"), row.getString("city"),
                                row.getString("country"), row.getDouble("lat"), row.getDouble("lon")),
                        row.getLong("flights")))
                .list();
    }

    List<YearCount> flightsPerYear() {
        // generate_series produces every year from the first flight to the last, and the
        // LEFT JOIN keeps the years in which nothing was flown, with a count of zero.
        // Without flights both bounds are NULL and the series is empty.
        return jdbcClient.sql("""
                SELECT years.year,
                       count(f.id) AS flights,
                       coalesce(sum(f.distance_km), 0) AS distance_km
                FROM generate_series(
                         (SELECT extract(year FROM min(flight_date))::int FROM flights),
                         (SELECT extract(year FROM max(flight_date))::int FROM flights)
                     ) AS years(year)
                LEFT JOIN flights f ON extract(year FROM f.flight_date) = years.year
                GROUP BY years.year
                ORDER BY years.year
                """)
                .query(YearCount.class)
                .list();
    }
}
