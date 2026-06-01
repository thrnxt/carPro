package kz.car.maintenance.repository.projection.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface AdminUserActivityReportRowView {
    Long getId();

    String getFirstName();

    String getLastName();

    String getEmail();

    String getRole();

    String getStatus();

    LocalDateTime getCreatedAt();

    Long getCarsCount();

    Long getBookingsCount();

    Long getMaintenanceRecordsCount();

    LocalDateTime getLastBookingAt();

    LocalDate getLastMaintenanceDate();
}
