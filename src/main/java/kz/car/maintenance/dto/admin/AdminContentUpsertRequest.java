package kz.car.maintenance.dto.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kz.car.maintenance.model.EducationalContent;
import lombok.Data;

@Data
public class AdminContentUpsertRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotNull
    private EducationalContent.ContentType type;

    private String videoUrl;

    private String imageUrl;

    @NotBlank
    private String category;

    private String provider;

    private String difficulty;

    @Min(0)
    private Integer durationMinutes;

    @Min(0)
    private Integer sortOrder;

    @NotNull
    private EducationalContent.ContentStatus status;
}
