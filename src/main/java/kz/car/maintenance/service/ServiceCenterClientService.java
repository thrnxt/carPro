package kz.car.maintenance.service;

import kz.car.maintenance.dto.CarComponentDto;
import kz.car.maintenance.dto.CarSummaryDto;
import kz.car.maintenance.dto.ServiceCenterClientDto;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.Booking;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.CarComponent;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.ServiceCenterClient;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.BookingRepository;
import kz.car.maintenance.repository.CarComponentRepository;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.repository.MaintenanceRecordRepository;
import kz.car.maintenance.repository.ServiceCenterClientRepository;
import kz.car.maintenance.repository.ServiceCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ServiceCenterClientService {

    private final ServiceCenterClientRepository serviceCenterClientRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final UserService userService;
    private final CarRepository carRepository;
    private final CarComponentRepository carComponentRepository;
    private final MaintenanceRecordRepository maintenanceRecordRepository;
    private final BookingRepository bookingRepository;

    public List<ServiceCenterClientDto> getMyClients(Long serviceCenterUserId) {
        ServiceCenter serviceCenter = getMyServiceCenter(serviceCenterUserId);

        List<ServiceCenterClient> savedClients = serviceCenterClientRepository
                .findByServiceCenterOrderByUpdatedAtDesc(serviceCenter);

        Map<Long, ClientAggregate> aggregates = new LinkedHashMap<>();
        for (ServiceCenterClient savedClient : savedClients) {
            if (savedClient.getClient() == null || savedClient.getClient().getId() == null) {
                continue;
            }
            aggregates.put(savedClient.getClient().getId(), ClientAggregate.fromSaved(savedClient));
        }

        List<Booking> bookings = bookingRepository.findByServiceCenterOrderByBookingDateTimeAsc(serviceCenter);
        for (Booking booking : bookings) {
            if (booking.getCar() == null || booking.getCar().getOwner() == null || booking.getCar().getOwner().getId() == null) {
                continue;
            }

            User bookingClient = booking.getCar().getOwner();
            ClientAggregate aggregate = aggregates.computeIfAbsent(
                    bookingClient.getId(),
                    ignored -> ClientAggregate.fromUser(bookingClient)
            );

            if (booking.getBookingDateTime() != null && (aggregate.lastBookingDateTime == null
                    || booking.getBookingDateTime().isAfter(aggregate.lastBookingDateTime))) {
                aggregate.lastBookingDateTime = booking.getBookingDateTime();
            }
        }

        return aggregates.values().stream()
                .map(aggregate -> toDto(serviceCenter, aggregate))
                .sorted(Comparator
                        .comparing(ServiceCenterClientDto::getLastServiceDate,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(ServiceCenterClientDto::getTotalVisits,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());
    }

    public List<CarSummaryDto> getClientCars(Long serviceCenterUserId, Long clientId) {
        ServiceCenter serviceCenter = getMyServiceCenter(serviceCenterUserId);
        User client = userService.findById(clientId);

        validateClientBelongsToService(serviceCenter, client);

        return getAccessibleCars(serviceCenter, client).stream()
                .map(this::toCarSummary)
                .collect(Collectors.toList());
    }

    public List<CarComponentDto> getClientCarComponents(Long serviceCenterUserId, Long clientId, Long carId) {
        ServiceCenter serviceCenter = getMyServiceCenter(serviceCenterUserId);
        User client = userService.findById(clientId);
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new NotFoundException("Car not found"));

        if (car.getOwner() == null || !car.getOwner().getId().equals(client.getId())) {
            throw new ForbiddenException("Car does not belong to this client");
        }

        boolean hasServiceHistory = !maintenanceRecordRepository
                .findByServiceCenterAndCarOrderByServiceDateDesc(serviceCenter, car)
                .isEmpty();

        boolean hasBooking = bookingRepository.existsByServiceCenterAndCar(serviceCenter, car);

        if (!hasServiceHistory && !hasBooking) {
            throw new ForbiddenException("You don't have access to this car components");
        }

        return carComponentRepository.findByCar(car).stream()
                .map(this::toCarComponentDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ServiceCenterClientDto updateClientStatus(
            Long serviceCenterUserId,
            Long clientId,
            ServiceCenterClient.ClientStatus status
    ) {
        ServiceCenter serviceCenter = getMyServiceCenter(serviceCenterUserId);
        User client = userService.findById(clientId);

        ServiceCenterClient serviceCenterClient = serviceCenterClientRepository
                .findByServiceCenterAndClient(serviceCenter, client)
                .orElseGet(() -> {
                    if (!isClientAssociatedWithServiceCenter(serviceCenter, client)) {
                        throw new NotFoundException("Client is not associated with this service center");
                    }

                    return ServiceCenterClient.builder()
                            .serviceCenter(serviceCenter)
                            .client(client)
                            .status(ServiceCenterClient.ClientStatus.NEW)
                            .totalVisits(0)
                            .lastServiceDate(getLatestBookingDate(serviceCenter, client))
                            .build();
                });

        serviceCenterClient.setStatus(status);
        serviceCenterClient = serviceCenterClientRepository.save(serviceCenterClient);

        return ServiceCenterClientDto.builder()
                .clientId(client.getId())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phoneNumber(client.getPhoneNumber())
                .status(serviceCenterClient.getStatus())
                .totalVisits(serviceCenterClient.getTotalVisits())
                .lastServiceDate(serviceCenterClient.getLastServiceDate())
                .carsCount(getClientCars(serviceCenterUserId, clientId).size())
                .build();
    }

    @Transactional
    public void registerServiceVisit(ServiceCenter serviceCenter, User client, LocalDate serviceDate) {
        ServiceCenterClient serviceCenterClient = serviceCenterClientRepository
                .findByServiceCenterAndClient(serviceCenter, client)
                .orElseGet(() -> ServiceCenterClient.builder()
                        .serviceCenter(serviceCenter)
                        .client(client)
                        .status(ServiceCenterClient.ClientStatus.NEW)
                        .totalVisits(0)
                        .build());

        serviceCenterClient.setTotalVisits(serviceCenterClient.getTotalVisits() + 1);
        serviceCenterClient.setLastServiceDate(serviceDate);

        if (serviceCenterClient.getStatus() == ServiceCenterClient.ClientStatus.NEW
                && serviceCenterClient.getTotalVisits() >= 2) {
            serviceCenterClient.setStatus(ServiceCenterClient.ClientStatus.REGULAR);
        }
        if (serviceCenterClient.getStatus() == ServiceCenterClient.ClientStatus.REGULAR
                && serviceCenterClient.getTotalVisits() >= 10) {
            serviceCenterClient.setStatus(ServiceCenterClient.ClientStatus.VIP);
        }

        serviceCenterClientRepository.save(serviceCenterClient);
    }

    private ServiceCenter getMyServiceCenter(Long serviceCenterUserId) {
        User user = userService.findById(serviceCenterUserId);
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("Only service center users can access this endpoint");
        }

        return serviceCenterRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Service center profile not found"));
    }

    private ServiceCenterClientDto toDto(ServiceCenter serviceCenter, ClientAggregate aggregate) {
        LocalDate lastServiceDate = aggregate.lastServiceDate;
        if (lastServiceDate == null && aggregate.lastBookingDateTime != null) {
            lastServiceDate = aggregate.lastBookingDateTime.toLocalDate();
        }

        return ServiceCenterClientDto.builder()
                .clientId(aggregate.client.getId())
                .firstName(aggregate.client.getFirstName())
                .lastName(aggregate.client.getLastName())
                .email(aggregate.client.getEmail())
                .phoneNumber(aggregate.client.getPhoneNumber())
                .status(aggregate.status)
                .totalVisits(aggregate.totalVisits)
                .lastServiceDate(lastServiceDate)
                .carsCount(getAccessibleCars(serviceCenter, aggregate.client).size())
                .build();
    }

    private List<Car> getAccessibleCars(ServiceCenter serviceCenter, User client) {
        Map<Long, Car> cars = new LinkedHashMap<>();

        List<Booking> clientBookings = bookingRepository
                .findByServiceCenterAndCarOwnerOrderByBookingDateTimeDesc(serviceCenter, client);
        for (Booking booking : clientBookings) {
            if (booking.getCar() != null && booking.getCar().getId() != null) {
                cars.putIfAbsent(booking.getCar().getId(), booking.getCar());
            }
        }

        for (Car car : carRepository.findByOwner(client)) {
            boolean hasServiceHistory = !maintenanceRecordRepository
                    .findByServiceCenterAndCarOrderByServiceDateDesc(serviceCenter, car)
                    .isEmpty();
            if (hasServiceHistory) {
                cars.putIfAbsent(car.getId(), car);
            }
        }

        return new ArrayList<>(cars.values());
    }

    private void validateClientBelongsToService(ServiceCenter serviceCenter, User client) {
        if (!isClientAssociatedWithServiceCenter(serviceCenter, client)) {
            throw new ForbiddenException("Client is not associated with this service center");
        }
    }

    private boolean isClientAssociatedWithServiceCenter(ServiceCenter serviceCenter, User client) {
        boolean hasDirectRelation = serviceCenterClientRepository
                .findByServiceCenterAndClient(serviceCenter, client)
                .isPresent();

        if (hasDirectRelation) {
            return true;
        }

        boolean hasBookings = bookingRepository.existsByServiceCenterAndCarOwner(serviceCenter, client);
        if (hasBookings) {
            return true;
        }

        return carRepository.findByOwner(client).stream()
                .anyMatch(car -> !maintenanceRecordRepository
                        .findByServiceCenterAndCarOrderByServiceDateDesc(serviceCenter, car)
                        .isEmpty());
    }

    private LocalDate getLatestBookingDate(ServiceCenter serviceCenter, User client) {
        return bookingRepository.findByServiceCenterAndCarOwnerOrderByBookingDateTimeDesc(serviceCenter, client)
                .stream()
                .map(Booking::getBookingDateTime)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .map(LocalDateTime::toLocalDate)
                .orElse(null);
    }

    private CarSummaryDto toCarSummary(Car car) {
        return CarSummaryDto.builder()
                .id(car.getId())
                .brand(car.getBrand())
                .model(car.getModel())
                .year(car.getYear())
                .licensePlate(car.getLicensePlate())
                .mileage(car.getMileage())
                .build();
    }

    private CarComponentDto toCarComponentDto(CarComponent component) {
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

    private static class ClientAggregate {
        private final User client;
        private ServiceCenterClient.ClientStatus status;
        private Integer totalVisits;
        private LocalDate lastServiceDate;
        private LocalDateTime lastBookingDateTime;

        private ClientAggregate(User client) {
            this.client = client;
            this.status = ServiceCenterClient.ClientStatus.NEW;
            this.totalVisits = 0;
        }

        private static ClientAggregate fromSaved(ServiceCenterClient savedClient) {
            ClientAggregate aggregate = new ClientAggregate(savedClient.getClient());
            aggregate.status = savedClient.getStatus() != null ? savedClient.getStatus() : ServiceCenterClient.ClientStatus.NEW;
            aggregate.totalVisits = savedClient.getTotalVisits() != null ? savedClient.getTotalVisits() : 0;
            aggregate.lastServiceDate = savedClient.getLastServiceDate();
            return aggregate;
        }

        private static ClientAggregate fromUser(User client) {
            return new ClientAggregate(client);
        }
    }
}
