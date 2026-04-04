package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.ServiceCenterUpdateRequest;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.ServiceCenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/service-centers")
@RequiredArgsConstructor
public class ServiceCenterController {
    
    private final ServiceCenterService serviceCenterService;
    
    @GetMapping("/nearby")
    public ResponseEntity<List<ServiceCenter>> findNearby(
            @RequestParam BigDecimal latitude,
            @RequestParam BigDecimal longitude,
            @RequestParam(defaultValue = "10") double radiusKm) {
        return ResponseEntity.ok(serviceCenterService.findNearby(latitude, longitude, radiusKm));
    }
    
    @GetMapping("/city/{city}")
    public ResponseEntity<List<ServiceCenter>> getByCity(@PathVariable String city) {
        return ResponseEntity.ok(serviceCenterService.getServiceCentersByCity(city));
    }
    
    @GetMapping("/region/{region}")
    public ResponseEntity<List<ServiceCenter>> getByRegion(@PathVariable String region) {
        return ResponseEntity.ok(serviceCenterService.getServiceCentersByRegion(region));
    }
    
    @GetMapping
    public ResponseEntity<List<ServiceCenter>> getAllServiceCenters() {
        return ResponseEntity.ok(serviceCenterService.getAllActiveServiceCenters());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ServiceCenter> getServiceCenter(@PathVariable Long id) {
        return ResponseEntity.ok(serviceCenterService.getServiceCenterById(id));
    }

    @GetMapping("/my")
    public ResponseEntity<ServiceCenter> getMyServiceCenter(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(serviceCenterService.getMyServiceCenter(user.getId()));
    }
    
    @PostMapping
    public ResponseEntity<ServiceCenter> createServiceCenter(
            @AuthenticationPrincipal User user,
            @RequestBody ServiceCenter serviceCenter) {
        return ResponseEntity.ok(serviceCenterService.createServiceCenter(user.getId(), serviceCenter));
    }

    @PutMapping("/my")
    public ResponseEntity<ServiceCenter> updateMyServiceCenter(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ServiceCenterUpdateRequest request) {
        return ResponseEntity.ok(serviceCenterService.updateMyServiceCenter(user.getId(), request));
    }
}
