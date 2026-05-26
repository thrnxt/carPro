package kz.car.maintenance.service;

import kz.car.maintenance.model.Car;
import kz.car.maintenance.model.Notification;
import kz.car.maintenance.repository.CarRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Шедуллер трекинга пробега.
 *
 * Задача 1 (ежедневно в 00:05): пересчёт расчётного пробега для всех авто,
 *   у которых задана частота использования (drivingFrequency).
 *   Формула: estimatedMileage = mileage + (kmPerDay × дней с последнего подтверждения)
 *
 * Задача 2 (ежедневно в 09:00): отправка напоминаний об уточнении пробега
 *   тем пользователям, которые 30+ дней не подтверждали пробег.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MileageSchedulerService {

    private final CarRepository carRepository;
    private final NotificationService notificationService;

    // ─── Задача 1: ежедневный пересчёт расчётного пробега ────────────────────

    @Scheduled(cron = "0 5 0 * * ?") // Каждый день в 00:05
    @Transactional
    public void recalculateEstimatedMileage() {
        log.info("[MileageScheduler] Запуск пересчёта расчётного пробега...");

        List<Car> cars = carRepository.findByDrivingFrequencyIsNotNull();
        int updated = 0;

        for (Car car : cars) {
            try {
                updated += recalculateForCar(car) ? 1 : 0;
            } catch (Exception e) {
                log.error("[MileageScheduler] Ошибка при пересчёте для авто id={}: {}", car.getId(), e.getMessage());
            }
        }

        log.info("[MileageScheduler] Пересчёт завершён. Обновлено авто: {}/{}", updated, cars.size());
    }

    /**
     * Пересчитывает estimatedMileage для одного авто.
     * @return true если данные были изменены
     */
    boolean recalculateForCar(Car car) {
        if (car.getDrivingFrequency() == null) return false;

        LocalDateTime baseDate = car.getConfirmedMileageAt() != null
                ? car.getConfirmedMileageAt()
                : car.getCreatedAt();

        if (baseDate == null) return false;

        long daysSinceConfirmation = ChronoUnit.DAYS.between(baseDate, LocalDateTime.now());
        if (daysSinceConfirmation < 0) daysSinceConfirmation = 0;

        int kmPerDay = car.getDrivingFrequency().getKmPerDay();
        long newEstimate = car.getMileage() + (kmPerDay * daysSinceConfirmation);

        // Обновляем только если значение изменилось
        if (!Long.valueOf(newEstimate).equals(car.getEstimatedMileage())) {
            car.setEstimatedMileage(newEstimate);
            car.setMileageIsEstimated(daysSinceConfirmation > 0); // false = только что подтвердили
            carRepository.save(car);
            return true;
        }

        return false;
    }

    // ─── Задача 2: напоминания об уточнении пробега ───────────────────────────

    @Scheduled(cron = "0 0 9 * * ?") // Каждый день в 09:00
    @Transactional
    public void sendMileageReminders() {
        log.info("[MileageScheduler] Проверка напоминаний об уточнении пробега...");

        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        LocalDateTime fourteenDaysAgo = LocalDateTime.now().minusDays(14);

        List<Car> cars = carRepository.findCarsNeedingMileageReminder(thirtyDaysAgo, fourteenDaysAgo);

        for (Car car : cars) {
            try {
                sendReminderForCar(car);
            } catch (Exception e) {
                log.error("[MileageScheduler] Ошибка отправки напоминания для авто id={}: {}", car.getId(), e.getMessage());
            }
        }

        log.info("[MileageScheduler] Отправлено напоминаний: {}", cars.size());
    }

    private void sendReminderForCar(Car car) {
        Long displayMileage = car.getEstimatedMileage() != null
                ? car.getEstimatedMileage()
                : car.getMileage();

        String title = String.format("Уточните пробег: %s %s", car.getBrand(), car.getModel());
        String message = String.format(
                "Расчётный пробег вашего авто сейчас ~%,d км. " +
                "Это приблизительная оценка — уточните реальный пробег, " +
                "чтобы уведомления о ТО были точными.",
                displayMileage
        );

        notificationService.createNotification(
                car.getOwner().getId(),
                title,
                message,
                Notification.NotificationType.MILEAGE_REMINDER,
                Notification.NotificationPriority.NORMAL,
                car
        );

        // Фиксируем время отправки напоминания
        car.setMileageReminderSentAt(LocalDateTime.now());
        carRepository.save(car);

        log.info("[MileageScheduler] Напоминание отправлено: userId={}, carId={}, displayMileage={}",
                car.getOwner().getId(), car.getId(), displayMileage);
    }
}
