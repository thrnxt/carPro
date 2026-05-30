package kz.car.maintenance.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "maintenance_photos")
@Data
@EqualsAndHashCode(exclude = {"maintenanceRecord", "replacedComponent"})
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenancePhoto {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_record_id", nullable = false)
    @JsonIgnore
    private MaintenanceRecord maintenanceRecord;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_component_id")
    @JsonIgnore
    private ReplacedComponent replacedComponent;

    @Column(name = "replaced_component_id", insertable = false, updatable = false)
    private Long replacedComponentId;
    
    @Column(nullable = false)
    private String fileUrl; // URL фотографии
    
    private String description; // Описание фото
}
