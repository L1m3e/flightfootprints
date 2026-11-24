package io.github.l1m3e.flightfootprints.airport;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.Repository;

/**
 * Read-only access to airports.
 *
 * <p>It extends the marker interface {@link Repository} instead of {@code CrudRepository}
 * on purpose: only the methods declared here exist, so nothing can save or delete an
 * airport through this repository.
 */
public interface AirportRepository extends Repository<Airport, String> {

    Optional<Airport> findById(String iata);

    long count();

    /**
     * Finds airports for the autocomplete box. A term matches the start of the IATA code,
     * or any part of the city (in English or Chinese) or of the airport name, without
     * regard to case. The best matches come first: the exact code, then codes, cities and
     * names that start with the term.
     */
    default List<Airport> search(String term, int limit) {
        // The term is used inside LIKE patterns, where % and _ are wildcards. Escaping them
        // makes a typed "%" mean a percent sign instead of "match everything".
        String escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return findMatching(term, escaped + "%", "%" + escaped + "%", limit);
    }

    @Query("""
            SELECT iata, name, city, city_zh, country, lat, lon
            FROM airports
            WHERE iata ILIKE :prefix OR city ILIKE :contains OR city_zh LIKE :contains OR name ILIKE :contains
            ORDER BY CASE
                         WHEN iata = upper(:term) THEN 0
                         WHEN iata ILIKE :prefix  THEN 1
                         WHEN city ILIKE :prefix OR city_zh LIKE :prefix THEN 2
                         WHEN name ILIKE :prefix  THEN 3
                         ELSE 4
                     END,
                     name
            LIMIT :limit
            """)
    List<Airport> findMatching(String term, String prefix, String contains, int limit);
}
