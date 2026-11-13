package io.github.l1m3e.flightfootprints.web;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * The one place that turns exceptions into HTTP responses. Everything is answered as an
 * RFC 9457 problem document. The base class already covers Spring MVC's own exceptions
 * (unknown path, wrong method, unreadable JSON, ...); this class adds the rest.
 */
@RestControllerAdvice
class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    /** A request body that failed its Bean Validation annotations: say which fields and why. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        List<FieldProblem> problems = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new FieldProblem(error.getField(), error.getCode(), error.getDefaultMessage()))
                .toList();
        ProblemDetail body = FieldValidationException.validationProblem(problems);
        return handleExceptionInternal(exception, body, headers, status, request);
    }

    /** Not signed in, or the sign-in itself failed. Reaches this class through SecurityConfig. */
    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail handleAuthentication(AuthenticationException exception) {
        // The same words for "no such user" and "wrong password": the answer must not
        // reveal which usernames exist.
        String detail = exception instanceof BadCredentialsException
                ? "Invalid username or password."
                : "You need to sign in to do this.";
        return ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
    }

    /** Signed in but not allowed, or a request without a valid CSRF token. */
    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail handleAccessDenied(AccessDeniedException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "You are not allowed to do this.");
    }
}
