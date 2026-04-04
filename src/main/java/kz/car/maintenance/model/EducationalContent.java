package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "educational_content")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationalContent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title; // Заголовок
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content; // Содержание (статья)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentType type;
    
    private String videoUrl; // URL видео (если тип VIDEO)
    
    private String imageUrl; // Изображение
    
    @Column(nullable = false)
    private String category; // Категория (например, "Обслуживание", "Зима", "Дальняя поездка")
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;
    
    @OneToMany(mappedBy = "content", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<Quiz> quizzes; // Связанные квизы
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = ContentStatus.DRAFT;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum ContentType {
        ARTICLE,  // Статья
        VIDEO,    // Видео
        CHECKLIST // Чек-лист
    }
    
    public enum ContentStatus {
        DRAFT,    // Черновик
        PUBLISHED // Опубликовано
    }
}
