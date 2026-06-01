package kz.car.maintenance.repository;

import kz.car.maintenance.model.EducationalContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationalContentRepository extends JpaRepository<EducationalContent, Long> {
    List<EducationalContent> findByStatusOrderBySortOrderAscIdAsc(EducationalContent.ContentStatus status);
    List<EducationalContent> findByCategoryAndStatusOrderBySortOrderAscIdAsc(String category, EducationalContent.ContentStatus status);
    List<EducationalContent> findByTypeAndStatusOrderBySortOrderAscIdAsc(EducationalContent.ContentType type, EducationalContent.ContentStatus status);
    boolean existsByTitle(String title);

    @Query("""
            select c from EducationalContent c
            where (:queryPattern is null
                   or lower(c.title) like :queryPattern
                   or lower(coalesce(c.provider, '')) like :queryPattern
                   or lower(coalesce(c.category, '')) like :queryPattern)
              and (:type is null or c.type = :type)
              and (:status is null or c.status = :status)
              and (:category is null or lower(c.category) = :category)
            order by c.sortOrder asc, c.updatedAt desc, c.id desc
            """)
    List<EducationalContent> findAllForAdmin(
            @Param("queryPattern") String queryPattern,
            @Param("type") EducationalContent.ContentType type,
            @Param("status") EducationalContent.ContentStatus status,
            @Param("category") String category
    );
}
