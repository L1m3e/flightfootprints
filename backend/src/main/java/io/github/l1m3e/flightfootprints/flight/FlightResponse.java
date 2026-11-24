package io.github.l1m3e.flightfootprints.flight;

import java.time.LocalDate;

import io.github.l1m3e.flightfootprints.airport.Airport;

/**
 * A flight as the API returns it. Both airports are included in full, so the timeline
 * and the map can show names and coordinates without asking for each airport separately.
 */
public record FlightResponse(
        long id,
        LocalDate flightDate,
        String flightNo,
        FlightAirline airline,
        Airport from,
        Airport to,
        String aircraft,
        String seat,
        Cabin cabin,
        int distanceKm,
        String notes) {
}
