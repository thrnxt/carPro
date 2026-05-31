package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import kz.car.maintenance.model.Car;
import lombok.Data;

@Data
public class CarCreateRequest {
    @NotBlank
    private String brand;
    
    @NotBlank
    private String model;
    
    @NotNull
    private Integer year;
    
    private String vin;
    
    @NotBlank
    private String licensePlate;
    
    private String color;

    @NotNull
    private Long mileage;

    private Car.DrivingStyle drivingStyle;

    // Тип авто — определяет набор деталей. Необязательны для обратной совместимости
    // (старые клиенты / редактирование), но фронт всегда присылает их при создании.
    private Car.PowertrainType powertrainType;

    private Car.TransmissionType transmissionType;

    private Car.DrivetrainType drivetrainType;
}
