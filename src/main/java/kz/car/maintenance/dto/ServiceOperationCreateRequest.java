package kz.car.maintenance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class ServiceOperationCreateRequest {

    @NotNull
    private Long carId;

    @NotBlank
    private String workType;

    private String description;

    @NotNull
    private LocalDate serviceDate;

    @NotNull
    private Long mileageAtService;

    private Double cost;

    @Valid
    private List<ReplacedPartRequest> replacedParts = new ArrayList<>();

    @Valid
    private List<OperationPhotoRequest> photos = new ArrayList<>();

    @Data
    public static class ReplacedPartRequest {
        @NotNull
        private Long componentId;
        private String partNumber;
        private String manufacturer;
    }

    @Data
    public static class OperationPhotoRequest {
        @NotBlank
        private String fileUrl;
        private String description;
    }
}
