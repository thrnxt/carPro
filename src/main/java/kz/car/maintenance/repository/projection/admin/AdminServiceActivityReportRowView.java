package kz.car.maintenance.repository.projection.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

public interface AdminServiceActivityReportRowView {
    Long getId();

    String getName();

    String getAccountEmail();

    String getRegion();

    String getStatus();

    LocalDateTime getCreatedAt();

    Long getBookingsCount();

    Long getCompletedWorksCount();

    LocalDateTime getLastBookingAt();

    LocalDate getLastCompletedServiceDate();
}
