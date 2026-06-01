package kz.car.maintenance.dto.admin;

public record AdminNamedMetricDto(
        String label,
        String secondaryLabel,
        long count
) {
}
