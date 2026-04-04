package kz.car.maintenance.repository;

import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.ServiceCenterClient;
import kz.car.maintenance.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceCenterClientRepository extends JpaRepository<ServiceCenterClient, Long> {
    List<ServiceCenterClient> findByServiceCenterOrderByUpdatedAtDesc(ServiceCenter serviceCenter);
    Optional<ServiceCenterClient> findByServiceCenterAndClient(ServiceCenter serviceCenter, User client);
    List<ServiceCenterClient> findByClientOrderByUpdatedAtDesc(User client);
}
