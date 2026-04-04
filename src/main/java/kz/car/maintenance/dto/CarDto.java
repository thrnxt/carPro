package kz.car.maintenance.dto;

import kz.car.maintenance.model.Car;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarDto {
    private Long id;
    private String brand;
    private String model;
    private Integer year;
    private String vin;
    private String licensePlate;
    private String color;
    private Long mileage;
    private Car.DrivingStyle drivingStyle;
    private LocalDate lastServiceDate;
    private String imageUrl;
    private Long ownerId;
}
