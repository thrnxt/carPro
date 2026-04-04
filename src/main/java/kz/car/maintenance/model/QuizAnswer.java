package kz.car.maintenance.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quiz_answers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizAnswer {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private QuizQuestion question;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String answer; // Вариант ответа
    
    @Column(nullable = false)
    private Boolean isCorrect; // Правильный ли это ответ
}
