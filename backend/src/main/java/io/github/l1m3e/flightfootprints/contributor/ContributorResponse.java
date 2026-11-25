package io.github.l1m3e.flightfootprints.contributor;

/** A contributor as the API returns it. */
public record ContributorResponse(long id, String name, String link, String note) {

    static ContributorResponse of(Contributor contributor) {
        return new ContributorResponse(contributor.id(), contributor.name(), contributor.link(), contributor.note());
    }
}
