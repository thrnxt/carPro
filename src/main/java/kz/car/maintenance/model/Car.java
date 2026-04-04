package kz.car.maintenance.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "cars")
@Data
@EqualsAndHashCode(exclude = {"owner", "components", "maintenanceRecords", "bookings"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Car {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "cars", "serviceCenter", "sentMessages", "receivedMessages", "password"})
    private User owner;
    
    @Column(nullable = false)
    private String brand; // Марка (Toyota, BMW и т.д.)
    
    @Column(nullable = false)
    private String model; // Модель
    
    @Column(nullable = false)
    private Integer year; // Год выпуска
    
    @Column(unique = true)
    private String vin; // VIN номер
    
    @Column(nullable = false)
    private String licensePlate; // Гос. номер
    
    private String color;
    
    @Column(nullable = false)
    private Long mileage; // Пробег в км
    
    @Enumerated(EnumType.STRING)
    private DrivingStyle drivingStyle; // Стиль вождения
    
    private LocalDate lastServiceDate; // Дата последнего ТО
    
    private String imageUrl; // Фото автомобиля
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<CarComponent> components;
    
    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<MaintenanceRecord> maintenanceRecords;
    
    @OneToMany(mappedBy = "car", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private Set<Booking> bookings;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (drivingStyle == null) {
            drivingStyle = DrivingStyle.MODERATE;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum DrivingStyle {
        CALM,      // Спокойный
        MODERATE,  // Умеренный
        AGGRESSIVE // Агрессивный
    }
}
