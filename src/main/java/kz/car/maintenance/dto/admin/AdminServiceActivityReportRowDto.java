package kz.car.maintenance.dto.admin;

import kz.car.maintenance.model.ServiceCenter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminServiceActivityReportRowDto(
        Long id,
        String name,
        String accountEmail,
        String region,
        ServiceCenter.ServiceCenterStatus status,
        LocalDateTime createdAt,
        long bookingsCount,
        long completedWorksCount,
        LocalDateTime lastBookingAt,
        LocalDate lastCompletedServiceDate
) {
}
