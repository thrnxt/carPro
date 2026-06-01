package kz.car.maintenance.dto.admin;

public record AdminAnalyticsSummaryDto(
        long totalUsers,
        long newUsersInPeriod,
        long activeUsersInPeriod,
        long totalServiceCenters,
        long bookingsInPeriod,
        long completedWorksInPeriod
) {
}
