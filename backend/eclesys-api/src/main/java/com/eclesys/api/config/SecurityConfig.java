package com.eclesys.api.config;

import com.eclesys.api.features.auth.JwtTokenService;
import com.eclesys.api.features.auth.RateLimitLoginFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

  @Bean
  public JwtAuthFilter jwtAuthFilter(JwtTokenService jwtTokenService) {
    return new JwtAuthFilter(jwtTokenService);
  }

  @Bean
  public SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthFilter jwtAuthFilter,
      RateLimitLoginFilter rateLimitLoginFilter
  ) throws Exception {

    return http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

        // ✅ NÃO desabilita anonymous aqui
        // .anonymous(anon -> anon.disable())

        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((request, response, authException) ->
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED)
            )
            .accessDeniedHandler((request, response, accessDeniedException) ->
                response.sendError(HttpServletResponse.SC_FORBIDDEN)
            )
        )

        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/error").permitAll()

            .requestMatchers(HttpMethod.POST, "/api/public/onboarding").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()

            .requestMatchers("/actuator/health", "/actuator/info").permitAll()
            .anyRequest().authenticated()
        )

        .addFilterBefore(rateLimitLoginFilter, UsernamePasswordAuthenticationFilter.class)

        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)

        .build();
  }
}
