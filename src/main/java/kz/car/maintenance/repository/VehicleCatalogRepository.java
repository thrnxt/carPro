package kz.car.maintenance.repository;

import kz.car.maintenance.model.VehicleCatalog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VehicleCatalogRepository extends JpaRepository<VehicleCatalog, Long> {
    Optional<VehicleCatalog> findByVin(String vin);
    boolean existsByVin(String vin);
}
