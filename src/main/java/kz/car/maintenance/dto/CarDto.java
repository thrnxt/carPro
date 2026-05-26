package kz.car.maintenance.dto;

import kz.car.maintenance.model.Car;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    private Car.DrivingStyle drivingStyle;
    private LocalDate lastServiceDate;
    private String imageUrl;
    private Long ownerId;

    // ─── Трекинг пробега ──────────────────────────────────────────────────────

    /** Подтверждённый пробег (введён пользователем) */
    private Long mileage;

    /** Расчётный текущий пробег (обновляется ежедневно шедуллером) */
    private Long estimatedMileage;

    /**
     * Лучшая оценка пробега для отображения:
     * estimatedMileage если есть, иначе mileage
     */
    private Long displayMileage;

    /**
     * true = displayMileage приблизительный, показывать «~» на UI.
     * false = пользователь недавно подтвердил пробег.
     */
    private Boolean mileageIsEstimated;

    /** Как часто пользователь ездит (RARELY / NORMAL / ACTIVE / null если не задано) */
    private Car.DrivingFrequency drivingFrequency;

    /** Когда пользователь последний раз подтверждал пробег */
    private LocalDateTime confirmedMileageAt;

    /** Нужно ли показывать модальное окно «Как часто вы ездите?» */
    private Boolean needsDrivingFrequencySetup;
}
