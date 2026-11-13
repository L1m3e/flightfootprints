package io.github.l1m3e.flightfootprints.auth;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Tells Spring Security how to find an account. Spring Security then compares the
 * submitted password with the stored hash itself; this class never sees the password.
 */
@Service
class DatabaseUserDetailsService implements UserDetailsService {

    private final UserAccountRepository users;

    DatabaseUserDetailsService(UserAccountRepository users) {
        this.users = users;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        UserAccount account = users.findByUsername(username.strip())
                .orElseThrow(() -> new UsernameNotFoundException("No account with that username"));
        // roles("ADMIN") becomes the authority "ROLE_ADMIN", which hasRole("ADMIN") checks for.
        return User.withUsername(account.username())
                .password(account.passwordHash())
                .roles(account.role().name())
                .build();
    }
}
