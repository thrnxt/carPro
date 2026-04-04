package kz.car.maintenance.dto;

import kz.car.maintenance.model.ServiceCenterClient;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class ServiceCenterClientDto {
    private Long clientId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private ServiceCenterClient.ClientStatus status;
    private Integer totalVisits;
    private LocalDate lastServiceDate;
    private Integer carsCount;
}
