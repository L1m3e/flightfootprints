package io.github.l1m3e.flightfootprints.stats;

import io.github.l1m3e.flightfootprints.flight.FlightQueries;
import io.github.l1m3e.flightfootprints.stats.StatsQueries.Places;
import io.github.l1m3e.flightfootprints.stats.StatsQueries.Totals;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StatsService {

    private final StatsQueries stats;
    private final FlightQueries flights;

    StatsService(StatsQueries stats, FlightQueries flights) {
        this.stats = stats;
        this.flights = flights;
    }

    /**
     * One transaction for all the queries, so the numbers describe the same moment even
     * if a flight is added while they run.
     */
    @Transactional(readOnly = true)
    public StatsResponse stats() {
        Totals totals = stats.totals();
        Places places = stats.places();
        return new StatsResponse(
                totals.flights(),
                totals.distanceKm(),
                places.airports(),
                places.countries(),
                stats.airlines(),
                stats.topAirports(),
                flights.findLongest().orElse(null),
                flights.findShortest().orElse(null),
                stats.flightsPerYear());
    }
}
