package kz.car.maintenance.controller;

import kz.car.maintenance.dto.CarComponentDto;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.CarComponent;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.CarComponentRepository;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.service.CarComponentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/cars/{carId}/components")
@RequiredArgsConstructor
public class CarComponentController {
    
    private final CarComponentRepository carComponentRepository;
    private final CarRepository carRepository;
    private final CarComponentService carComponentService;
    
    @GetMapping
    public ResponseEntity<List<CarComponentDto>> getCarComponents(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId) {
        if (user == null) {
            throw new ForbiddenException("User not authenticated");
        }
        
        Car car = carRepository.findByIdAndOwner(carId, user)
                .orElseThrow(() -> new ForbiddenException("Car not found or access denied"));
        
        List<CarComponent> components = carComponentRepository.findByCar(car);
        List<CarComponentDto> dtos = components.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
    
    private CarComponentDto toDto(CarComponent component) {
        return CarComponentDto.builder()
                .id(component.getId())
                .name(component.getName())
                .category(component.getCategory())
                .subcategory(component.getSubcategory())
                .icon(component.getIcon())
                .description(component.getDescription())
                .maxMileage(component.getMaxMileage())
                .maxMonths(component.getMaxMonths())
                .wearCoefficient(component.getWearCoefficient())
                .currentMileage(component.getCurrentMileage())
                .lastReplacementDate(component.getLastReplacementDate())
                .wearLevel(component.getWearLevel())
                .status(component.getStatus())
                .build();
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CarComponentDto>> getComponentsByStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId,
            @PathVariable CarComponent.ComponentStatus status) {
        Car car = carRepository.findByIdAndOwner(carId, user)
                .orElseThrow(() -> new ForbiddenException("Car not found or access denied"));
        List<CarComponent> components = carComponentRepository.findByCarAndStatus(car, status);
        List<CarComponentDto> dtos = components.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }
    
    @PostMapping("/update-wear")
    public ResponseEntity<Void> updateComponentWear(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId) {
        Car car = carRepository.findByIdAndOwner(carId, user)
                .orElseThrow(() -> new ForbiddenException("Car not found or access denied"));
        carComponentService.updateComponentWear(car);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/{componentId}/replace")
    public ResponseEntity<Void> replaceComponent(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId,
            @PathVariable Long componentId) {
        carRepository.findByIdAndOwner(carId, user)
                .orElseThrow(() -> new ForbiddenException("Car not found or access denied"));
        carComponentService.replaceComponent(componentId, carId);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/fix-existing")
    public ResponseEntity<Void> fixExistingComponents(
            @AuthenticationPrincipal User user,
            @PathVariable Long carId) {
        Car car = carRepository.findByIdAndOwner(carId, user)
                .orElseThrow(() -> new ForbiddenException("Car not found or access denied"));
        carComponentService.fixExistingComponents(car);
        return ResponseEntity.noContent().build();
    }
}
