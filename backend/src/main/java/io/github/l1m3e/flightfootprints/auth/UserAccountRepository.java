package io.github.l1m3e.flightfootprints.auth;

import java.util.Optional;

import org.springframework.data.jdbc.repository.query.Modifying;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.ListCrudRepository;

public interface UserAccountRepository extends ListCrudRepository<UserAccount, Long> {

    /** Case-insensitive lookup, matching the unique index on lower(username). */
    @Query("SELECT * FROM users WHERE lower(username) = lower(:username)")
    Optional<UserAccount> findByUsername(String username);

    @Modifying
    @Query("UPDATE users SET role = 'USER' WHERE role = 'ADMIN' AND lower(username) <> lower(:username)")
    int demoteAdminsOtherThan(String username);

    @Modifying
    @Query("UPDATE users SET role = 'USER' WHERE role = 'ADMIN'")
    int demoteAllAdmins();
}
