package io.github.l1m3e.flightfootprints.lookup;

import java.time.LocalDate;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Asks one provider and, when that one has no answer, a second one.
 *
 * <p>This is how the two real providers work together once an AeroDataBox key is set.
 * AeroDataBox is asked first because it also knows the aircraft, but it only knows dates
 * within a year of today, has a small quota, and does not know every flight. In all of
 * those cases ADSBDB can still say which route the number flies, which is most of what
 * the form wants. A flight log is full of old flights, so without this the better
 * provider would make the lookup worse for exactly the flights that are entered most.
 *
 * <p>The second provider is asked when the first one
 * <ul>
 *   <li>knows no flight with this number on this date,</li>
 *   <li>cannot be asked about the date at all, or</li>
 *   <li>fails: an outage, a rejected key, a used-up quota.</li>
 * </ul>
 */
class FallbackFlightLookupProvider implements FlightLookupProvider {

    private static final Logger log = LoggerFactory.getLogger(FallbackFlightLookupProvider.class);

    private final FlightLookupProvider preferred;
    private final FlightLookupProvider fallback;

    FallbackFlightLookupProvider(FlightLookupProvider preferred, FlightLookupProvider fallback) {
        this.preferred = preferred;
        this.fallback = fallback;
    }

    @Override
    public List<FlightLookupResult> lookup(String flightNo, LocalDate date) {
        FlightLookupUnavailableException failure = null;
        try {
            List<FlightLookupResult> found = preferred.lookup(flightNo, date);
            if (!found.isEmpty()) {
                return found;
            }
            log.info("The preferred lookup provider knows no {} on {}; asking the other one.", flightNo, date);
        } catch (FlightLookupDateRangeException outOfRange) {
            log.info("The preferred lookup provider cannot be asked about {}; asking the other one.", date);
        } catch (FlightLookupUnavailableException unavailable) {
            // Worth a warning: a rejected key or a used-up quota is something to act on.
            log.warn("The preferred lookup provider failed ({}); asking the other one.",
                    unavailable.getBody().getDetail());
            failure = unavailable;
        }

        List<FlightLookupResult> found;
        try {
            found = fallback.lookup(flightNo, date);
        } catch (FlightLookupUnavailableException fallbackFailure) {
            if (failure != null) {
                fallbackFailure.addSuppressed(failure);
            }
            throw fallbackFailure;
        }

        // "Nobody knows this flight" is only true if both providers could be asked. If the
        // first one failed, the honest answer is that the lookup did not work.
        if (found.isEmpty() && failure != null) {
            throw failure;
        }
        return found;
    }
}
