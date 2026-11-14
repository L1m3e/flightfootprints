package io.github.l1m3e.flightfootprints.stats;

import java.util.List;

import io.github.l1m3e.flightfootprints.airport.Airport;
import io.github.l1m3e.flightfootprints.flight.FlightResponse;

/**
 * Everything the statistics page shows, in one response.
 *
 * <p>Distances are in kilometres only. Miles and "times around the Earth" are the same
 * number in another unit, so the page converts them itself.
 *
 * @param flights         number of flights
 * @param totalDistanceKm sum of all flight distances
 * @param airports        number of different airports flown from or to
 * @param countries       number of different countries those airports are in
 * @param airlines        airlines, most flown first
 * @param topAirports     the airports with the most take-offs and landings
 * @param longestFlight   {@code null} when there are no flights
 * @param shortestFlight  {@code null} when there are no flights
 * @param flightsPerYear  one entry per year from the first flight to the last, also for years without flights
 */
public record StatsResponse(
        long flights,
        long totalDistanceKm,
        long airports,
        long countries,
        List<AirlineCount> airlines,
        List<AirportCount> topAirports,
        FlightResponse longestFlight,
        FlightResponse shortestFlight,
        List<YearCount> flightsPerYear) {

    public record AirlineCount(String airline, long flights, long distanceKm) {
    }

    /**
     * @param flights take-offs plus landings at this airport
     */
    public record AirportCount(Airport airport, long flights) {
    }

    public record YearCount(int year, long flights, long distanceKm) {
    }
}
