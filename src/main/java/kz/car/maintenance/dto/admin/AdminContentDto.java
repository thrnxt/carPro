package kz.car.maintenance.dto.admin;

import kz.car.maintenance.model.EducationalContent;

import java.time.LocalDateTime;

public record AdminContentDto(
        Long id,
        String title,
        String content,
        EducationalContent.ContentType type,
        String videoUrl,
        String imageUrl,
        String category,
        String provider,
        String difficulty,
        Integer durationMinutes,
        Integer sortOrder,
        EducationalContent.ContentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AdminContentDto from(EducationalContent content) {
        return new AdminContentDto(
                content.getId(),
                content.getTitle(),
                content.getContent(),
                content.getType(),
                content.getVideoUrl(),
                content.getImageUrl(),
                content.getCategory(),
                content.getProvider(),
                content.getDifficulty(),
                content.getDurationMinutes(),
                content.getSortOrder(),
                content.getStatus(),
                content.getCreatedAt(),
                content.getUpdatedAt()
        );
    }
}
