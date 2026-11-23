package io.github.l1m3e.flightfootprints.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

/**
 * How the settings are read from the environment. This uses Spring Boot's binder on its
 * own, the same one the running application uses, without starting the application.
 */
class AuthPropertiesTests {

    private static AuthProperties bind(Map<String, String> settings) {
        return new Binder(new MapConfigurationPropertySource(settings)).bind("app.auth", AuthProperties.class).get();
    }

    @Test
    void aCommaSeparatedSettingBecomesOneEntryPerAdministrator() {
        AuthProperties properties = bind(Map.of(
                "app.auth.admin-username", "captain",
                "app.auth.admin-password", "a-long-password",
                "app.auth.additional-admins", "amy:first-long-password,ben:second-long-password"));

        assertThat(properties.additionalAdmins()).containsExactly("amy:first-long-password", "ben:second-long-password");
    }

    @Test
    void anEmptySettingMeansNoAdditionalAdministrators() {
        // What ${ADDITIONAL_ADMINS:} in application.yaml turns into when the variable is not set.
        AuthProperties properties = bind(Map.of(
                "app.auth.admin-username", "captain",
                "app.auth.admin-password", "a-long-password",
                "app.auth.additional-admins", ""));

        assertThat(properties.additionalAdmins()).isEmpty();
        assertThat(properties.registrationEnabled()).isTrue();
    }

    @Test
    void leavingTheSettingOutMeansTheSame() {
        AuthProperties properties = bind(Map.of("app.auth.admin-username", "captain"));

        assertThat(properties.additionalAdmins()).isEmpty();
        assertThat(properties.adminPassword()).isEmpty();
    }
}
