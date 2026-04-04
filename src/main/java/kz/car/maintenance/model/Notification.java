package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false)
    private String title; // Заголовок уведомления
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message; // Текст уведомления
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationPriority priority;
    
    @Column(nullable = false)
    private Boolean isRead;
    
    private String actionUrl; // URL для перехода при клике
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id")
    private Car car; // Связь с автомобилем (если применимо)
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_component_id")
    private CarComponent carComponent; // Связь с деталью (если применимо)
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) {
            isRead = false;
        }
        if (priority == null) {
            priority = NotificationPriority.NORMAL;
        }
    }
    
    public enum NotificationType {
        MAINTENANCE_DUE,      // Требуется обслуживание
        COMPONENT_WEAR,       // Износ детали
        MILEAGE_REMINDER,     // Напоминание по пробегу
        BOOKING_CONFIRMED,    // Подтверждение записи
        MAINTENANCE_COMPLETED, // Обслуживание завершено
        MESSAGE_RECEIVED,     // Получено сообщение
        SYSTEM                 // Системное уведомление
    }
    
    public enum NotificationPriority {
        LOW,
        NORMAL,
        HIGH,
        CRITICAL
    }
}
