package io.github.l1m3e.flightfootprints.web;

/**
 * One invalid field in a validation error response.
 *
 * @param field   name of the request field, e.g. {@code fromIata}
 * @param code    stable identifier of the rule that failed, e.g. {@code NotBlank}; the
 *                frontend uses it to show a message in the visitor's language
 * @param message English description, as a fallback
 */
public record FieldProblem(String field, String code, String message) {
}
