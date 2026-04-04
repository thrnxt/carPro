package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRecordCreateRequest {
    
    @NotNull(message = "Car ID is required")
    private Long carId;
    
    private Long serviceCenterId; // Опционально - можно обслуживать без сервисного центра
    
    @NotBlank(message = "Work type is required")
    private String workType; // Тип работ: "ТО", "Ремонт", "Диагностика", "Замена деталей" и т.д.
    
    private String description; // Описание выполненных работ
    
    @NotNull(message = "Service date is required")
    private LocalDate serviceDate; // Дата обслуживания
    
    @NotNull(message = "Mileage at service is required")
    private Long mileageAtService; // Пробег на момент обслуживания
    
    private Double cost; // Стоимость обслуживания (опционально)
}
