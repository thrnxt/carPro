package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.CarVinRequest;
import kz.car.maintenance.dto.CarCreateRequest;
import kz.car.maintenance.dto.CarDto;
import kz.car.maintenance.dto.VehicleCatalogDto;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.CarService;
import kz.car.maintenance.service.VehicleCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cars")
@RequiredArgsConstructor
public class CarController {
    
    private final CarService carService;
    private final VehicleCatalogService vehicleCatalogService;

    @GetMapping("/lookup/{vin}")
    public ResponseEntity<VehicleCatalogDto> lookupCarByVin(@PathVariable String vin) {
        return ResponseEntity.ok(vehicleCatalogService.getByVin(vin));
    }
    
    @PostMapping
    public ResponseEntity<CarDto> createCar(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CarCreateRequest request) {
        return ResponseEntity.ok(carService.createCar(user.getId(), request));
    }

    @PostMapping("/by-vin")
    public ResponseEntity<CarDto> createCarByVin(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody CarVinRequest request) {
        return ResponseEntity.ok(carService.createCarByVin(user.getId(), request.getVin()));
    }
    
    @GetMapping
    public ResponseEntity<List<CarDto>> getUserCars(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(carService.getUserCars(user.getId()));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CarDto> getCar(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(carService.getCarById(user.getId(), id));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CarDto> updateCar(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody CarCreateRequest request) {
        return ResponseEntity.ok(carService.updateCar(user.getId(), id, request));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCar(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        carService.deleteCar(user.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
