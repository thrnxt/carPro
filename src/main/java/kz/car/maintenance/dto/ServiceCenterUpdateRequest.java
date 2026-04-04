package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ServiceCenterUpdateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    private String city;
    private String region;

    @NotNull
    private BigDecimal latitude;

    @NotNull
    private BigDecimal longitude;

    private String phoneNumber;
    private String email;
    private String website;
    private String description;
    private String licenseDocumentUrl;
    private String logoUrl;
}
