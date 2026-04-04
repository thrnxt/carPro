package kz.car.maintenance.repository;

import kz.car.maintenance.model.Review;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByServiceCenter(ServiceCenter serviceCenter);
    Optional<Review> findByServiceCenterAndUser(ServiceCenter serviceCenter, User user);
}
