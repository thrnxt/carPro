package kz.car.maintenance.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MileageUpdateRequest {

    /**
     * Текущий пробег автомобиля в км (подтверждённое значение).
     * Пользователь вводит вручную или после фото одометра.
     */
    @NotNull(message = "Пробег обязателен")
    @Min(value = 0, message = "Пробег не может быть отрицательным")
    private Long currentMileage;
}
