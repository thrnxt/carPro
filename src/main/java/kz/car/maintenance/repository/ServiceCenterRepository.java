package kz.car.maintenance.repository;

import kz.car.maintenance.model.ServiceCenter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface ServiceCenterRepository extends JpaRepository<ServiceCenter, Long> {
    @Query("SELECT sc FROM ServiceCenter sc WHERE " +
           "6371 * acos(cos(radians(:lat)) * cos(radians(sc.latitude)) * " +
           "cos(radians(sc.longitude) - radians(:lng)) + " +
           "sin(radians(:lat)) * sin(radians(sc.latitude))) <= :radius")
    List<ServiceCenter> findNearby(@Param("lat") BigDecimal latitude,
                                    @Param("lng") BigDecimal longitude,
                                    @Param("radius") double radiusKm);
    
    List<ServiceCenter> findByStatus(ServiceCenter.ServiceCenterStatus status);
    List<ServiceCenter> findByCity(String city);
    List<ServiceCenter> findByRegion(String region);
    java.util.Optional<ServiceCenter> findByUser(kz.car.maintenance.model.User user);
}
