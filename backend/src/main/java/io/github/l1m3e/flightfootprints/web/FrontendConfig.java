package io.github.l1m3e.flightfootprints.web;

import java.io.IOException;
import java.time.Duration;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

/**
 * Serves the built frontend, which the build puts into the jar under {@code static/}.
 *
 * <p>The frontend is a single page that does its own routing: {@code /map} or
 * {@code /flights/12/edit} are not files, they are addresses the page understands once it
 * is loaded. Opening or reloading such an address therefore has to return
 * {@code index.html}. Two kinds of address are kept out of that rule, because answering
 * them with a web page would hide a real problem: anything under {@code /api}, and
 * anything that looks like a file ({@code /assets/old-chunk.js}).
 */
@Configuration
class FrontendConfig implements WebMvcConfigurer {

    private static final String STATIC_FILES = "classpath:/static/";

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Vite names the files in assets/ after their content. A new build gives changed
        // files new names, so a browser may keep the ones it has for as long as it likes.
        registry.addResourceHandler("/assets/**")
                .addResourceLocations(STATIC_FILES + "assets/")
                .setCacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable());

        // index.html keeps its name across builds, so the browser has to ask every time
        // whether it changed; otherwise visitors would stay on an old version.
        registry.addResourceHandler("/**")
                .addResourceLocations(STATIC_FILES)
                .setCacheControl(CacheControl.noCache())
                // No caching of lookups: the cache has no size limit, and anyone could fill
                // it by requesting made-up addresses.
                .resourceChain(false)
                .addResolver(new FrontendRouteResolver());
    }

    /** Finds the requested file, or answers a frontend route with index.html. */
    static class FrontendRouteResolver extends PathResourceResolver {

        @Override
        protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource file = super.getResource(resourcePath, location);
            if (file != null) {
                return file;
            }
            return isFrontendRoute(resourcePath) ? super.getResource("index.html", location) : null;
        }

        static boolean isFrontendRoute(String path) {
            if (path.equals("api") || path.startsWith("api/")) {
                return false;
            }
            String lastSegment = path.substring(path.lastIndexOf('/') + 1);
            return !lastSegment.contains(".");
        }
    }
}
