package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.PagedResponse;
import kz.car.maintenance.dto.MaintenanceRecordCreateRequest;
import kz.car.maintenance.dto.ServiceOperationCreateRequest;
import kz.car.maintenance.model.MaintenanceRecord;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.MaintenanceRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/maintenance-records")
@RequiredArgsConstructor
public class MaintenanceRecordController {
    
    private final MaintenanceRecordService maintenanceRecordService;
    
    @PostMapping
    public ResponseEntity<MaintenanceRecord> createMaintenanceRecord(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody MaintenanceRecordCreateRequest request) {
        return ResponseEntity.ok(maintenanceRecordService.createMaintenanceRecord(
                user.getId(),
                request.getCarId(),
                request.getServiceCenterId(),
                request.getWorkType(),
                request.getDescription(),
                request.getServiceDate(),
                request.getMileageAtService(),
                request.getCost()));
    }
    
    @GetMapping("/car/{carId}")
    public ResponseEntity<List<MaintenanceRecord>> getCarMaintenanceHistory(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId) {
        return ResponseEntity.ok(maintenanceRecordService.getCarMaintenanceHistory(carId, user.getId()));
    }
    
    @PostMapping("/{id}/replace-component")
    public ResponseEntity<Void> replaceComponent(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam Long componentId,
            @RequestParam(required = false) String partNumber,
            @RequestParam(required = false) String manufacturer) {
        maintenanceRecordService.replaceComponent(id, componentId, partNumber, manufacturer, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/service-center")
    public ResponseEntity<MaintenanceRecord> createServiceOperation(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ServiceOperationCreateRequest request) {
        return ResponseEntity.ok(maintenanceRecordService.createServiceOperation(user.getId(), request));
    }

    @GetMapping("/service-center/my")
    public ResponseEntity<List<MaintenanceRecord>> getMyServiceCenterOperations(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(maintenanceRecordService.getMyServiceCenterOperations(user.getId()));
    }

    @GetMapping("/service-center/my/search")
    public ResponseEntity<PagedResponse<MaintenanceRecord>> searchMyServiceCenterOperations(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) MaintenanceRecord.RecordStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return ResponseEntity.ok(maintenanceRecordService.searchMyServiceCenterOperations(
                user.getId(),
                page,
                size,
                query,
                clientId,
                status,
                dateFrom,
                dateTo
        ));
    }

    @GetMapping("/service-center/my/client/{clientId}")
    public ResponseEntity<List<MaintenanceRecord>> getMyServiceCenterOperationsByClient(
            @AuthenticationPrincipal User user,
            @PathVariable Long clientId) {
        return ResponseEntity.ok(maintenanceRecordService.getMyServiceCenterOperationsByClient(user.getId(), clientId));
    }

    @GetMapping("/service-center/my/car/{carId}")
    public ResponseEntity<List<MaintenanceRecord>> getMyServiceCenterOperationsByCar(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId) {
        return ResponseEntity.ok(maintenanceRecordService.getMyServiceCenterOperationsByCar(user.getId(), carId));
    }
}
