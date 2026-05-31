package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import kz.car.maintenance.model.Car;
import lombok.Data;

@Data
public class CarVinRequest {
    @NotBlank
    private String vin;

    // Тип авто, выбранный пользователем в модалке при добавлении.
    private Car.PowertrainType powertrainType;

    private Car.TransmissionType transmissionType;

    private Car.DrivetrainType drivetrainType;
}
