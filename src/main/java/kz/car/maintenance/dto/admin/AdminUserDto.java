package kz.car.maintenance.dto.admin;

import kz.car.maintenance.model.User;

import java.time.LocalDateTime;

public record AdminUserDto(
        Long id,
        String email,
        String firstName,
        String lastName,
        User.UserRole role,
        User.UserStatus status,
        LocalDateTime createdAt,
        boolean hasServiceCenterProfile
) {
    public static AdminUserDto from(User user) {
        return new AdminUserDto(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getServiceCenter() != null
        );
    }
}
