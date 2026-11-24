package io.github.l1m3e.flightfootprints.lookup;

import io.github.l1m3e.flightfootprints.airport.Airport;

/**
 * One possible route for the flight number, ready for the form: the airports are our own
 * records (with names and coordinates), so the browser can show the same labels as
 * everywhere else. The aircraft fields are null when the provider does not know them.
 */
public record FlightLookupResponse(String flightNo, Airport from, Airport to, String aircraftIcao,
        String aircraftModel, FlightLookupAirline airline) {
}
