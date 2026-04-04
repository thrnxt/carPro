package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "maintenance_records")
@Data
@EqualsAndHashCode(exclude = {"car", "serviceCenter", "photos", "replacedComponents", "invoice"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_center_id")
    private ServiceCenter serviceCenter;
    
    @Column(nullable = false)
    private String workType; // Тип работы (например, "Замена масла", "Ремонт подвески")
    
    @Column(columnDefinition = "TEXT")
    private String description; // Описание выполненной работы
    
    @Column(nullable = false)
    private LocalDate serviceDate; // Дата обслуживания
    
    @Column(nullable = false)
    private Long mileageAtService; // Пробег на момент обслуживания
    
    private BigDecimal cost; // Стоимость работ
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecordStatus status;
    
    @OneToMany(mappedBy = "maintenanceRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<MaintenancePhoto> photos;
    
    @OneToMany(mappedBy = "maintenanceRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<ReplacedComponent> replacedComponents;
    
    @OneToOne(mappedBy = "maintenanceRecord", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Invoice invoice;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = RecordStatus.COMPLETED;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum RecordStatus {
        SCHEDULED,  // Запланировано
        IN_PROGRESS, // В процессе
        COMPLETED,  // Завершено
        CANCELLED   // Отменено
    }
}
