package kz.car.maintenance.service;

import kz.car.maintenance.dto.admin.AdminReportType;
import kz.car.maintenance.dto.admin.AdminServiceActivityReportRowDto;
import kz.car.maintenance.dto.admin.AdminUserActivityReportRowDto;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminCsvExportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] exportUserActivity(List<AdminUserActivityReportRowDto> rows) {
        List<String> headers = List.of(
                "ID",
                "Full name",
                "Email",
                "Role",
                "Status",
                "Created at",
                "Cars",
                "Bookings in period",
                "Maintenance records in period",
                "Last booking",
                "Last maintenance"
        );

        List<List<String>> csvRows = rows.stream().map(row -> List.of(
                String.valueOf(row.id()),
                row.fullName(),
                row.email(),
                row.role().name(),
                row.status().name(),
                formatDateTime(row.createdAt()),
                String.valueOf(row.carsCount()),
                String.valueOf(row.bookingsCount()),
                String.valueOf(row.maintenanceRecordsCount()),
                formatDateTime(row.lastBookingAt()),
                formatDate(row.lastMaintenanceDate())
        )).toList();

        return toCsvBytes(headers, csvRows);
    }

    public byte[] exportServiceActivity(List<AdminServiceActivityReportRowDto> rows) {
        List<String> headers = List.of(
                "ID",
                "Service center",
                "Account email",
                "Region",
                "Status",
                "Created at",
                "Bookings in period",
                "Completed works in period",
                "Last booking",
                "Last completed work"
        );

        List<List<String>> csvRows = rows.stream().map(row -> List.of(
                String.valueOf(row.id()),
                row.name(),
                safe(row.accountEmail()),
                safe(row.region()),
                row.status().name(),
                formatDateTime(row.createdAt()),
                String.valueOf(row.bookingsCount()),
                String.valueOf(row.completedWorksCount()),
                formatDateTime(row.lastBookingAt()),
                formatDate(row.lastCompletedServiceDate())
        )).toList();

        return toCsvBytes(headers, csvRows);
    }

    public String buildFilename(AdminReportType reportType, LocalDate dateFrom, LocalDate dateTo) {
        String suffix = dateFrom != null || dateTo != null
                ? "-" + safeDate(dateFrom) + "_to_" + safeDate(dateTo)
                : "-all-time";
        return switch (reportType) {
            case USER_ACTIVITY -> "user-activity-report" + suffix + ".csv";
            case SERVICE_ACTIVITY -> "service-activity-report" + suffix + ".csv";
        };
    }

    private byte[] toCsvBytes(List<String> headers, List<List<String>> rows) {
        List<String> lines = new ArrayList<>();
        lines.add(String.join(",", headers.stream().map(this::escape).toList()));
        for (List<String> row : rows) {
            lines.add(String.join(",", row.stream().map(this::escape).toList()));
        }

        String csv = "\uFEFF" + String.join("\r\n", lines);
        return csv.getBytes(StandardCharsets.UTF_8);
    }

    private String escape(String value) {
        String safeValue = safe(value);
        boolean shouldQuote = safeValue.contains(",") || safeValue.contains("\"") || safeValue.contains("\n") || safeValue.contains("\r");
        String normalized = safeValue.replace("\"", "\"\"");
        return shouldQuote ? "\"" + normalized + "\"" : normalized;
    }

    private String safe(String value) {
        return value != null ? value : "";
    }

    private String formatDate(LocalDate value) {
        return value != null ? DATE_FORMATTER.format(value) : "";
    }

    private String formatDateTime(LocalDateTime value) {
        return value != null ? DATE_TIME_FORMATTER.format(value) : "";
    }

    private String safeDate(LocalDate value) {
        return value != null ? DATE_FORMATTER.format(value) : "start";
    }
}
