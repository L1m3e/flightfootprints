package io.github.l1m3e.flightfootprints.lookup;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Chooses the provider once, at startup, so no request has to decide. AeroDataBox wins
 * when a key is configured because it also knows aircraft types; ADSBDB is the free
 * fallback and needs no account.
 */
@Configuration(proxyBeanMethods = false)
class FlightLookupConfig {

    @Bean
    FlightLookupProvider flightLookupProvider(FlightLookupProperties properties, RestClient.Builder builder,
            Clock clock) {
        FlightLookupProperties.AeroDataBox aeroDataBox = properties.aerodatabox();
        if (aeroDataBox.configured()) {
            return new AeroDataBoxFlightLookupProvider(
                    client(builder, aeroDataBox.baseUrl(), properties.timeout()),
                    aeroDataBox.apiKey(), aeroDataBox.apiKeyHeader(), clock);
        }
        return new AdsbdbFlightLookupProvider(
                client(builder, properties.adsbdb().baseUrl(), properties.timeout()));
    }

    /** A RestClient that gives up instead of holding the browser's request open forever. */
    private static RestClient client(RestClient.Builder builder, String baseUrl, Duration timeout) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);
        return builder.clone().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
}
