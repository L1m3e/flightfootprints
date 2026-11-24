package io.github.l1m3e.flightfootprints.lookup;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * The outside service could not be reached, rejected our key or answered with an error.
 * The browser gets 502, separate from "this flight does not exist" (404).
 */
public class FlightLookupUnavailableException extends ErrorResponseException {

    public FlightLookupUnavailableException(String detail, Throwable cause) {
        super(HttpStatus.BAD_GATEWAY, ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY, detail), cause);
    }
}
