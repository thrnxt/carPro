package kz.car.maintenance.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoices")
@Data
@EqualsAndHashCode(exclude = {"maintenanceRecord", "serviceCenter", "car", "client"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_record_id", unique = true)
    @JsonIgnore
    private MaintenanceRecord maintenanceRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_center_id")
    private ServiceCenter serviceCenter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id")
    private Car car;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;
    
    @Column(nullable = false, unique = true)
    private String invoiceNumber; // Номер счета
    
    @Column(nullable = false)
    private LocalDate issueDate; // Дата выдачи
    
    @Column(nullable = false)
    private BigDecimal totalAmount; // Общая сумма
    
    private BigDecimal taxAmount; // НДС

    @Column(nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvoiceStatus status;
    
    @Column(columnDefinition = "TEXT")
    private String notes; // Примечания

    @Column(columnDefinition = "TEXT")
    private String items; // JSON массива позиций счета
    
    private String pdfUrl; // URL PDF файла счета
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (issueDate == null) {
            issueDate = LocalDate.now();
        }
        if (currency == null || currency.isBlank()) {
            currency = "KZT";
        }
        if (status == null) {
            status = InvoiceStatus.CREATED;
        }
    }

    public enum InvoiceStatus {
        CREATED,
        PAID,
        CANCELLED
    }
}
