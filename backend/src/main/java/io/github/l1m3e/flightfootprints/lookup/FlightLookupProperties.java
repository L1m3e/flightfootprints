package io.github.l1m3e.flightfootprints.lookup;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Settings under {@code app.flight-lookup}. application.yaml fills them from the
 * environment; see README, "Configuration".
 *
 * @param timeout   how long to wait for the lookup service, for both connecting and reading
 * @param adsbdb    the free provider, used when no AeroDataBox key is configured
 * @param aerodatabox the provider that also knows aircraft types; needs an API key
 */
@ConfigurationProperties("app.flight-lookup")
public record FlightLookupProperties(Duration timeout, Adsbdb adsbdb, AeroDataBox aerodatabox) {

    public FlightLookupProperties {
        timeout = timeout == null ? Duration.ofSeconds(8) : timeout;
        adsbdb = adsbdb == null ? new Adsbdb(null) : adsbdb;
        aerodatabox = aerodatabox == null ? new AeroDataBox(null, null, null) : aerodatabox;
    }

    /** @param baseUrl ADSBDB's root, without a trailing slash */
    public record Adsbdb(String baseUrl) {

        public Adsbdb {
            baseUrl = blankTo(baseUrl, "https://api.adsbdb.com");
        }
    }

    /**
     * @param baseUrl      the API root: RapidAPI's default, or https://api.aerodatabox.com for a direct subscription
     * @param apiKey       blank disables AeroDataBox and keeps ADSBDB selected
     * @param apiKeyHeader the header the key travels in: x-rapidapi-key for RapidAPI, X-Api-Key for direct
     */
    public record AeroDataBox(String baseUrl, String apiKey, String apiKeyHeader) {

        public AeroDataBox {
            baseUrl = blankTo(baseUrl, "https://aerodatabox.p.rapidapi.com");
            apiKey = apiKey == null ? "" : apiKey.strip();
            apiKeyHeader = blankTo(apiKeyHeader, "x-rapidapi-key");
        }

        public boolean configured() {
            return !apiKey.isEmpty();
        }
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.strip();
    }
}
