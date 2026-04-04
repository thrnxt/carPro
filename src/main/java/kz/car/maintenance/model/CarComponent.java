package kz.car.maintenance.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "car_components")
@Data
@EqualsAndHashCode(exclude = {"car"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "car"})
public class CarComponent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "components", "maintenanceRecords", "bookings", "owner"})
    private Car car;
    
    @Column(nullable = false)
    private String name; // Название детали (например, "Ремень ГРМ", "Масло двигателя")
    
    @Column(nullable = false)
    private String category; // Категория (например, "Двигатель", "Подвеска", "Тормоза")
    
    private String subcategory; // Подкатегория (например, "Кривошипно-шатунный механизм")
    
    private String icon; // Иконка/эмодзи для детали
    
    private String description;
    
    @Column(nullable = false)
    private Long maxMileage; // Максимальный пробег до замены (км)
    
    @Column(nullable = false)
    private Integer maxMonths; // Максимальный срок службы (месяцы)
    
    @Column(nullable = true) // Nullable для совместимости с существующими данными
    private Double wearCoefficient; // Коэффициент износа (0.1-2.0), определяет скорость износа
    
    private Long currentMileage; // Пробег при последней замене
    
    private LocalDate lastReplacementDate; // Дата последней замены
    
    @Column(nullable = false)
    private Integer wearLevel; // Уровень износа в процентах (0-100)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComponentStatus status;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ComponentStatus.NORMAL;
        }
        if (wearLevel == null) {
            wearLevel = 0;
        }
        if (wearCoefficient == null) {
            wearCoefficient = 1.0; // Значение по умолчанию
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum ComponentStatus {
        NEW,        // Новая
        NORMAL,     // Нормальное состояние
        WARNING,    // Требует внимания
        CRITICAL    // Критический износ
    }
}
