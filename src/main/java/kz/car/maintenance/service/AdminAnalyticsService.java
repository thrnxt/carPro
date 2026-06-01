package kz.car.maintenance.service;

import kz.car.maintenance.dto.admin.AdminAnalyticsResponse;
import kz.car.maintenance.dto.admin.AdminAnalyticsSummaryDto;
import kz.car.maintenance.dto.admin.AdminKeyCountDto;
import kz.car.maintenance.dto.admin.AdminNamedMetricDto;
import kz.car.maintenance.dto.admin.AdminServiceActivityReportRowDto;
import kz.car.maintenance.dto.admin.AdminUserActivityReportRowDto;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.BookingRepository;
import kz.car.maintenance.repository.MaintenanceRecordRepository;
import kz.car.maintenance.repository.ReplacedComponentRepository;
import kz.car.maintenance.repository.ServiceCenterRepository;
import kz.car.maintenance.repository.UserRepository;
import kz.car.maintenance.repository.projection.admin.AdminKeyCountView;
import kz.car.maintenance.repository.projection.admin.AdminLabeledCountView;
import kz.car.maintenance.repository.projection.admin.AdminServiceActivityReportRowView;
import kz.car.maintenance.repository.projection.admin.AdminUserActivityReportRowView;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminAnalyticsService {

    private static final int DEFAULT_CHART_LIMIT = 8;
    private static final LocalDate DEFAULT_DATE_FROM = LocalDate.of(1970, 1, 1);
    private static final LocalDate DEFAULT_DATE_TO = LocalDate.of(2999, 12, 31);

    private final UserRepository userRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final BookingRepository bookingRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final ReplacedComponentRepository replacedComponentRepository;

    public AdminAnalyticsResponse getAnalytics(LocalDate dateFrom, LocalDate dateTo) {
        validateDateRange(dateFrom, dateTo);

        LocalDate effectiveDateFrom = dateFrom != null ? dateFrom : DEFAULT_DATE_FROM;
        LocalDate effectiveDateTo = dateTo != null ? dateTo : DEFAULT_DATE_TO;
        LocalDateTime effectiveDateFromDateTime = effectiveDateFrom.atStartOfDay();
        LocalDateTime effectiveDateToExclusive = effectiveDateTo.plusDays(1).atStartOfDay();

        List<AdminUserActivityReportRowDto> userActivityReport = userRepository.findUserActivityReport(
                effectiveDateFromDateTime,
                effectiveDateToExclusive,
                effectiveDateFrom,
                effectiveDateTo
        ).stream().map(this::mapUserActivityRow).toList();

        List<AdminServiceActivityReportRowDto> serviceActivityReport = serviceCenterRepository.findServiceActivityReport(
                effectiveDateFromDateTime,
                effectiveDateToExclusive,
                effectiveDateFrom,
                effectiveDateTo
        ).stream().map(this::mapServiceActivityRow).toList();

        AdminAnalyticsSummaryDto summary = new AdminAnalyticsSummaryDto(
                userRepository.count(),
                userRepository.countUsersCreatedWithin(effectiveDateFromDateTime, effectiveDateToExclusive),
                userRepository.countUsersWithActivity(effectiveDateFromDateTime, effectiveDateToExclusive, effectiveDateFrom, effectiveDateTo),
                serviceCenterRepository.count(),
                bookingRepository.countAllWithin(effectiveDateFromDateTime, effectiveDateToExclusive),
                maintenanceRecordRepository.countCompletedWithin(effectiveDateFrom, effectiveDateTo)
        );

        return new AdminAnalyticsResponse(
                dateFrom,
                dateTo,
                summary,
                limitMetrics(replacedComponentRepository.findTopReplacedComponents(effectiveDateFrom, effectiveDateTo)),
                limitMetrics(maintenanceRecordRepository.findTopServicedBrands(effectiveDateFrom, effectiveDateTo)),
                limitMetrics(maintenanceRecordRepository.findRegionActivity(effectiveDateFrom, effectiveDateTo)),
                mapKeyCounts(userRepository.countUsersByRole()),
                mapKeyCounts(userRepository.countUsersByStatus()),
                mapKeyCounts(serviceCenterRepository.countServiceCentersByStatus()),
                userActivityReport,
                serviceActivityReport
        );
    }

    private void validateDateRange(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new BadRequestException("dateFrom must be before or equal to dateTo");
        }
    }

    private List<AdminNamedMetricDto> limitMetrics(List<AdminLabeledCountView> rows) {
        return rows.stream()
                .limit(DEFAULT_CHART_LIMIT)
                .map(row -> new AdminNamedMetricDto(
                        row.getLabel(),
                        row.getSecondaryLabel(),
                        row.getCount() != null ? row.getCount() : 0L
                ))
                .toList();
    }

    private List<AdminKeyCountDto> mapKeyCounts(List<AdminKeyCountView> rows) {
        return rows.stream()
                .map(row -> new AdminKeyCountDto(row.getKey(), row.getCount() != null ? row.getCount() : 0L))
                .toList();
    }

    private AdminUserActivityReportRowDto mapUserActivityRow(AdminUserActivityReportRowView row) {
        return new AdminUserActivityReportRowDto(
                row.getId(),
                buildFullName(row.getFirstName(), row.getLastName()),
                row.getEmail(),
                User.UserRole.valueOf(row.getRole()),
                User.UserStatus.valueOf(row.getStatus()),
                row.getCreatedAt(),
                valueOrZero(row.getCarsCount()),
                valueOrZero(row.getBookingsCount()),
                valueOrZero(row.getMaintenanceRecordsCount()),
                row.getLastBookingAt(),
                row.getLastMaintenanceDate()
        );
    }

    private AdminServiceActivityReportRowDto mapServiceActivityRow(AdminServiceActivityReportRowView row) {
        return new AdminServiceActivityReportRowDto(
                row.getId(),
                row.getName(),
                row.getAccountEmail(),
                row.getRegion(),
                ServiceCenter.ServiceCenterStatus.valueOf(row.getStatus()),
                row.getCreatedAt(),
                valueOrZero(row.getBookingsCount()),
                valueOrZero(row.getCompletedWorksCount()),
                row.getLastBookingAt(),
                row.getLastCompletedServiceDate()
        );
    }

    private long valueOrZero(Long value) {
        return value != null ? value : 0L;
    }

    private String buildFullName(String firstName, String lastName) {
        return (firstName + " " + lastName).trim();
    }
}
