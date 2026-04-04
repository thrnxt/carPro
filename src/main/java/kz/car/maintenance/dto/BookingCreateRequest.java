package kz.car.maintenance.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingCreateRequest {
    
    @NotNull(message = "Car ID is required")
    private Long carId;
    
    @NotNull(message = "Service center ID is required")
    private Long serviceCenterId;
    
    @NotNull(message = "Booking date and time is required")
    @Future(message = "Booking date must be in the future")
    private LocalDateTime bookingDateTime;
    
    private String description; // Описание проблемы/работы
    
    @NotBlank(message = "Contact phone is required")
    private String contactPhone; // Контактный телефон
}
