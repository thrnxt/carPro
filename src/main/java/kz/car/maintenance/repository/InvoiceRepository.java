package kz.car.maintenance.repository;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.Invoice;
import kz.car.maintenance.model.MaintenanceRecord;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Optional<Invoice> findByMaintenanceRecord(MaintenanceRecord maintenanceRecord);
    List<Invoice> findByServiceCenterOrderByCreatedAtDesc(ServiceCenter serviceCenter);
    List<Invoice> findByClientOrderByCreatedAtDesc(User client);
    List<Invoice> findByCarInOrderByCreatedAtDesc(List<Car> cars);
}
