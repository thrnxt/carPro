package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotNull;
import kz.car.maintenance.model.Car;
import lombok.Data;

@Data
public class DrivingFrequencyRequest {

    /**
     * Как часто пользователь использует автомобиль.
     * Определяет скорость накопления расчётного пробега.
     *
     * RARELY  → ~500 км/мес (магазин, иногда в гости)
     * NORMAL  → ~1 500 км/мес (работа, поездки по городу)
     * ACTIVE  → ~3 000 км/мес (командировки, трассы, доставка)
     */
    @NotNull(message = "Необходимо выбрать частоту использования авто")
    private Car.DrivingFrequency drivingFrequency;
}
