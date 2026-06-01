package kz.car.maintenance.dto.admin;

import kz.car.maintenance.model.User;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminUserActivityReportRowDto(
        Long id,
        String fullName,
        String email,
        User.UserRole role,
        User.UserStatus status,
        LocalDateTime createdAt,
        long carsCount,
        long bookingsCount,
        long maintenanceRecordsCount,
        LocalDateTime lastBookingAt,
        LocalDate lastMaintenanceDate
) {
}
