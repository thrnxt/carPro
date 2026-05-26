package kz.car.maintenance.repository;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
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

    /** Все авто с заданной частотой использования (для ежедневного пересчёта пробега) */
    List<Car> findByDrivingFrequencyIsNotNull();

    /**
     * Авто, которым нужно отправить напоминание об уточнении пробега.
     * Условие: частота задана И (пробег не подтверждали 30+ дней ИЛИ никогда)
     *          И (напоминание не отправляли 14+ дней ИЛИ никогда)
     */
    @Query("""
        SELECT c FROM Car c
        WHERE c.drivingFrequency IS NOT NULL
          AND (c.confirmedMileageAt IS NULL OR c.confirmedMileageAt < :thirtyDaysAgo)
          AND (c.mileageReminderSentAt IS NULL OR c.mileageReminderSentAt < :fourteenDaysAgo)
        """)
    List<Car> findCarsNeedingMileageReminder(
            @Param("thirtyDaysAgo") LocalDateTime thirtyDaysAgo,
            @Param("fourteenDaysAgo") LocalDateTime fourteenDaysAgo
    );
}
