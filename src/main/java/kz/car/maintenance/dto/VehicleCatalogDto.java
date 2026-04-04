package kz.car.maintenance.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class VehicleCatalogDto {
    private String vin;
    private String brand;
    private String model;
    private Integer year;
    private String color;
    private String licensePlate;
    private Long mileage;
}
