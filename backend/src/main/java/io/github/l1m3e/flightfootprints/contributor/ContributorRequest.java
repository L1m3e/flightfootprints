package io.github.l1m3e.flightfootprints.contributor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * What the form sends to add or change a contributor.
 *
 * @param link must start with http:// or https://. The page turns it into a link, and
 *             anything else ("javascript:...") could run code in a visitor's browser.
 */
public record ContributorRequest(
        @NotBlank @Size(max = 60) String name,
        @Size(max = 200) @Pattern(regexp = ContributorRequest.WEB_ADDRESS) String link,
        @Size(max = 200) String note) {

    static final String WEB_ADDRESS = "^https?://\\S+$";

    /** Surrounding spaces go, and an optional field that was left empty becomes null. */
    public ContributorRequest {
        name = trimToNull(name);
        link = trimToNull(link);
        note = trimToNull(note);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.strip();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
