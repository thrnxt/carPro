package kz.car.maintenance.repository;

import kz.car.maintenance.model.ReplacedComponent;
import kz.car.maintenance.repository.projection.admin.AdminLabeledCountView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ReplacedComponentRepository extends JpaRepository<ReplacedComponent, Long> {

    @Query(value = """
            select
                cc.name as label,
                cc.category as secondaryLabel,
                count(rc.id) as count
            from replaced_components rc
            join car_components cc on cc.id = rc.car_component_id
            join maintenance_records mr on mr.id = rc.maintenance_record_id
            where mr.status = 'COMPLETED'
              and mr.service_date >= :dateFrom
              and mr.service_date <= :dateTo
            group by cc.name, cc.category
            order by count(rc.id) desc, cc.name asc
            """, nativeQuery = true)
    List<AdminLabeledCountView> findTopReplacedComponents(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo
    );
}
