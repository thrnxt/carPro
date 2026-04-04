package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "service_centers")
@Data
@EqualsAndHashCode(exclude = {"user", "maintenanceRecords", "bookings", "reviews", "services"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCenter {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(nullable = false)
    private String name; // Название сервисного центра
    
    @Column(nullable = false)
    private String address;
    
    private String city;
    
    private String region; // Область/регион Казахстана
    
    @Column(nullable = false)
    private BigDecimal latitude; // Широта для геолокации
    
    @Column(nullable = false)
    private BigDecimal longitude; // Долгота для геолокации
    
    private String phoneNumber;
    
    private String email;
    
    private String website;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceCenterStatus status;
    
    private String licenseNumber; // Номер лицензии
    
    private String licenseDocumentUrl; // Документ лицензии
    
    private BigDecimal rating; // Рейтинг (0-5)
    
    private Integer reviewCount; // Количество отзывов
    
    private String logoUrl;
    
    @OneToMany(mappedBy = "serviceCenter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<MaintenanceRecord> maintenanceRecords;
    
    @OneToMany(mappedBy = "serviceCenter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Booking> bookings;
    
    @OneToMany(mappedBy = "serviceCenter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Review> reviews;
    
    @OneToMany(mappedBy = "serviceCenter", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<ServiceCenterService> services; // Услуги, предоставляемые центром
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ServiceCenterStatus.PENDING_VERIFICATION;
        }
        if (rating == null) {
            rating = BigDecimal.ZERO;
        }
        if (reviewCount == null) {
            reviewCount = 0;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum ServiceCenterStatus {
        PENDING_VERIFICATION, // Ожидает проверки
        ACTIVE,               // Активен
        SUSPENDED,            // Приостановлен
        REJECTED              // Отклонен
    }
}
