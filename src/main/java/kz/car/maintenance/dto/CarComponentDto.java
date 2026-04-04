package kz.car.maintenance.dto;

import kz.car.maintenance.model.CarComponent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CarComponentDto {
    private Long id;
    private String name;
    private String category;
    private String subcategory;
    private String icon;
    private String description;
    private Long maxMileage;
    private Integer maxMonths;
    private Double wearCoefficient;
    private Long currentMileage;
    private LocalDate lastReplacementDate;
    private Integer wearLevel;
    private CarComponent.ComponentStatus status;
}
