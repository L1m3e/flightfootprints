package io.github.l1m3e.flightfootprints.airport;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

/**
 * An airport from the OurAirports data set. This is reference data: it is loaded in
 * bulk by {@link AirportImporter} and never edited through the application.
 *
 * @param iata    three-letter IATA code, e.g. {@code PVG}
 * @param name    airport name
 * @param city    municipality the airport serves, {@code null} when the source has none
 * @param cityZh  the city in Chinese, {@code null} when no Chinese name is known; filled
 *                in by {@link ChineseCityNames}, not by the import
 * @param country ISO 3166-1 alpha-2 country code, e.g. {@code CN}
 * @param lat     latitude in decimal degrees
 * @param lon     longitude in decimal degrees
 */
@Table("airports")
public record Airport(@Id String iata, String name, String city, String cityZh, String country, double lat,
        double lon) {
}
