package kz.car.maintenance.dto;

import kz.car.maintenance.model.User;

public record ChatContactDto(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phoneNumber,
        String avatarUrl,
        User.UserRole role
) {
}
