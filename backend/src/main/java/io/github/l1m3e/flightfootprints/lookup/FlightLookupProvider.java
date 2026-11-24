package io.github.l1m3e.flightfootprints.lookup;

import java.time.LocalDate;
import java.util.List;

/**
 * What the lookup feature needs from a flight data source. Implementations talk to one
 * outside service; {@link FlightLookupService} knows nothing about their wire formats.
 *
 * <p>Implementations return an empty list when the service simply does not know the
 * flight, and throw {@link FlightLookupUnavailableException} when the service itself
 * failed, so the two cases stay distinguishable.
 */
public interface FlightLookupProvider {

    /**
     * @param flightNo a normalized flight number such as MU587
     * @param date     the flight's local date, or null when the caller did not give one
     * @return every route the provider knows for this number, possibly empty
     */
    List<FlightLookupResult> lookup(String flightNo, LocalDate date);
}
