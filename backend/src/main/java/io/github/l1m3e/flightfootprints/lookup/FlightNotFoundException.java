package io.github.l1m3e.flightfootprints.lookup;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** The provider answered, and knew no flight with this number (or no route we can use). */
public class FlightNotFoundException extends ErrorResponseException {

    public FlightNotFoundException(String detail) {
        super(HttpStatus.NOT_FOUND, ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detail), null);
    }
}
