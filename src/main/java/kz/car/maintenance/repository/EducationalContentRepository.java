package kz.car.maintenance.repository;

import kz.car.maintenance.model.EducationalContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationalContentRepository extends JpaRepository<EducationalContent, Long> {
    List<EducationalContent> findByStatusOrderBySortOrderAscIdAsc(EducationalContent.ContentStatus status);
    List<EducationalContent> findByCategoryAndStatusOrderBySortOrderAscIdAsc(String category, EducationalContent.ContentStatus status);
    List<EducationalContent> findByTypeAndStatusOrderBySortOrderAscIdAsc(EducationalContent.ContentType type, EducationalContent.ContentStatus status);
    boolean existsByTitle(String title);
}
