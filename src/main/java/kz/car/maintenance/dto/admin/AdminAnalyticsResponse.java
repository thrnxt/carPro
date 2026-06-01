package kz.car.maintenance.dto.admin;

import java.time.LocalDate;
import java.util.List;

public record AdminAnalyticsResponse(
        LocalDate dateFrom,
        LocalDate dateTo,
        AdminAnalyticsSummaryDto summary,
        List<AdminNamedMetricDto> topReplacedComponents,
        List<AdminNamedMetricDto> topCarBrands,
        List<AdminNamedMetricDto> regionActivity,
        List<AdminKeyCountDto> userRoleDistribution,
        List<AdminKeyCountDto> userStatusDistribution,
        List<AdminKeyCountDto> serviceStatusDistribution,
        List<AdminUserActivityReportRowDto> userActivityReport,
        List<AdminServiceActivityReportRowDto> serviceActivityReport
) {
}
