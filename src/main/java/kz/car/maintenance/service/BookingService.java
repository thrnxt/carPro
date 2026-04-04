package kz.car.maintenance.service;

import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.Booking;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.BookingRepository;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.repository.ServiceCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final CarRepository carRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final NotificationService notificationService;
    private final UserService userService;
    
    @Transactional
    public Booking createBooking(
            Long userId,
            Long carId,
            Long serviceCenterId,
            LocalDateTime bookingDateTime,
            String description,
            String contactPhone) {
        
        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new NotFoundException("Car not found"));
        
        // Проверка владения автомобилем (если userId указан)
        if (userId != null && !car.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("You don't have permission to create booking for this car");
        }
        
        ServiceCenter serviceCenter = serviceCenterRepository.findById(serviceCenterId)
                .orElseThrow(() -> new NotFoundException("Service center not found"));
        
        // Проверка, что дата в будущем
        if (bookingDateTime.isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Booking date must be in the future");
        }
        
        Booking booking = Booking.builder()
                .car(car)
                .serviceCenter(serviceCenter)
                .bookingDateTime(bookingDateTime)
                .description(description)
                .contactPhone(contactPhone)
                .status(Booking.BookingStatus.PENDING)
                .build();
        
        booking = bookingRepository.save(booking);
        
        // Уведомление сервисному центру
        notificationService.createNotification(
                serviceCenter.getUser().getId(),
                "Новая запись на обслуживание",
                String.format("Новая запись от %s %s на %s. Автомобиль: %s %s", 
                        car.getOwner().getFirstName(), 
                        car.getOwner().getLastName(),
                        bookingDateTime.toString(),
                        car.getBrand(),
                        car.getModel()),
                kz.car.maintenance.model.Notification.NotificationType.BOOKING_CONFIRMED,
                kz.car.maintenance.model.Notification.NotificationPriority.NORMAL,
                car
        );
        
        // Уведомление владельцу автомобиля
        notificationService.createNotification(
                car.getOwner().getId(),
                "Запись создана",
                String.format("Ваша запись в %s создана и ожидает подтверждения", 
                        serviceCenter.getName()),
                kz.car.maintenance.model.Notification.NotificationType.BOOKING_CONFIRMED,
                kz.car.maintenance.model.Notification.NotificationPriority.NORMAL,
                car
        );
        
        return booking;
    }
    
    public List<Booking> getUserBookings(Long userId) {
        // Получаем все автомобили пользователя
        User user = userService.findById(userId);
        List<Car> cars = carRepository.findByOwner(user);
        if (cars.isEmpty()) {
            return List.of();
        }
        // Возвращаем все записи для всех автомобилей пользователя
        return bookingRepository.findByCarInOrderByBookingDateTimeDesc(cars);
    }
    
    public List<Booking> getServiceCenterBookings(Long serviceCenterId, Long requesterId) {
        ServiceCenter serviceCenter = serviceCenterRepository.findById(serviceCenterId)
                .orElseThrow(() -> new NotFoundException("Service center not found"));

        User requester = userService.findById(requesterId);
        verifyServiceCenterAccess(requester, serviceCenter);

        return bookingRepository.findByServiceCenterOrderByBookingDateTimeAsc(serviceCenter);
    }
    
    @Transactional
    public Booking updateBookingStatus(Long bookingId, Booking.BookingStatus status, Long requesterId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NotFoundException("Booking not found"));

        User requester = userService.findById(requesterId);
        boolean isServiceCenterManager = canManageServiceCenter(requester, booking.getServiceCenter());
        boolean isCarOwner = booking.getCar() != null
                && booking.getCar().getOwner() != null
                && booking.getCar().getOwner().getId().equals(requesterId);
        boolean canCancelOwnBooking = isCarOwner && status == Booking.BookingStatus.CANCELLED;

        if (!isServiceCenterManager && !canCancelOwnBooking) {
            throw new ForbiddenException("You don't have permission to update this booking status");
        }
        
        booking.setStatus(status);
        booking = bookingRepository.save(booking);
        
        // Уведомление пользователю
        if (status == Booking.BookingStatus.CONFIRMED) {
            notificationService.createNotification(
                    booking.getCar().getOwner().getId(),
                    "Запись подтверждена",
                    String.format("Ваша запись в %s подтверждена", 
                            booking.getServiceCenter().getName()),
                    kz.car.maintenance.model.Notification.NotificationType.BOOKING_CONFIRMED,
                    kz.car.maintenance.model.Notification.NotificationPriority.NORMAL,
                    booking.getCar()
            );
        }
        
        return booking;
    }

    private void verifyServiceCenterAccess(User requester, ServiceCenter serviceCenter) {
        if (!canManageServiceCenter(requester, serviceCenter)) {
            throw new ForbiddenException("You don't have permission to manage this service center bookings");
        }
    }

    private boolean canManageServiceCenter(User requester, ServiceCenter serviceCenter) {
        boolean isAdmin = requester.getRole() == User.UserRole.ADMIN;
        boolean isOwner = serviceCenter.getUser() != null
                && serviceCenter.getUser().getId().equals(requester.getId());
        return isAdmin || isOwner;
    }
}
