package kz.car.maintenance.service;

import kz.car.maintenance.dto.CarCreateRequest;
import kz.car.maintenance.dto.CarDto;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.User;
import kz.car.maintenance.model.VehicleCatalog;
import kz.car.maintenance.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarService {
    
    private final CarRepository carRepository;
    private final UserService userService;
    private final CarComponentService carComponentService;
    private final VehicleCatalogService vehicleCatalogService;
    
    @Transactional
    public CarDto createCar(Long userId, CarCreateRequest request) {
        User owner = userService.findById(userId);

        String normalizedVin = normalizeVin(request.getVin());
        String normalizedLicensePlate = normalizeLicensePlate(request.getLicensePlate());

        if (normalizedVin != null && carRepository.existsByVin(normalizedVin)) {
            throw new BadRequestException("Car with this VIN already exists");
        }

        if (normalizedLicensePlate != null && carRepository.existsByLicensePlate(normalizedLicensePlate)) {
            throw new BadRequestException("Car with this license plate already exists");
        }

        Car car = Car.builder()
                .owner(owner)
                .brand(normalizeText(request.getBrand()))
                .model(normalizeText(request.getModel()))
                .year(request.getYear())
                .vin(normalizedVin)
                .licensePlate(normalizedLicensePlate)
                .color(normalizeText(request.getColor()))
                .mileage(request.getMileage())
                .drivingStyle(request.getDrivingStyle() != null ? 
                        request.getDrivingStyle() : Car.DrivingStyle.MODERATE)
                .build();
        
        car = carRepository.save(car);
        
        // Инициализация стандартных компонентов автомобиля
        carComponentService.initializeDefaultComponents(car);
        
        return toDto(car);
    }

    @Transactional
    public CarDto createCarByVin(Long userId, String vin) {
        VehicleCatalog vehicleCatalog = vehicleCatalogService.findEntityByVin(vin);

        CarCreateRequest request = new CarCreateRequest();
        request.setBrand(vehicleCatalog.getBrand());
        request.setModel(vehicleCatalog.getModel());
        request.setYear(vehicleCatalog.getYear());
        request.setVin(vehicleCatalog.getVin());
        request.setLicensePlate(vehicleCatalog.getLicensePlate());
        request.setColor(vehicleCatalog.getColor());
        request.setMileage(vehicleCatalog.getMileage());
        request.setDrivingStyle(Car.DrivingStyle.MODERATE);

        return createCar(userId, request);
    }
    
    public List<CarDto> getUserCars(Long userId) {
        User owner = userService.findById(userId);
        return carRepository.findByOwner(owner).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }
    
    public CarDto getCarById(Long userId, Long carId) {
        User owner = userService.findById(userId);
        Car car = carRepository.findByIdAndOwner(carId, owner)
                .orElseThrow(() -> new NotFoundException("Car not found"));
        return toDto(car);
    }
    
    @Transactional
    public CarDto updateCar(Long userId, Long carId, CarCreateRequest request) {
        User owner = userService.findById(userId);
        Car car = carRepository.findByIdAndOwner(carId, owner)
                .orElseThrow(() -> new NotFoundException("Car not found"));

        String normalizedVin = normalizeVin(request.getVin());
        String normalizedLicensePlate = normalizeLicensePlate(request.getLicensePlate());

        if (normalizedVin != null && carRepository.existsByVinAndIdNot(normalizedVin, carId)) {
            throw new BadRequestException("Car with this VIN already exists");
        }
        if (normalizedLicensePlate != null && carRepository.existsByLicensePlateAndIdNot(normalizedLicensePlate, carId)) {
            throw new BadRequestException("Car with this license plate already exists");
        }
        
        Long oldMileage = car.getMileage();
        
        car.setBrand(normalizeText(request.getBrand()));
        car.setModel(normalizeText(request.getModel()));
        car.setYear(request.getYear());
        car.setVin(normalizedVin);
        car.setLicensePlate(normalizedLicensePlate);
        car.setColor(normalizeText(request.getColor()));
        car.setMileage(request.getMileage());
        if (request.getDrivingStyle() != null) {
            car.setDrivingStyle(request.getDrivingStyle());
        }
        
        car = carRepository.save(car);
        
        // Если пробег изменился, обновляем износ компонентов
        if (oldMileage != null && !oldMileage.equals(request.getMileage())) {
            carComponentService.updateComponentWear(car);
        }
        
        return toDto(car);
    }
    
    @Transactional
    public void deleteCar(Long userId, Long carId) {
        User owner = userService.findById(userId);
        Car car = carRepository.findByIdAndOwner(carId, owner)
                .orElseThrow(() -> new NotFoundException("Car not found"));
        carRepository.delete(car);
    }
    
    private CarDto toDto(Car car) {
        return CarDto.builder()
                .id(car.getId())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .vin(car.getVin())
                .licensePlate(car.getLicensePlate())
                .color(car.getColor())
                .mileage(car.getMileage())
                .drivingStyle(car.getDrivingStyle())
                .lastServiceDate(car.getLastServiceDate())
                .imageUrl(car.getImageUrl())
                .ownerId(car.getOwner().getId())
                .build();
    }

    private String normalizeVin(String vin) {
        if (vin == null) {
            return null;
        }

        String normalizedVin = vin.trim().toUpperCase();
        return normalizedVin.isBlank() ? null : normalizedVin;
    }

    private String normalizeLicensePlate(String licensePlate) {
        if (licensePlate == null) {
            return null;
        }

        String normalizedLicensePlate = licensePlate.trim().toUpperCase();
        return normalizedLicensePlate.isBlank() ? null : normalizedLicensePlate;
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String normalizedValue = value.trim();
        return normalizedValue.isBlank() ? null : normalizedValue;
    }
}
