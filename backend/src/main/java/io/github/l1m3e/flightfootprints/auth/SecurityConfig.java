package io.github.l1m3e.flightfootprints.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.web.servlet.HandlerExceptionResolver;

@Configuration
class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver exceptionResolver) throws Exception {

        // Security filters run before Spring MVC, so their failures never reach a controller.
        // Passing them to MVC's exception resolver lets ApiExceptionHandler render them, and
        // every error of the API has the same ProblemDetail shape.
        AuthenticationEntryPoint notSignedIn =
                (request, response, exception) -> exceptionResolver.resolveException(request, response, null, exception);
        AccessDeniedHandler notAllowed =
                (request, response, exception) -> exceptionResolver.resolveException(request, response, null, exception);
        AuthenticationFailureHandler loginFailed =
                (request, response, exception) -> exceptionResolver.resolveException(request, response, null, exception);

        http
                // The first matching rule wins, so the order below matters.
                .authorizeHttpRequests(requests -> requests
                        // Everyone may read.
                        .requestMatchers(HttpMethod.GET, "/api/**").permitAll()
                        // A visitor has to be able to register and to sign in.
                        .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login").permitAll()
                        // Changing flights is for the administrator only. Being signed in is not
                        // enough, otherwise every registered account could edit the log.
                        .requestMatchers("/api/flights/**").hasRole(Role.ADMIN.name())
                        // Anything else under /api that is not a GET needs a signed-in user.
                        .requestMatchers("/api/**").authenticated()
                        // Everything outside /api is the single-page app itself.
                        .anyRequest().permitAll())

                // CSRF protection for a single-page app: the token travels in the XSRF-TOKEN
                // cookie, which the page's JavaScript copies into the X-XSRF-TOKEN header of
                // every POST, PUT and DELETE. Another site cannot read our cookie, so it
                // cannot produce that header.
                .csrf(csrf -> csrf.spa())

                // Form login without pages: the app posts username and password as a form
                // and gets a status code back, never a redirect to an HTML page.
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .successHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_NO_CONTENT))
                        .failureHandler(loginFailed))

                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .logoutSuccessHandler((request, response, authentication) ->
                                response.setStatus(HttpServletResponse.SC_NO_CONTENT)))

                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint(notSignedIn)
                        .accessDeniedHandler(notAllowed))

                // The default remembers the page a visitor wanted so it can redirect there
                // after login, which creates a session for every anonymous 401. The
                // single-page app does its own navigation and has no use for that.
                .requestCache(cache -> cache.disable());

        return http.build();
    }

    /**
     * Hashes with bcrypt and prefixes each hash with its algorithm ("{bcrypt}..."), so a
     * later move to a stronger algorithm does not invalidate the hashes already stored.
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }
}
