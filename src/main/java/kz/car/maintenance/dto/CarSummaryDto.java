package kz.car.maintenance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CarSummaryDto {
    private Long id;
    private String brand;
    private String model;
    private Integer year;
    private String licensePlate;
    private Long mileage;
}
