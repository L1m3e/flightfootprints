package io.github.l1m3e.flightfootprints.web;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/**
 * For validation that annotations cannot express, such as "this airport code must exist".
 * Produces the same response shape as a failed Bean Validation check.
 */
public class FieldValidationException extends ErrorResponseException {

    public FieldValidationException(String field, String code, String message) {
        this(List.of(new FieldProblem(field, code, message)));
    }

    public FieldValidationException(List<FieldProblem> problems) {
        super(HttpStatus.BAD_REQUEST, validationProblem(problems), null);
    }

    /** The 400 body shared by every kind of validation failure. */
    static ProblemDetail validationProblem(List<FieldProblem> problems) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "One or more fields are invalid.");
        problem.setTitle("Validation failed");
        problem.setProperty("errors", problems);
        return problem;
    }
}
