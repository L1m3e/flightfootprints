package io.github.l1m3e.flightfootprints.lookup;

import io.github.l1m3e.flightfootprints.web.FieldValidationException;

/**
 * AeroDataBox only answers for dates within a year of today. Reported like any other
 * invalid field, because the caller can fix it by choosing another date.
 */
class FlightLookupDateRangeException extends FieldValidationException {

    FlightLookupDateRangeException() {
        super("date", "OutOfRange", "AeroDataBox only looks 365 days around today; clear its API key to use ADSBDB for older flights.");
    }
}
