package io.github.l1m3e.flightfootprints.auth;

public enum Role {

    /** The site owner: the only account that may add, change or delete flights. */
    ADMIN,

    /** Anyone who registered. Can sign in but sees the same read-only site as a visitor. */
    USER
}
