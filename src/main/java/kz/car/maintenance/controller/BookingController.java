package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.BookingCreateRequest;
import kz.car.maintenance.model.Booking;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {
    
    private final BookingService bookingService;
    
    @PostMapping
    public ResponseEntity<Booking> createBooking(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody BookingCreateRequest request) {
        // Проверка, что пользователь является владельцем автомобиля
        return ResponseEntity.ok(bookingService.createBooking(
                user.getId(),
                request.getCarId(),
                request.getServiceCenterId(),
                request.getBookingDateTime(),
                request.getDescription(),
                request.getContactPhone()));
    }
    
    @GetMapping("/my")
    public ResponseEntity<List<Booking>> getMyBookings(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getUserBookings(user.getId()));
    }
    
    @GetMapping("/service-center/{serviceCenterId}")
    public ResponseEntity<List<Booking>> getServiceCenterBookings(
            @AuthenticationPrincipal User user,
            @PathVariable Long serviceCenterId) {
        return ResponseEntity.ok(bookingService.getServiceCenterBookings(serviceCenterId, user.getId()));
    }
    
    @PatchMapping("/{id}/status")
    public ResponseEntity<Booking> updateBookingStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestParam Booking.BookingStatus status) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, status, user.getId()));
    }
}
