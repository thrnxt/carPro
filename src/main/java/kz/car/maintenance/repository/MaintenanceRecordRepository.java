package kz.car.maintenance.repository;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.MaintenanceRecord;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByCar(Car car);
    List<MaintenanceRecord> findByServiceCenter(ServiceCenter serviceCenter);
    List<MaintenanceRecord> findByCarOrderByServiceDateDesc(Car car);
    @Query("""
            select distinct mr from MaintenanceRecord mr
            left join fetch mr.car c
            left join fetch c.owner
            left join fetch mr.serviceCenter
            left join fetch mr.photos
            left join fetch mr.replacedComponents rc
            left join fetch rc.carComponent
            left join fetch mr.invoice
            where mr.car = :car
            order by mr.serviceDate desc, mr.createdAt desc
            """)
    List<MaintenanceRecord> findHistoryByCarWithDetails(@Param("car") Car car);

    @Query("""
            select distinct mr from MaintenanceRecord mr
            left join fetch mr.car c
            left join fetch c.owner
            left join fetch mr.serviceCenter
            left join fetch mr.photos
            left join fetch mr.replacedComponents rc
            left join fetch rc.carComponent
            left join fetch mr.invoice
            where mr.serviceCenter = :serviceCenter
            order by mr.serviceDate desc, mr.createdAt desc
            """)
    List<MaintenanceRecord> findByServiceCenterOrderByServiceDateDesc(@Param("serviceCenter") ServiceCenter serviceCenter);

    @Query("""
            select distinct mr from MaintenanceRecord mr
            left join fetch mr.car c
            left join fetch c.owner
            left join fetch mr.serviceCenter
            left join fetch mr.photos
            left join fetch mr.replacedComponents rc
            left join fetch rc.carComponent
            left join fetch mr.invoice
            where mr.serviceCenter = :serviceCenter
              and c.owner = :owner
            order by mr.serviceDate desc, mr.createdAt desc
            """)
    List<MaintenanceRecord> findByServiceCenterAndCarOwnerOrderByServiceDateDesc(
            @Param("serviceCenter") ServiceCenter serviceCenter,
            @Param("owner") User owner
    );

    @Query("""
            select distinct mr from MaintenanceRecord mr
            left join fetch mr.car c
            left join fetch c.owner
            left join fetch mr.serviceCenter
            left join fetch mr.photos
            left join fetch mr.replacedComponents rc
            left join fetch rc.carComponent
            left join fetch mr.invoice
            where mr.serviceCenter = :serviceCenter
              and c = :car
            order by mr.serviceDate desc, mr.createdAt desc
            """)
    List<MaintenanceRecord> findByServiceCenterAndCarOrderByServiceDateDesc(
            @Param("serviceCenter") ServiceCenter serviceCenter,
            @Param("car") Car car
    );

    @Query(
            value = """
                    select mr.id from MaintenanceRecord mr
                    join mr.car c
                    join c.owner owner
                    where mr.serviceCenter = :serviceCenter
                      and (:clientId is null or owner.id = :clientId)
                      and (:status is null or mr.status = :status)
                      and (:dateFrom is null or mr.serviceDate >= :dateFrom)
                      and (:dateTo is null or mr.serviceDate <= :dateTo)
                      and (
                        :queryPattern is null
                        or lower(mr.workType) like :queryPattern
                        or lower(coalesce(mr.description, '')) like :queryPattern
                        or lower(coalesce(c.brand, '')) like :queryPattern
                        or lower(coalesce(c.model, '')) like :queryPattern
                        or lower(coalesce(c.licensePlate, '')) like :queryPattern
                        or lower(concat(coalesce(owner.firstName, ''), ' ', coalesce(owner.lastName, ''))) like :queryPattern
                      )
                    order by mr.serviceDate desc, mr.createdAt desc
                    """,
            countQuery = """
                    select count(mr.id) from MaintenanceRecord mr
                    join mr.car c
                    join c.owner owner
                    where mr.serviceCenter = :serviceCenter
                      and (:clientId is null or owner.id = :clientId)
                      and (:status is null or mr.status = :status)
                      and (:dateFrom is null or mr.serviceDate >= :dateFrom)
                      and (:dateTo is null or mr.serviceDate <= :dateTo)
                      and (
                        :queryPattern is null
                        or lower(mr.workType) like :queryPattern
                        or lower(coalesce(mr.description, '')) like :queryPattern
                        or lower(coalesce(c.brand, '')) like :queryPattern
                        or lower(coalesce(c.model, '')) like :queryPattern
                        or lower(coalesce(c.licensePlate, '')) like :queryPattern
                        or lower(concat(coalesce(owner.firstName, ''), ' ', coalesce(owner.lastName, ''))) like :queryPattern
                      )
                    """
    )
    Page<Long> findOperationIdsByServiceCenter(
            @Param("serviceCenter") ServiceCenter serviceCenter,
            @Param("queryPattern") String queryPattern,
            @Param("clientId") Long clientId,
            @Param("status") MaintenanceRecord.RecordStatus status,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            Pageable pageable
    );

    @Query(
            value = """
                    select mr.id from MaintenanceRecord mr
                    join mr.car c
                    where c.owner = :owner
                      and (:carId is null or c.id = :carId)
                    order by mr.serviceDate desc, mr.createdAt desc
                    """,
            countQuery = """
                    select count(mr.id) from MaintenanceRecord mr
                    join mr.car c
                    where c.owner = :owner
                      and (:carId is null or c.id = :carId)
                    """
    )
    Page<Long> findHistoryIdsByOwner(
            @Param("owner") User owner,
            @Param("carId") Long carId,
            Pageable pageable
    );

    @Query("""
            select distinct mr from MaintenanceRecord mr
            left join fetch mr.car c
            left join fetch c.owner
            left join fetch mr.serviceCenter
            left join fetch mr.photos
            left join fetch mr.replacedComponents rc
            left join fetch rc.carComponent
            left join fetch mr.invoice
            where mr.id in :ids
            """)
    List<MaintenanceRecord> findDetailedByIdIn(@Param("ids") List<Long> ids);
}
