package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "component_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentCategory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String name; // Название категории (например, "Двигатель", "Подвеска")
    
    private String icon; // Иконка/эмодзи для категории
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @OneToMany(mappedBy = "category", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ComponentSubcategory> subcategories;
}
