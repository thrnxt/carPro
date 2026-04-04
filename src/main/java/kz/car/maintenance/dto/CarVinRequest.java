package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CarVinRequest {
    @NotBlank
    private String vin;
}
