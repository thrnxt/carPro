package kz.car.maintenance.dto.admin;

import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;

import java.time.LocalDateTime;

public record AdminServiceCenterDto(
        Long id,
        String name,
        String city,
        String region,
        String address,
        String phoneNumber,
        String email,
        String website,
        String description,
        String licenseNumber,
        String licenseDocumentUrl,
        ServiceCenter.ServiceCenterStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        String accountEmail,
        User.UserStatus accountStatus
) {
    public static AdminServiceCenterDto from(ServiceCenter serviceCenter) {
        User user = serviceCenter.getUser();
        return new AdminServiceCenterDto(
                serviceCenter.getId(),
                serviceCenter.getName(),
                serviceCenter.getCity(),
                serviceCenter.getRegion(),
                serviceCenter.getAddress(),
                serviceCenter.getPhoneNumber(),
                serviceCenter.getEmail(),
                serviceCenter.getWebsite(),
                serviceCenter.getDescription(),
                serviceCenter.getLicenseNumber(),
                serviceCenter.getLicenseDocumentUrl(),
                serviceCenter.getStatus(),
                serviceCenter.getCreatedAt(),
                serviceCenter.getUpdatedAt(),
                user != null ? user.getEmail() : null,
                user != null ? user.getStatus() : null
        );
    }
}
