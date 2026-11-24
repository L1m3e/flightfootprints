package io.github.l1m3e.flightfootprints.lookup;

/**
 * One route a provider knows for a flight number, in the provider's own terms: airport and
 * airline codes, plus whatever it knows about the aircraft. The service resolves the codes
 * against our own airports and airlines before answering the browser.
 *
 * @param fromIata      IATA code of the departure airport, uppercase
 * @param toIata        IATA code of the arrival airport, uppercase
 * @param airlineIata   the operating airline's IATA code, when the provider gives one
 * @param airlineName   the airline's English name, when the provider gives one
 * @param aircraftIcao  ICAO type code such as B77W, when the provider gives one
 * @param aircraftModel the aircraft's full name such as "Boeing 777-300ER", when known
 */
public record FlightLookupResult(String fromIata, String toIata, String airlineIata, String airlineName,
        String aircraftIcao, String aircraftModel) {
}
