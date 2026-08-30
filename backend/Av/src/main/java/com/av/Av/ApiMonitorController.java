package com.av.Av;

import com.av.Av.ApiRequestCounter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/esp32")
public class ApiMonitorController {

    private final ApiRequestCounter counter;

    public ApiMonitorController(ApiRequestCounter counter) {
        this.counter = counter;
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {

        Map<String, Long> stats = new LinkedHashMap<>();

        stats.put("GET", counter.getGet());
        stats.put("POST", counter.getPost());
        stats.put("PUT", counter.getPut());

        return stats;
    }

    @PostMapping("/reset")
    public Map<String, String> resetStats() {

        counter.reset();

        Map<String, String> response = new LinkedHashMap<>();
        response.put("status", "reset");

        return response;
    }
}