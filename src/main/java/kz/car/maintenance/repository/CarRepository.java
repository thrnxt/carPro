package kz.car.maintenance.repository;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Long> {
    List<Car> findByOwner(User owner);
    Optional<Car> findByIdAndOwner(Long id, User owner);
    boolean existsByVin(String vin);
    boolean existsByLicensePlate(String licensePlate);
    boolean existsByVinAndIdNot(String vin, Long id);
    boolean existsByLicensePlateAndIdNot(String licensePlate, Long id);
}
