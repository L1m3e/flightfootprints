package io.github.l1m3e.flightfootprints.lookup;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

class FlightLookupConfigTest {

    private final FlightLookupConfig config = new FlightLookupConfig();
    private final Clock clock = Clock.systemUTC();

    @Test
    void withoutAKeyTheFreeProviderIsUsed() {
        FlightLookupProperties properties = new FlightLookupProperties(Duration.ofSeconds(1),
                new FlightLookupProperties.Adsbdb(null), new FlightLookupProperties.AeroDataBox(null, null, null));

        assertThat(config.flightLookupProvider(properties, RestClient.builder(), clock))
                .isInstanceOf(AdsbdbFlightLookupProvider.class);
    }

    /** Not AeroDataBox alone: the free provider stays behind it for what it cannot answer. */
    @Test
    void aKeyPutsTheProviderThatKnowsAircraftInFrontOfTheFreeOne() {
        FlightLookupProperties properties = new FlightLookupProperties(Duration.ofSeconds(1),
                new FlightLookupProperties.Adsbdb(null),
                new FlightLookupProperties.AeroDataBox(null, "secret", null));

        assertThat(config.flightLookupProvider(properties, RestClient.builder(), clock))
                .isInstanceOf(FallbackFlightLookupProvider.class);
    }
}
