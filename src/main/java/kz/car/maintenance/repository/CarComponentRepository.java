package kz.car.maintenance.repository;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.CarComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarComponentRepository extends JpaRepository<CarComponent, Long> {
    List<CarComponent> findByCar(Car car);
    List<CarComponent> findByCarAndStatus(Car car, CarComponent.ComponentStatus status);
}
