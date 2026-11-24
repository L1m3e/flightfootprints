package io.github.l1m3e.flightfootprints.lookup;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * ADSBDB's free callsign endpoint. It knows the route and the airline but never the
 * aircraft type, and it ignores the date: the same callsign is looked up whatever day the
 * caller asked for. That makes it the right default for a log of past flights.
 *
 * <p>Wire format: {@code GET /v0/callsign/{callsign}} answers 200 with a
 * {@code response.flightroute} object, or 404 when it does not know the callsign.
 */
class AdsbdbFlightLookupProvider implements FlightLookupProvider {

    private static final Logger log = LoggerFactory.getLogger(AdsbdbFlightLookupProvider.class);

    private final RestClient client;

    AdsbdbFlightLookupProvider(RestClient client) {
        this.client = client;
    }

    @Override
    public List<FlightLookupResult> lookup(String flightNo, LocalDate date) {
        AdsbdbResponse body;
        try {
            body = client.get()
                    .uri("/v0/callsign/{flightNo}", flightNo)
                    .exchange((request, response) -> {
                        if (response.getStatusCode().value() == 404) {
                            return null;
                        }
                        if (!response.getStatusCode().is2xxSuccessful()) {
                            throw new FlightLookupUnavailableException(
                                    "The free flight database (ADSBDB) answered " + response.getStatusCode().value()
                                            + ".",
                                    null);
                        }
                        return response.bodyTo(AdsbdbResponse.class);
                    });
        } catch (RestClientException exception) {
            throw new FlightLookupUnavailableException("The free flight database (ADSBDB) could not be reached.",
                    exception);
        }

        if (body == null || body.response() == null || body.response().flightroute() == null) {
            return List.of();
        }
        FlightLookupResult result = toResult(body.response().flightroute());
        return result == null ? List.of() : List.of(result);
    }

    private static FlightLookupResult toResult(AdsbdbResponse.FlightRoute route) {
        String from = airportCode(route.origin());
        String to = airportCode(route.destination());
        if (from == null || to == null) {
            log.debug("ADSBDB returned a route without both airports: {}", route);
            return null;
        }
        AdsbdbResponse.Airline airline = route.airline();
        return new FlightLookupResult(from, to,
                airline == null ? null : upper(airline.iata()),
                airline == null ? null : blankToNull(airline.name()),
                null, null);
    }

    private static String airportCode(AdsbdbResponse.Airport airport) {
        return airport == null ? null : upper(airport.iata());
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

    @JsonIgnoreProperties(ignoreUnknown = true)
    record AdsbdbResponse(Response response) {

        @JsonIgnoreProperties(ignoreUnknown = true)
        record Response(FlightRoute flightroute) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        record FlightRoute(Airline airline, Airport origin, Airport destination) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        record Airline(String iata, String icao, String name) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        record Airport(@JsonProperty("iata_code") String iata) {
        }
    }
}
