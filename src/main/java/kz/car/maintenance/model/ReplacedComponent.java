package kz.car.maintenance.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "replaced_components")
@Data
@EqualsAndHashCode(exclude = {"maintenanceRecord", "carComponent"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplacedComponent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_record_id", nullable = false)
    @JsonIgnore
    private MaintenanceRecord maintenanceRecord;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_component_id", nullable = false)
    private CarComponent carComponent;
    
    @Column(nullable = false)
    private LocalDate replacementDate;
    
    private String partNumber; // Номер детали
    private String manufacturer; // Производитель
    private String notes; // Примечания
}
