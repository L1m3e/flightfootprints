package io.github.l1m3e.flightfootprints.lookup;

import io.github.l1m3e.flightfootprints.web.FieldValidationException;

/**
 * AeroDataBox only answers for dates within a year of today. Inside the application this
 * is the signal to ask ADSBDB instead (see {@link FallbackFlightLookupProvider}), so a
 * browser does not normally see it. It is shaped like any other invalid field in case it
 * does: the caller can fix it by choosing another date.
 */
class FlightLookupDateRangeException extends FieldValidationException {

    FlightLookupDateRangeException() {
        super("date", "OutOfRange", "AeroDataBox only knows dates within 365 days of today.");
    }
}
