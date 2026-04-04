package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "component_subcategories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentSubcategory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ComponentCategory category;
    
    @Column(nullable = false)
    private String name; // Название подкатегории (например, "Кривошипно-шатунный механизм")
    
    private String icon; // Иконка для подкатегории
    
    @Column(columnDefinition = "TEXT")
    private String description;
}
