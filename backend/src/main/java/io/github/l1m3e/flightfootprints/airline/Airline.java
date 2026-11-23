package io.github.l1m3e.flightfootprints.airline;

import java.util.List;

/**
 * An airline that a flight can be matched to. This is reference data: it is created by a
 * Flyway migration and never edited through the application.
 *
 * @param iata    two-character IATA designator, the start of a flight number: {@code CA} in CA818
 * @param icao    three-letter ICAO designator, e.g. {@code CCA}
 * @param name    name in English
 * @param nameZh  name in Chinese, {@code null} when there is no common one
 * @param aliases other names people use for the airline, in any language
 */
public record Airline(String iata, String icao, String name, String nameZh, List<String> aliases) {
}
