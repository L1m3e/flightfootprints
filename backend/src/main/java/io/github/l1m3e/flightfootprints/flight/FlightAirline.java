package io.github.l1m3e.flightfootprints.flight;

/**
 * The airline of a flight, as the API returns it.
 *
 * @param iata   IATA code of the airline, {@code null} for one that is not in the airlines table
 * @param name   name in English; for an airline that is not in the table, the name as it was typed
 * @param nameZh name in Chinese, {@code null} when there is none
 */
public record FlightAirline(String iata, String name, String nameZh) {
}
