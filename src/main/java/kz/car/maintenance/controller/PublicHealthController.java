package kz.car.maintenance.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class PublicHealthController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Integer databaseCheck = jdbcTemplate.queryForObject("SELECT 1", Integer.class);

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "database", databaseCheck != null && databaseCheck == 1 ? "up" : "unknown"
        ));
    }
}
