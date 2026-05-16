package kz.car.maintenance.service;

import kz.car.maintenance.dto.PagedResponse;
import kz.car.maintenance.dto.ServiceOperationCreateRequest;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.*;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.repository.MaintenanceRecordRepository;
import kz.car.maintenance.repository.ServiceCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MaintenanceRecordService {
    
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final CarRepository carRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final CarComponentService carComponentService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final ServiceCenterClientService serviceCenterClientService;
    
    @Transactional
    public MaintenanceRecord createMaintenanceRecord(
            Long userId,
            Long carId, 
            Long serviceCenterId,
            String workType,
            String description,
            LocalDate serviceDate,
            Long mileageAtService,
            Double cost) {
        
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new NotFoundException("Car not found"));
        
        // Проверка владения автомобилем (если userId указан)
        if (userId != null && !car.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("You don't have permission to create maintenance record for this car");
        }
        
        ServiceCenter serviceCenter = null;
        if (serviceCenterId != null) {
            serviceCenter = serviceCenterRepository.findById(serviceCenterId)
                    .orElseThrow(() -> new NotFoundException("Service center not found"));
        }
        
        MaintenanceRecord record = MaintenanceRecord.builder()
                .car(car)
                .serviceCenter(serviceCenter)
                .workType(workType)
                .description(description)
                .serviceDate(serviceDate)
                .mileageAtService(mileageAtService)
                .cost(cost != null ? java.math.BigDecimal.valueOf(cost) : null)
                .status(MaintenanceRecord.RecordStatus.COMPLETED)
                .build();
        
        record = maintenanceRecordRepository.save(record);
        
        // Обновление даты последнего ТО
        car.setLastServiceDate(serviceDate);
        car.setMileage(mileageAtService);
        carRepository.save(car);
        
        // Обновление износа компонентов
        carComponentService.updateComponentWear(car);
        
        // Создание уведомления
        notificationService.createNotification(
                car.getOwner().getId(),
                "Обслуживание завершено",
                String.format("Обслуживание автомобиля %s %s завершено. Тип работ: %s", 
                        car.getBrand(), car.getModel(), workType),
                Notification.NotificationType.MAINTENANCE_COMPLETED,
                Notification.NotificationPriority.NORMAL,
                car
        );
        
        return record;
    }

    public List<MaintenanceRecord> getCarMaintenanceHistory(Long carId, Long requesterId) {
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new NotFoundException("Car not found"));
        verifyCarAccess(car, requesterId);
        return maintenanceRecordRepository.findHistoryByCarWithDetails(car);
    }
    
    @Transactional
    public void replaceComponent(
            Long maintenanceRecordId,
            Long componentId,
            String partNumber,
            String manufacturer,
            Long requesterId) {
        
        MaintenanceRecord record = maintenanceRecordRepository.findById(maintenanceRecordId)
                .orElseThrow(() -> new NotFoundException("Maintenance record not found"));
        verifyCarAccess(record.getCar(), requesterId);
        
        CarComponent component = record.getCar().getComponents().stream()
                .filter(c -> c.getId().equals(componentId))
                .findFirst()
                .orElseThrow(() -> new NotFoundException("Component not found"));
        
        ReplacedComponent replacedComponent = ReplacedComponent.builder()
                .maintenanceRecord(record)
                .carComponent(component)
                .replacementDate(record.getServiceDate())
                .partNumber(partNumber)
                .manufacturer(manufacturer)
                .build();
        
        if (record.getReplacedComponents() == null) {
            record.setReplacedComponents(new HashSet<>());
        }
        record.getReplacedComponents().add(replacedComponent);
        
        // Обновление компонента
        component.setLastReplacementDate(record.getServiceDate());
        component.setCurrentMileage(record.getMileageAtService());
        component.setWearLevel(0);
        component.setStatus(CarComponent.ComponentStatus.NEW);
        
        maintenanceRecordRepository.save(record);
    }

    @Transactional
    public MaintenanceRecord createServiceOperation(Long serviceCenterUserId, ServiceOperationCreateRequest request) {
        User user = userService.findById(serviceCenterUserId);
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("Only service center users can create service operations");
        }

        ServiceCenter serviceCenter = serviceCenterRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Service center profile not found"));
        Car car = carRepository.findById(request.getCarId())
                .orElseThrow(() -> new NotFoundException("Car not found"));

        MaintenanceRecord record = MaintenanceRecord.builder()
                .car(car)
                .serviceCenter(serviceCenter)
                .workType(request.getWorkType())
                .description(request.getDescription())
                .serviceDate(request.getServiceDate())
                .mileageAtService(request.getMileageAtService())
                .cost(request.getCost() != null ? java.math.BigDecimal.valueOf(request.getCost()) : null)
                .status(MaintenanceRecord.RecordStatus.COMPLETED)
                .build();
        record = maintenanceRecordRepository.save(record);

        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            if (record.getPhotos() == null) {
                record.setPhotos(new HashSet<>());
            }
            for (ServiceOperationCreateRequest.OperationPhotoRequest photo : request.getPhotos()) {
                MaintenancePhoto maintenancePhoto = MaintenancePhoto.builder()
                        .maintenanceRecord(record)
                        .fileUrl(photo.getFileUrl())
                        .description(photo.getDescription())
                        .build();
                record.getPhotos().add(maintenancePhoto);
            }
        }

        if (request.getReplacedParts() != null && !request.getReplacedParts().isEmpty()) {
            if (record.getReplacedComponents() == null) {
                record.setReplacedComponents(new HashSet<>());
            }
            for (ServiceOperationCreateRequest.ReplacedPartRequest partRequest : request.getReplacedParts()) {
                CarComponent component = car.getComponents().stream()
                        .filter(c -> c.getId().equals(partRequest.getComponentId()))
                        .findFirst()
                        .orElseThrow(() -> new NotFoundException("Component not found for this car: " + partRequest.getComponentId()));

                ReplacedComponent replacedComponent = ReplacedComponent.builder()
                        .maintenanceRecord(record)
                        .carComponent(component)
                        .replacementDate(request.getServiceDate())
                        .partNumber(partRequest.getPartNumber())
                        .manufacturer(partRequest.getManufacturer())
                        .build();
                record.getReplacedComponents().add(replacedComponent);

                component.setLastReplacementDate(request.getServiceDate());
                component.setCurrentMileage(request.getMileageAtService());
                component.setWearLevel(0);
                component.setStatus(CarComponent.ComponentStatus.NEW);
            }
        }

        record = maintenanceRecordRepository.save(record);

        car.setLastServiceDate(request.getServiceDate());
        car.setMileage(request.getMileageAtService());
        carRepository.save(car);
        carComponentService.updateComponentWear(car);

        serviceCenterClientService.registerServiceVisit(serviceCenter, car.getOwner(), request.getServiceDate());
        notificationService.createNotification(
                car.getOwner().getId(),
                "Добавлена новая сервисная операция",
                String.format("Сервис %s добавил операцию: %s (%s %s)",
                        serviceCenter.getName(),
                        request.getWorkType(),
                        car.getBrand(),
                        car.getModel()),
                Notification.NotificationType.MAINTENANCE_COMPLETED,
                Notification.NotificationPriority.NORMAL,
                car
        );

        return record;
    }

    public List<MaintenanceRecord> getMyServiceCenterOperations(Long serviceCenterUserId) {
        ServiceCenter serviceCenter = getServiceCenterByUser(serviceCenterUserId);
        return maintenanceRecordRepository.findByServiceCenterOrderByServiceDateDesc(serviceCenter);
    }

    public PagedResponse<MaintenanceRecord> searchMyServiceCenterOperations(
            Long serviceCenterUserId,
            int page,
            int size,
            String query,
            Long clientId,
            MaintenanceRecord.RecordStatus status,
            LocalDate dateFrom,
            LocalDate dateTo
    ) {
        ServiceCenter serviceCenter = getServiceCenterByUser(serviceCenterUserId);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 25);
        String normalizedQueryPattern = query != null && !query.trim().isEmpty()
                ? "%" + query.trim().toLowerCase(Locale.ROOT) + "%"
                : null;

        Page<Long> idsPage = maintenanceRecordRepository.findOperationIdsByServiceCenter(
                serviceCenter,
                normalizedQueryPattern,
                clientId,
                status,
                dateFrom,
                dateTo,
                PageRequest.of(safePage, safeSize)
        );

        List<MaintenanceRecord> orderedRecords = new ArrayList<>();
        if (!idsPage.getContent().isEmpty()) {
            List<Long> ids = idsPage.getContent();
            List<MaintenanceRecord> records = maintenanceRecordRepository.findDetailedByIdIn(ids);
            Map<Long, Integer> positions = new HashMap<>();
            for (int index = 0; index < ids.size(); index++) {
                positions.put(ids.get(index), index);
            }
            records.sort((left, right) -> Integer.compare(
                    positions.getOrDefault(left.getId(), Integer.MAX_VALUE),
                    positions.getOrDefault(right.getId(), Integer.MAX_VALUE)
            ));
            orderedRecords = records;
        }

        return new PagedResponse<>(
                orderedRecords,
                idsPage.getNumber(),
                idsPage.getSize(),
                idsPage.getTotalElements(),
                idsPage.getTotalPages(),
                idsPage.isFirst(),
                idsPage.isLast()
        );
    }

    public List<MaintenanceRecord> getMyServiceCenterOperationsByClient(Long serviceCenterUserId, Long clientId) {
        ServiceCenter serviceCenter = getServiceCenterByUser(serviceCenterUserId);
        User client = userService.findById(clientId);
        return maintenanceRecordRepository.findByServiceCenterAndCarOwnerOrderByServiceDateDesc(serviceCenter, client);
    }

    public List<MaintenanceRecord> getMyServiceCenterOperationsByCar(Long serviceCenterUserId, Long carId) {
        ServiceCenter serviceCenter = getServiceCenterByUser(serviceCenterUserId);
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new NotFoundException("Car not found"));
        return maintenanceRecordRepository.findByServiceCenterAndCarOrderByServiceDateDesc(serviceCenter, car);
    }

    private ServiceCenter getServiceCenterByUser(Long serviceCenterUserId) {
        User user = userService.findById(serviceCenterUserId);
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("Only service center users can access this endpoint");
        }

        return serviceCenterRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Service center profile not found"));
    }

    private void verifyCarAccess(Car car, Long requesterId) {
        User requester = userService.findById(requesterId);
        boolean isOwner = car.getOwner() != null && car.getOwner().getId().equals(requesterId);
        boolean isAdmin = requester.getRole() == User.UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You don't have permission to access this car maintenance history");
        }
    }
}
