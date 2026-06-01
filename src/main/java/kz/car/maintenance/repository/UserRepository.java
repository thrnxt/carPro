package kz.car.maintenance.repository;

import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.projection.admin.AdminKeyCountView;
import kz.car.maintenance.repository.projection.admin.AdminUserActivityReportRowView;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    @Query(value = """
            SELECT *
            FROM users u
            WHERE u.id <> :currentUserId
              AND u.status = 'ACTIVE'
            ORDER BY md5(concat(cast(u.id as text), '-', cast(:currentUserId as text)))
            """, countQuery = """
            SELECT COUNT(*)
            FROM users u
            WHERE u.id <> :currentUserId
              AND u.status = 'ACTIVE'
            """, nativeQuery = true)
    Page<User> findRandomActiveChatContacts(@Param("currentUserId") Long currentUserId, Pageable pageable);

    @Query("""
            SELECT u
            FROM User u
            WHERE u.id <> :currentUserId
              AND u.status = :status
              AND (
                    lower(u.firstName) LIKE lower(concat('%', :query, '%'))
                 OR lower(u.lastName) LIKE lower(concat('%', :query, '%'))
                 OR lower(concat(coalesce(u.firstName, ''), ' ', coalesce(u.lastName, ''))) LIKE lower(concat('%', :query, '%'))
                 OR lower(u.email) LIKE lower(concat('%', :query, '%'))
              )
            ORDER BY u.firstName ASC, u.lastName ASC, u.id ASC
            """)
    Page<User> searchActiveChatContacts(
            @Param("currentUserId") Long currentUserId,
            @Param("status") User.UserStatus status,
            @Param("query") String query,
            Pageable pageable
    );

    @Query("""
            select distinct u from User u
            left join fetch u.serviceCenter sc
            where (:queryPattern is null
                   or lower(u.firstName) like :queryPattern
                   or lower(u.lastName) like :queryPattern
                   or lower(concat(coalesce(u.firstName, ''), ' ', coalesce(u.lastName, ''))) like :queryPattern
                   or lower(u.email) like :queryPattern)
              and (:role is null or u.role = :role)
              and (:status is null or u.status = :status)
            order by u.createdAt desc, u.id desc
            """)
    List<User> findAllForAdmin(
            @Param("queryPattern") String queryPattern,
            @Param("role") User.UserRole role,
            @Param("status") User.UserStatus status
    );

    @Query(value = """
            select count(*)
            from users u
            where u.created_at >= :dateFromDateTime
              and u.created_at < :dateToExclusive
            """, nativeQuery = true)
    long countUsersCreatedWithin(
            @Param("dateFromDateTime") LocalDateTime dateFromDateTime,
            @Param("dateToExclusive") LocalDateTime dateToExclusive
    );

    @Query(value = """
            select count(*)
            from users u
            where exists (
                select 1
                from cars c
                join bookings b on b.car_id = c.id
                where c.owner_id = u.id
                  and b.booking_date_time >= :dateFromDateTime
                  and b.booking_date_time < :dateToExclusive
            )
               or exists (
                select 1
                from cars c2
                join maintenance_records mr on mr.car_id = c2.id
                where c2.owner_id = u.id
                  and mr.service_date >= :dateFrom
                  and mr.service_date <= :dateTo
            )
            """, nativeQuery = true)
    long countUsersWithActivity(
            @Param("dateFromDateTime") LocalDateTime dateFromDateTime,
            @Param("dateToExclusive") LocalDateTime dateToExclusive,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );

    @Query(value = """
            select u.role as key, count(*) as count
            from users u
            group by u.role
            order by count(*) desc, u.role asc
            """, nativeQuery = true)
    List<AdminKeyCountView> countUsersByRole();

    @Query(value = """
            select u.status as key, count(*) as count
            from users u
            group by u.status
            order by count(*) desc, u.status asc
            """, nativeQuery = true)
    List<AdminKeyCountView> countUsersByStatus();

    @Query(value = """
            select
                u.id as id,
                u.first_name as firstName,
                u.last_name as lastName,
                u.email as email,
                u.role as role,
                u.status as status,
                u.created_at as createdAt,
                (select count(*) from cars c where c.owner_id = u.id) as carsCount,
                (
                    select count(*)
                    from bookings b
                    join cars c on c.id = b.car_id
                    where c.owner_id = u.id
                      and b.booking_date_time >= :dateFromDateTime
                      and b.booking_date_time < :dateToExclusive
                ) as bookingsCount,
                (
                    select count(*)
                    from maintenance_records mr
                    join cars c2 on c2.id = mr.car_id
                    where c2.owner_id = u.id
                      and mr.service_date >= :dateFrom
                      and mr.service_date <= :dateTo
                ) as maintenanceRecordsCount,
                (
                    select max(b.booking_date_time)
                    from bookings b
                    join cars c3 on c3.id = b.car_id
                    where c3.owner_id = u.id
                      and b.booking_date_time >= :dateFromDateTime
                      and b.booking_date_time < :dateToExclusive
                ) as lastBookingAt,
                (
                    select max(mr.service_date)
                    from maintenance_records mr
                    join cars c4 on c4.id = mr.car_id
                    where c4.owner_id = u.id
                      and mr.service_date >= :dateFrom
                      and mr.service_date <= :dateTo
                ) as lastMaintenanceDate
            from users u
            order by 10 desc, 9 desc, 7 desc, 1 desc
            """, nativeQuery = true)
    List<AdminUserActivityReportRowView> findUserActivityReport(
            @Param("dateFromDateTime") LocalDateTime dateFromDateTime,
            @Param("dateToExclusive") LocalDateTime dateToExclusive,
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );
}
