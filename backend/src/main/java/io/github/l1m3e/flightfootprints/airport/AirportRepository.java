package io.github.l1m3e.flightfootprints.airport;

import java.util.Optional;

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
}
