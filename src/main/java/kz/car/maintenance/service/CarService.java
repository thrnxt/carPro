package kz.car.maintenance.service;

import kz.car.maintenance.dto.CarCreateRequest;
import kz.car.maintenance.dto.CarDto;
import kz.car.maintenance.dto.CarVinRequest;
import kz.car.maintenance.dto.DrivingFrequencyRequest;
import kz.car.maintenance.dto.MileageUpdateRequest;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.User;
import kz.car.maintenance.model.VehicleCatalog;
import kz.car.maintenance.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
                .powertrainType(request.getPowertrainType())
                .transmissionType(request.getTransmissionType())
                .drivetrainType(request.getDrivetrainType())
                .build();

        car = carRepository.save(car);

        // Инициализация деталей в зависимости от типа авто
        carComponentService.initializeDefaultComponents(car);
        
        return toDto(car);
    }

    @Transactional
    public CarDto createCarByVin(Long userId, CarVinRequest vinRequest) {
        VehicleCatalog vehicleCatalog = vehicleCatalogService.findEntityByVin(vinRequest.getVin());

        CarCreateRequest request = new CarCreateRequest();
        request.setBrand(vehicleCatalog.getBrand());
        request.setModel(vehicleCatalog.getModel());
        request.setYear(vehicleCatalog.getYear());
        request.setVin(vehicleCatalog.getVin());
        request.setLicensePlate(vehicleCatalog.getLicensePlate());
        request.setColor(vehicleCatalog.getColor());
        request.setMileage(vehicleCatalog.getMileage());
        request.setDrivingStyle(Car.DrivingStyle.MODERATE);
        // Тип авто из модалки (VIN-каталог его не содержит)
        request.setPowertrainType(vinRequest.getPowertrainType());
        request.setTransmissionType(vinRequest.getTransmissionType());
        request.setDrivetrainType(vinRequest.getDrivetrainType());

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
        if (request.getPowertrainType() != null) {
            car.setPowertrainType(request.getPowertrainType());
        }
        if (request.getTransmissionType() != null) {
            car.setTransmissionType(request.getTransmissionType());
        }
        if (request.getDrivetrainType() != null) {
            car.setDrivetrainType(request.getDrivetrainType());
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

    // ─── Трекинг пробега ──────────────────────────────────────────────────────

    /**
     * Устанавливает частоту использования авто.
     * Вызывается после модального окна «Как часто вы ездите?»
     */
    @Transactional
    public CarDto updateDrivingFrequency(Long userId, Long carId, DrivingFrequencyRequest request) {
        User owner = userService.findById(userId);
        Car car = carRepository.findByIdAndOwner(carId, owner)
                .orElseThrow(() -> new NotFoundException("Car not found"));

        car.setDrivingFrequency(request.getDrivingFrequency());

        // Если confirmedMileageAt не задан — считаем, что начало отсчёта сейчас
        if (car.getConfirmedMileageAt() == null) {
            car.setConfirmedMileageAt(LocalDateTime.now());
        }

        // Сразу считаем первичный estimatedMileage (пока = mileage, т.к. только что задали частоту)
        car.setEstimatedMileage(car.getMileage());
        car.setMileageIsEstimated(false);

        car = carRepository.save(car);
        return toDto(car);
    }

    /**
     * Подтверждение / ручное уточнение пробега пользователем.
     * Сбрасывает расчёт и начинает накопление заново с указанного значения.
     */
    @Transactional
    public CarDto confirmMileage(Long userId, Long carId, MileageUpdateRequest request) {
        User owner = userService.findById(userId);
        Car car = carRepository.findByIdAndOwner(carId, owner)
                .orElseThrow(() -> new NotFoundException("Car not found"));

        Long newMileage = request.getCurrentMileage();
        Long oldMileage = car.getMileage();

        car.setMileage(newMileage);
        car.setEstimatedMileage(newMileage);
        car.setMileageIsEstimated(false);
        car.setConfirmedMileageAt(LocalDateTime.now());

        car = carRepository.save(car);

        // Пересчитываем износ компонентов при изменении пробега
        if (oldMileage != null && !oldMileage.equals(newMileage)) {
            carComponentService.updateComponentWear(car);
        }

        return toDto(car);
    }

    // ─────────────────────────────────────────────────────────────────────────

    public CarDto toDto(Car car) {
        Long displayMileage = car.getEstimatedMileage() != null
                ? car.getEstimatedMileage()
                : car.getMileage();

        boolean isEstimated = Boolean.TRUE.equals(car.getMileageIsEstimated())
                && car.getEstimatedMileage() != null;

        // Показывать модальное окно «Как часто вы ездите?», если частота не задана
        boolean needsSetup = car.getDrivingFrequency() == null;

        return CarDto.builder()
                .id(car.getId())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .vin(car.getVin())
                .licensePlate(car.getLicensePlate())
                .color(car.getColor())
                .mileage(car.getMileage())
                .estimatedMileage(car.getEstimatedMileage())
                .displayMileage(displayMileage)
                .mileageIsEstimated(isEstimated)
                .drivingFrequency(car.getDrivingFrequency())
                .confirmedMileageAt(car.getConfirmedMileageAt())
                .needsDrivingFrequencySetup(needsSetup)
                .drivingStyle(car.getDrivingStyle())
                .powertrainType(car.getPowertrainType())
                .transmissionType(car.getTransmissionType())
                .drivetrainType(car.getDrivetrainType())
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
