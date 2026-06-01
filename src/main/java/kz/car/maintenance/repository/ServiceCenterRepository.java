package kz.car.maintenance.repository;

import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.projection.admin.AdminKeyCountView;
import kz.car.maintenance.repository.projection.admin.AdminServiceActivityReportRowView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCenterRepository extends JpaRepository<ServiceCenter, Long> {
    @Query("SELECT sc FROM ServiceCenter sc WHERE " +
           "6371 * acos(cos(radians(:lat)) * cos(radians(sc.latitude)) * " +
           "cos(radians(sc.longitude) - radians(:lng)) + " +
           "sin(radians(:lat)) * sin(radians(sc.latitude))) <= :radius")
    List<ServiceCenter> findNearby(@Param("lat") BigDecimal latitude,
                                    @Param("lng") BigDecimal longitude,
                                    @Param("radius") double radiusKm);
    
    List<ServiceCenter> findByStatus(ServiceCenter.ServiceCenterStatus status);
    List<ServiceCenter> findByCity(String city);
    List<ServiceCenter> findByRegion(String region);
    Optional<ServiceCenter> findByUser(User user);

    boolean existsByUser(User user);

    @Query("""
            select sc from ServiceCenter sc
            join fetch sc.user u
            where (:status is null or sc.status = :status)
              and (:queryPattern is null
                   or lower(sc.name) like :queryPattern
                   or lower(coalesce(sc.city, '')) like :queryPattern
                   or lower(coalesce(sc.region, '')) like :queryPattern
                   or lower(coalesce(sc.address, '')) like :queryPattern
                   or lower(coalesce(sc.licenseNumber, '')) like :queryPattern
                   or lower(coalesce(u.email, '')) like :queryPattern)
            order by sc.createdAt desc, sc.id desc
            """)
    List<ServiceCenter> findAllForAdmin(
            @Param("queryPattern") String queryPattern,
            @Param("status") ServiceCenter.ServiceCenterStatus status
    );

    @Query(value = """
            select sc.status as key, count(*) as count
            from service_centers sc
            group by sc.status
            order by count(*) desc, sc.status asc
            """, nativeQuery = true)
    List<AdminKeyCountView> countServiceCentersByStatus();

    @Query(value = """
            select
                sc.id as id,
                sc.name as name,
                u.email as accountEmail,
                coalesce(nullif(sc.region, ''), 'Не указан') as region,
                sc.status as status,
                sc.created_at as createdAt,
                (
                    select count(*)
                    from bookings b
                    where b.service_center_id = sc.id
                      and b.booking_date_time >= :dateFromDateTime
                      and b.booking_date_time < :dateToExclusive
                ) as bookingsCount,
                (
                    select count(*)
                    from maintenance_records mr
                    where mr.service_center_id = sc.id
                      and mr.status = 'COMPLETED'
                      and mr.service_date >= :dateFrom
                      and mr.service_date <= :dateTo
                ) as completedWorksCount,
                (
                    select max(b.booking_date_time)
                    from bookings b
                    where b.service_center_id = sc.id
                      and b.booking_date_time >= :dateFromDateTime
                      and b.booking_date_time < :dateToExclusive
                ) as lastBookingAt,
                (
                    select max(mr.service_date)
                    from maintenance_records mr
                    where mr.service_center_id = sc.id
                      and mr.status = 'COMPLETED'
                      and mr.service_date >= :dateFrom
                      and mr.service_date <= :dateTo
                ) as lastCompletedServiceDate
            from service_centers sc
            join users u on u.id = sc.user_id
            order by 8 desc, 7 desc, 6 desc, 1 desc
            """, nativeQuery = true)
    List<AdminServiceActivityReportRowView> findServiceActivityReport(
            @Param("dateFromDateTime") LocalDateTime dateFromDateTime,
            @Param("dateToExclusive") LocalDateTime dateToExclusive,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );
}
