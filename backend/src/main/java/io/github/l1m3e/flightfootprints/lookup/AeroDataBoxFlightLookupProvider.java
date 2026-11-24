package io.github.l1m3e.flightfootprints.lookup;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * AeroDataBox's "flight by number and date" endpoint. Unlike ADSBDB it knows the aircraft
 * type, but it needs an API key, spends quota, and only answers for dates within a year of
 * today.
 *
 * <p>Wire format: {@code GET /flights/number/{number}/{yyyy-MM-dd}?dateLocalRole=Both}
 * answers 200 with an array of flights, 204 when there is no such flight, or 404. When a
 * flight only carries the aircraft's registration, a second request to
 * {@code /aircrafts/reg/{registration}} asks for its type; that request is best-effort.
 */
class AeroDataBoxFlightLookupProvider implements FlightLookupProvider {

    private static final Logger log = LoggerFactory.getLogger(AeroDataBoxFlightLookupProvider.class);

    /** The API's own limit, counted forwards and backwards from today. */
    static final int MAX_DAYS_FROM_TODAY = 365;

    private final RestClient client;
    private final String apiKey;
    private final String apiKeyHeader;
    private final Clock clock;

    AeroDataBoxFlightLookupProvider(RestClient client, String apiKey, String apiKeyHeader, Clock clock) {
        this.client = client;
        this.apiKey = apiKey;
        this.apiKeyHeader = apiKeyHeader;
        this.clock = clock;
    }

    @Override
    public List<FlightLookupResult> lookup(String flightNo, LocalDate date) {
        LocalDate today = LocalDate.now(clock);
        LocalDate day = date == null ? today : date;
        if (Math.abs(ChronoUnit.DAYS.between(today, day)) > MAX_DAYS_FROM_TODAY) {
            throw new FlightLookupDateRangeException();
        }

        List<AeroDataBoxFlight> flights;
        try {
            flights = client.get()
                    .uri(uri -> uri.path("/flights/number/{flightNo}/{date}")
                            .queryParam("dateLocalRole", "Both")
                            .queryParam("withAircraftImage", "false")
                            .queryParam("withLocation", "false")
                            .build(flightNo, day))
                    .header(apiKeyHeader, apiKey)
                    .exchange((request, response) -> {
                        int status = response.getStatusCode().value();
                        if (status == 204 || status == 404) {
                            return null;
                        }
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            throw unavailableFor(status);
                        }
                        return response.bodyTo(new ParameterizedTypeReference<List<AeroDataBoxFlight>>() {
                        });
                    });
        } catch (RestClientException exception) {
            throw new FlightLookupUnavailableException("AeroDataBox could not be reached.", exception);
        }

        if (flights == null) {
            return List.of();
        }
        Map<String, AircraftType> aircraftByRegistration = new HashMap<>();
        List<FlightLookupResult> results = new ArrayList<>();
        for (AeroDataBoxFlight flight : flights) {
            FlightLookupResult result = toResult(flight, aircraftByRegistration);
            if (result != null) {
                results.add(result);
            }
        }
        return results;
    }

    private static FlightLookupUnavailableException unavailableFor(int status) {
        String detail = switch (status) {
            case 401, 403 -> "AeroDataBox rejected the configured API key.";
            case 429 -> "AeroDataBox's rate limit was reached.";
            default -> "AeroDataBox answered " + status + ".";
        };
        return new FlightLookupUnavailableException(detail, null);
    }

    private FlightLookupResult toResult(AeroDataBoxFlight flight,
            Map<String, AircraftType> aircraftByRegistration) {
        String from = flight.departure() == null ? null : airportCode(flight.departure().airport());
        String to = flight.arrival() == null ? null : airportCode(flight.arrival().airport());
        if (from == null || to == null) {
            log.debug("AeroDataBox returned a flight without both airports: {}", flight);
            return null;
        }
        AircraftType aircraft = aircraftOf(flight.aircraft(), aircraftByRegistration);
        AeroDataBoxAirline airline = flight.airline();
        return new FlightLookupResult(from, to,
                airline == null ? null : upper(airline.iata()),
                airline == null ? null : blankToNull(airline.name()),
                aircraft == null ? null : aircraft.icao(),
                aircraft == null ? null : aircraft.model());
    }

    private static String airportCode(AeroDataBoxAirport airport) {
        return airport == null ? null : upper(airport.iata());
    }

    /**
     * The flight response usually carries the model or at least the ICAO type. When it only
     * carries the registration, ask the aircraft endpoint; a failure there must not lose the
     * route, so it just leaves the aircraft empty.
     */
    private AircraftType aircraftOf(AeroDataBoxAircraft aircraft, Map<String, AircraftType> cache) {
        if (aircraft == null) {
            return null;
        }
        String icao = upper(aircraft.icaoCode());
        String model = blankToNull(aircraft.model());
        if (icao != null || model != null) {
            return new AircraftType(icao, model);
        }
        String registration = blankToNull(aircraft.reg());
        return registration == null ? null
                : cache.computeIfAbsent(registration, this::fetchAircraftByRegistration);
    }

    private AircraftType fetchAircraftByRegistration(String registration) {
        try {
            return client.get()
                    .uri("/aircrafts/reg/{registration}", registration)
                    .header(apiKeyHeader, apiKey)
                    .exchange((request, response) -> {
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            return null;
                        }
                        AeroDataBoxAircraft body = response.bodyTo(AeroDataBoxAircraft.class);
                        if (body == null) {
                            return null;
                        }
                        String icao = upper(body.icaoCode());
                        String model = blankToNull(body.model());
                        return icao == null && model == null ? null : new AircraftType(icao, model);
                    });
        } catch (RestClientException exception) {
            log.debug("Could not look up aircraft {}: {}", registration, exception.getMessage());
            return null;
        }
    }

    private static String upper(String value) {
        String trimmed = blankToNull(value);
        return trimmed == null ? null : trimmed.toUpperCase(Locale.ROOT);
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record AircraftType(String icao, String model) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AeroDataBoxFlight(Departure departure, Arrival arrival, AeroDataBoxAirline airline,
            AeroDataBoxAircraft aircraft) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Departure(AeroDataBoxAirport airport) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Arrival(AeroDataBoxAirport airport) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AeroDataBoxAirport(String iata, String icao) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AeroDataBoxAirline(String iata, String icao, String name) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AeroDataBoxAircraft(String reg, String model, String icaoCode) {
    }
}
