package kz.car.maintenance.repository;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.MaintenanceRecord;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByCar(Car car);
    List<MaintenanceRecord> findByServiceCenter(ServiceCenter serviceCenter);
    List<MaintenanceRecord> findByCarOrderByServiceDateDesc(Car car);
    @Query("""
            select distinct mr from MaintenanceRecord mr
            left join fetch mr.serviceCenter
            left join fetch mr.photos
            left join fetch mr.replacedComponents rc
            left join fetch rc.carComponent
            left join fetch mr.invoice
            where mr.car = :car
            order by mr.serviceDate desc, mr.createdAt desc
            """)
    List<MaintenanceRecord> findHistoryByCarWithDetails(@Param("car") Car car);
    List<MaintenanceRecord> findByServiceCenterOrderByServiceDateDesc(ServiceCenter serviceCenter);
    List<MaintenanceRecord> findByServiceCenterAndCarOwnerOrderByServiceDateDesc(ServiceCenter serviceCenter, User owner);
    List<MaintenanceRecord> findByServiceCenterAndCarOrderByServiceDateDesc(ServiceCenter serviceCenter, Car car);
}
