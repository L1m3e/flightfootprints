package io.github.l1m3e.flightfootprints.auth;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Settings under {@code app.auth}. application.yaml fills them from the environment
 * variables ADMIN_USERNAME, ADMIN_PASSWORD, ADDITIONAL_ADMINS and REGISTRATION_ENABLED.
 *
 * @param adminUsername       the administrator's username, blank when none is configured
 * @param adminPassword       the administrator's password in plain text; only its hash is stored
 * @param additionalAdmins    further administrators, each written as {@code username:password}
 * @param registrationEnabled whether visitors may create accounts
 */
@ConfigurationProperties("app.auth")
public record AuthProperties(String adminUsername, String adminPassword, List<String> additionalAdmins,
        @DefaultValue("true") boolean registrationEnabled) {

    public AuthProperties {
        adminUsername = adminUsername == null ? "" : adminUsername.strip();
        adminPassword = adminPassword == null ? "" : adminPassword;
        additionalAdmins = additionalAdmins == null ? List.of() : List.copyOf(additionalAdmins);
    }

    /** Hides the passwords: records print every component by default. */
    @Override
    public String toString() {
        return "AuthProperties[adminUsername=" + adminUsername + ", adminPassword=<hidden>, additionalAdmins=<"
                + additionalAdmins.size() + " hidden>, registrationEnabled=" + registrationEnabled + "]";
    }
}
