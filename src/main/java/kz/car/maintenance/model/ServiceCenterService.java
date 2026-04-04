package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "service_center_services")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCenterService {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_center_id", nullable = false)
    private ServiceCenter serviceCenter;
    
    @Column(nullable = false)
    private String name; // Название услуги
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private BigDecimal price; // Цена услуги
}
