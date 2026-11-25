package io.github.l1m3e.flightfootprints.lookup;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FallbackFlightLookupProviderTest {

    private static final LocalDate DATE = LocalDate.of(2026, 11, 20);

    /** What the preferred provider knows: route, airline and aircraft. */
    private static final FlightLookupResult WITH_AIRCRAFT =
            new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", "B77W", "Boeing 777-300ER");
    /** What the other one knows: the route and the airline. */
    private static final FlightLookupResult ROUTE_ONLY =
            new FlightLookupResult("PVG", "JFK", "MU", "China Eastern Airlines", null, null);

    @Mock
    private FlightLookupProvider preferred;
    @Mock
    private FlightLookupProvider other;

    private FallbackFlightLookupProvider provider;

    @BeforeEach
    void setUp() {
        provider = new FallbackFlightLookupProvider(preferred, other);
    }

    @Test
    void theAnswerOfThePreferredProviderIsUsedAndTheOtherOneIsNotAsked() {
        when(preferred.lookup("MU587", DATE)).thenReturn(List.of(WITH_AIRCRAFT));

        assertThat(provider.lookup("MU587", DATE)).containsExactly(WITH_AIRCRAFT);

        // Not asking it also means not spending a second request on every lookup.
        verifyNoInteractions(other);
    }

    @Test
    void aFlightThePreferredProviderDoesNotKnowIsLookedUpWithTheOtherOne() {
        when(preferred.lookup("MU587", DATE)).thenReturn(List.of());
        when(other.lookup("MU587", DATE)).thenReturn(List.of(ROUTE_ONLY));

        assertThat(provider.lookup("MU587", DATE)).containsExactly(ROUTE_ONLY);
    }

    /** The case a flight log meets most: a flight from years ago. */
    @Test
    void aDateThePreferredProviderCannotBeAskedAboutIsLookedUpWithTheOtherOne() {
        LocalDate yearsAgo = LocalDate.of(2019, 7, 20);
        when(preferred.lookup("MU587", yearsAgo)).thenThrow(new FlightLookupDateRangeException());
        when(other.lookup("MU587", yearsAgo)).thenReturn(List.of(ROUTE_ONLY));

        assertThat(provider.lookup("MU587", yearsAgo)).containsExactly(ROUTE_ONLY);
    }

    @Test
    void whenThePreferredProviderFailsTheOtherOneAnswers() {
        when(preferred.lookup("MU587", DATE))
                .thenThrow(new FlightLookupUnavailableException("AeroDataBox's rate limit was reached.", null));
        when(other.lookup("MU587", DATE)).thenReturn(List.of(ROUTE_ONLY));

        assertThat(provider.lookup("MU587", DATE)).containsExactly(ROUTE_ONLY);
    }

    @Test
    void aFlightThatNeitherProviderKnowsIsSimplyNotFound() {
        when(preferred.lookup("ZZ999", DATE)).thenReturn(List.of());
        when(other.lookup("ZZ999", DATE)).thenReturn(List.of());

        assertThat(provider.lookup("ZZ999", DATE)).isEmpty();
        verify(other).lookup("ZZ999", DATE);
    }

    @Test
    void aDateOutOfRangeAndAFlightTheOtherProviderDoesNotKnowIsNotFoundToo() {
        LocalDate yearsAgo = LocalDate.of(2019, 7, 20);
        when(preferred.lookup("ZZ999", yearsAgo)).thenThrow(new FlightLookupDateRangeException());
        when(other.lookup("ZZ999", yearsAgo)).thenReturn(List.of());

        assertThat(provider.lookup("ZZ999", yearsAgo)).isEmpty();
    }

    /**
     * "Not found" would be a guess here: the provider that might have known the flight
     * could not be asked. The caller is told that the lookup failed.
     */
    @Test
    void whenThePreferredProviderFailsAndTheOtherOneKnowsNothingTheFailureIsReported() {
        FlightLookupUnavailableException rejected =
                new FlightLookupUnavailableException("AeroDataBox rejected the configured API key.", null);
        when(preferred.lookup("MU587", DATE)).thenThrow(rejected);
        when(other.lookup("MU587", DATE)).thenReturn(List.of());

        assertThatThrownBy(() -> provider.lookup("MU587", DATE)).isSameAs(rejected);
    }

    @Test
    void whenBothProvidersFailTheLookupIsUnavailable() {
        FlightLookupUnavailableException first =
                new FlightLookupUnavailableException("AeroDataBox could not be reached.", null);
        FlightLookupUnavailableException second =
                new FlightLookupUnavailableException("The free flight database (ADSBDB) could not be reached.", null);
        when(preferred.lookup("MU587", DATE)).thenThrow(first);
        when(other.lookup("MU587", DATE)).thenThrow(second);

        assertThatThrownBy(() -> provider.lookup("MU587", DATE))
                .isSameAs(second)
                // The first failure is kept with it, for whoever reads the log.
                .satisfies(thrown -> assertThat(thrown.getSuppressed()).containsExactly(first));
    }

    @Test
    void whenOnlyTheOtherProviderFailsThatIsReported() {
        FlightLookupUnavailableException down =
                new FlightLookupUnavailableException("The free flight database (ADSBDB) answered 500.", null);
        when(preferred.lookup("MU587", DATE)).thenReturn(List.of());
        when(other.lookup("MU587", DATE)).thenThrow(down);

        assertThatThrownBy(() -> provider.lookup("MU587", DATE)).isSameAs(down);
    }
}
