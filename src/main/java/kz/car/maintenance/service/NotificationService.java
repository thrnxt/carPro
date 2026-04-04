package kz.car.maintenance.service;

import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.*;
import kz.car.maintenance.repository.CarRepository;
import kz.car.maintenance.repository.NotificationRepository;
import kz.car.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final CarRepository carRepository;
    @Autowired
    @Lazy
    private CarComponentService carComponentService;
    
    @Transactional
    public Notification createNotification(
            Long userId,
            String title,
            String message,
            Notification.NotificationType type,
            Notification.NotificationPriority priority,
            Car car) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .priority(priority)
                .isRead(false)
                .car(car)
                .build();
        
        return notificationRepository.save(notification);
    }
    
    public List<Notification> getUserNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }
    
    public long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return notificationRepository.countByUserAndIsReadFalse(user);
    }
    
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        
        if (!notification.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Unauthorized");
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }
    
    @Transactional
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        List<Notification> notifications = notificationRepository.findByUserAndIsReadFalse(user);
        notifications.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
    
    @Scheduled(cron = "0 0 9 * * ?") // Каждый день в 9:00
    @Transactional
    public void checkComponentWear() {
        List<Car> cars = carRepository.findAll();
        for (Car car : cars) {
            carComponentService.updateComponentWear(car);
        }
    }
}
