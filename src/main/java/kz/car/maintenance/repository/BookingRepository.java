package kz.car.maintenance.repository;

import kz.car.maintenance.model.Booking;
import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByCar(Car car);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByCarIn(List<Car> cars);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByCarInOrderByBookingDateTimeDesc(List<Car> cars);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByServiceCenter(ServiceCenter serviceCenter);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByServiceCenterOrderByBookingDateTimeAsc(ServiceCenter serviceCenter);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByCarOrderByBookingDateTimeDesc(Car car);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByServiceCenterAndBookingDateTimeBetween(
        ServiceCenter serviceCenter, LocalDateTime start, LocalDateTime end);

    @EntityGraph(attributePaths = {"car", "car.owner", "serviceCenter"})
    List<Booking> findByServiceCenterAndCarOwnerOrderByBookingDateTimeDesc(ServiceCenter serviceCenter, User owner);

    boolean existsByServiceCenterAndCar(ServiceCenter serviceCenter, Car car);
    boolean existsByServiceCenterAndCarOwner(ServiceCenter serviceCenter, User owner);
}
