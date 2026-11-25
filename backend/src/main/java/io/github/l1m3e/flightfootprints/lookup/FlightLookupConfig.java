package io.github.l1m3e.flightfootprints.lookup;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Chooses the provider once, at startup, so no request has to decide. Without an
 * AeroDataBox key that is ADSBDB, which is free and needs no account. With a key,
 * AeroDataBox is asked first because it also knows aircraft types, and ADSBDB stands in
 * whenever AeroDataBox has no answer; see {@link FallbackFlightLookupProvider}.
 */
@Configuration(proxyBeanMethods = false)
class FlightLookupConfig {

    @Bean
    FlightLookupProvider flightLookupProvider(FlightLookupProperties properties, RestClient.Builder builder,
            Clock clock) {
        FlightLookupProvider adsbdb = new AdsbdbFlightLookupProvider(
                client(builder, properties.adsbdb().baseUrl(), properties.timeout()));

        FlightLookupProperties.AeroDataBox aeroDataBox = properties.aerodatabox();
        if (!aeroDataBox.configured()) {
            return adsbdb;
        }
        return new FallbackFlightLookupProvider(
                new AeroDataBoxFlightLookupProvider(
                        client(builder, aeroDataBox.baseUrl(), properties.timeout()),
                        aeroDataBox.apiKey(), aeroDataBox.apiKeyHeader(), clock),
                adsbdb);
    }

    /** A RestClient that gives up instead of holding the browser's request open forever. */
    private static RestClient client(RestClient.Builder builder, String baseUrl, Duration timeout) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(timeout).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(timeout);
        return builder.clone().baseUrl(baseUrl).requestFactory(requestFactory).build();
    }
}
