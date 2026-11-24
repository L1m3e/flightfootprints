package io.github.l1m3e.flightfootprints.lookup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import io.github.l1m3e.flightfootprints.airline.Airline;
import io.github.l1m3e.flightfootprints.airline.AirlineLookup;
import io.github.l1m3e.flightfootprints.airport.Airport;
import io.github.l1m3e.flightfootprints.airport.AirportRepository;
import io.github.l1m3e.flightfootprints.web.FieldValidationException;

@ExtendWith(MockitoExtension.class)
class FlightLookupServiceTest {

    private static final LocalDate DATE = LocalDate.of(2026, 11, 20);

    private static final Airport PVG = new Airport("PVG", "Shanghai Pudong International Airport",
            "Shanghai (Pudong)", "上海", "CN", 31.1443, 121.8083);
    private static final Airport JFK = new Airport("JFK", "John F. Kennedy International Airport",
            "New York", "纽约", "US", 40.6413, -73.7781);
    private static final Airline CHINA_EASTERN = new Airline("MU", "CES", "China Eastern Airlines", "中国东方航空",
            List.of("东航"));

    @Mock
    private FlightLookupProvider provider;
    @Mock
    private AirportRepository airports;
    @Mock
    private AirlineLookup airlines;

    private FlightLookupService service;

    @BeforeEach
    void setUp() {
        service = new FlightLookupService(provider, airports, airlines);
    }

    @Test
    void resolvesTheProvidersCodesAgainstOurAirportsAndAirlines() {
        when(provider.lookup("MU587", DATE)).thenReturn(List.of(
                new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", "B77W",
                        "Boeing 777-300ER")));
        when(airports.findById("PVG")).thenReturn(Optional.of(PVG));
        when(airports.findById("JFK")).thenReturn(Optional.of(JFK));
        when(airlines.find("MU")).thenReturn(Optional.of(CHINA_EASTERN));

        List<FlightLookupResponse> routes = service.lookup(" mu 587 ", DATE, null, null);

        assertThat(routes).singleElement().satisfies(route -> {
            assertThat(route.flightNo()).isEqualTo("MU587");
            assertThat(route.from()).isEqualTo(PVG);
            assertThat(route.to()).isEqualTo(JFK);
            assertThat(route.aircraftIcao()).isEqualTo("B77W");
            assertThat(route.aircraftModel()).isEqualTo("Boeing 777-300ER");
            assertThat(route.airline()).isEqualTo(new FlightLookupAirline("MU", "China Eastern Airlines", "中国东方航空"));
        });
    }

    @Test
    void anAirlineWeDoNotKnowIsPassedOnAsTheProviderNamedIt() {
        when(provider.lookup("MU587", DATE)).thenReturn(List.of(
                new FlightLookupResult("PVG", "JFK", "mu", "China Eastern Airlines", null, null)));
        when(airports.findById("PVG")).thenReturn(Optional.of(PVG));
        when(airports.findById("JFK")).thenReturn(Optional.of(JFK));
        when(airlines.find("mu")).thenReturn(Optional.empty());
        when(airlines.find("China Eastern Airlines")).thenReturn(Optional.empty());

        List<FlightLookupResponse> routes = service.lookup("MU587", DATE, null, null);

        assertThat(routes).singleElement().extracting(FlightLookupResponse::airline)
                .isEqualTo(new FlightLookupAirline("MU", "China Eastern Airlines", null));
    }

    @Test
    void prefersTheRouteTheFormAlreadyShows() {
        when(provider.lookup("MU587", DATE)).thenReturn(List.of(
                new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", null, null),
                new FlightLookupResult("JFK", "PVG", "MU", "China Eastern Airlines", null, null)));
        when(airports.findById("PVG")).thenReturn(Optional.of(PVG));
        when(airports.findById("JFK")).thenReturn(Optional.of(JFK));

        List<FlightLookupResponse> routes = service.lookup("MU587", DATE, "JFK", null);

        assertThat(routes).singleElement().extracting(route -> route.from().iata()).isEqualTo("JFK");
    }

    @Test
    void keepsEveryRouteWhenNoneMatchesTheForm() {
        when(provider.lookup("MU587", DATE)).thenReturn(List.of(
                new FlightLookupResult("PVG", "JFK", "MU", null, null, null),
                new FlightLookupResult("JFK", "PVG", "MU", null, null, null)));
        when(airports.findById("PVG")).thenReturn(Optional.of(PVG));
        when(airports.findById("JFK")).thenReturn(Optional.of(JFK));

        assertThat(service.lookup("MU587", DATE, "PEK", null)).hasSize(2);
    }

    @Test
    void aRouteWithAnAirportWeDoNotHaveIsDropped() {
        when(provider.lookup("MU587", DATE)).thenReturn(List.of(
                new FlightLookupResult("PVG", "XXX", "MU", null, null, null)));
        when(airports.findById("PVG")).thenReturn(Optional.of(PVG));
        when(airports.findById("XXX")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.lookup("MU587", DATE, null, null))
                .isInstanceOf(FlightNotFoundException.class);
    }

    @Test
    void anEmptyProviderAnswerIsANotFound() {
        when(provider.lookup("ZZ999", DATE)).thenReturn(List.of());

        assertThatThrownBy(() -> service.lookup("ZZ999", DATE, null, null))
                .isInstanceOf(FlightNotFoundException.class);
    }

    @Test
    void aMalformedFlightNumberIsRejectedBeforeTheProviderIsCalled() {
        assertThatThrownBy(() -> service.lookup("MU", DATE, null, null))
                .isInstanceOf(FieldValidationException.class);
        verifyNoInteractions(provider);
        verifyNoInteractions(airports);
    }

    @Test
    void aTrulyEmptyFlightNumberIsAlsoRejected() {
        assertThatThrownBy(() -> service.lookup(null, DATE, null, null))
                .isInstanceOf(FieldValidationException.class);
        verify(provider, never()).lookup(any(), any());
    }
}
