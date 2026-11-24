package io.github.l1m3e.flightfootprints.lookup;

/**
 * The airline as the browser needs it: a code, and both names when we know the airline.
 */
public record FlightLookupAirline(String iata, String name, String nameZh) {
}
