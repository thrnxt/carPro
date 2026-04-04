package kz.car.maintenance.controller;

import kz.car.maintenance.dto.CarSummaryDto;
import kz.car.maintenance.dto.CarComponentDto;
import kz.car.maintenance.dto.ServiceCenterClientDto;
import kz.car.maintenance.model.MaintenanceRecord;
import kz.car.maintenance.model.ServiceCenterClient;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.MaintenanceRecordService;
import kz.car.maintenance.service.ServiceCenterClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/service-center-clients")
@RequiredArgsConstructor
public class ServiceCenterClientController {

    private final ServiceCenterClientService serviceCenterClientService;
    private final MaintenanceRecordService maintenanceRecordService;

    @GetMapping("/my")
    public ResponseEntity<List<ServiceCenterClientDto>> getMyClients(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(serviceCenterClientService.getMyClients(user.getId()));
    }

    @PatchMapping("/{clientId}/status")
    public ResponseEntity<ServiceCenterClientDto> updateClientStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long clientId,
            @RequestParam ServiceCenterClient.ClientStatus status
    ) {
        return ResponseEntity.ok(serviceCenterClientService.updateClientStatus(user.getId(), clientId, status));
    }

    @GetMapping("/{clientId}/cars")
    public ResponseEntity<List<CarSummaryDto>> getClientCars(
            @AuthenticationPrincipal User user,
            @PathVariable Long clientId
    ) {
        return ResponseEntity.ok(serviceCenterClientService.getClientCars(user.getId(), clientId));
    }

    @GetMapping("/{clientId}/cars/{carId}/operations")
    public ResponseEntity<List<MaintenanceRecord>> getClientCarOperations(
            @AuthenticationPrincipal User user,
            @PathVariable Long clientId,
            @PathVariable Long carId
    ) {
        // На уровне сервиса доступ уже ограничен текущим сервис-центром.
        List<MaintenanceRecord> operations = maintenanceRecordService.getMyServiceCenterOperationsByCar(user.getId(), carId);
        operations = operations.stream()
                .filter(record -> record.getCar() != null
                        && record.getCar().getOwner() != null
                        && record.getCar().getOwner().getId().equals(clientId))
                .toList();
        return ResponseEntity.ok(operations);
    }

    @GetMapping("/{clientId}/cars/{carId}/components")
    public ResponseEntity<List<CarComponentDto>> getClientCarComponents(
            @AuthenticationPrincipal User user,
            @PathVariable Long clientId,
            @PathVariable Long carId
    ) {
        return ResponseEntity.ok(serviceCenterClientService.getClientCarComponents(user.getId(), clientId, carId));
    }
}
