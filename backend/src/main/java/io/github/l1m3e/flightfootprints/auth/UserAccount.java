package io.github.l1m3e.flightfootprints.auth;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;

@Table("users")
public record UserAccount(@Id Long id, String username, String passwordHash, Role role, @CreatedDate Instant createdAt) {

    /** Letters, digits, dot, underscore and hyphen; 3 to 32 characters. The database enforces the same rule. */
    public static final String USERNAME_PATTERN = "^[A-Za-z0-9_.-]{3,32}$";

    /** A new, not yet saved account. The id and creation time are filled in when it is saved. */
    public static UserAccount create(String username, String passwordHash, Role role) {
        return new UserAccount(null, username, passwordHash, role, null);
    }

    public UserAccount withCredentials(String newPasswordHash, Role newRole) {
        return new UserAccount(id, username, newPasswordHash, newRole, createdAt);
    }

    /** Leaves the password hash out, so an account that ends up in a log line reveals nothing useful. */
    @Override
    public String toString() {
        return "UserAccount[id=" + id + ", username=" + username + ", role=" + role + "]";
    }
}
