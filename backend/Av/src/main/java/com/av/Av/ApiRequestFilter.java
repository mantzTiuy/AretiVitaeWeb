package com.av.Av;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class ApiRequestFilter extends OncePerRequestFilter {

    private final ApiRequestCounter counter;

    public ApiRequestFilter(ApiRequestCounter counter) {
        this.counter = counter;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        if (!request.getRequestURI().equals("/api/esp32/stats")) {
            counter.count(request.getMethod());
        }

        filterChain.doFilter(request, response);
    }
}