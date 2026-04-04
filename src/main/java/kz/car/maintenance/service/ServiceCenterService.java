package kz.car.maintenance.service;

import kz.car.maintenance.dto.ServiceCenterUpdateRequest;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.ServiceCenterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceCenterService {
    
    private final ServiceCenterRepository serviceCenterRepository;
    private final UserService userService;
    
    @Transactional
    public ServiceCenter createServiceCenter(Long userId, ServiceCenter serviceCenter) {
        User user = userService.findById(userId);
        
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("User must have SERVICE_CENTER role");
        }

        if (serviceCenterRepository.findByUser(user).isPresent()) {
            throw new BadRequestException("Service center already exists for this user");
        }
        
        serviceCenter.setUser(user);
        serviceCenter.setStatus(ServiceCenter.ServiceCenterStatus.PENDING_VERIFICATION);
        
        return serviceCenterRepository.save(serviceCenter);
    }
    
    public List<ServiceCenter> findNearby(BigDecimal latitude, BigDecimal longitude, double radiusKm) {
        return serviceCenterRepository.findNearby(latitude, longitude, radiusKm);
    }
    
    public List<ServiceCenter> getServiceCentersByCity(String city) {
        return serviceCenterRepository.findByCity(city);
    }
    
    public List<ServiceCenter> getServiceCentersByRegion(String region) {
        return serviceCenterRepository.findByRegion(region);
    }
    
    public List<ServiceCenter> getServiceCentersByStatus(ServiceCenter.ServiceCenterStatus status) {
        return serviceCenterRepository.findByStatus(status);
    }
    
    public ServiceCenter getServiceCenterById(Long id) {
        return serviceCenterRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Service center not found"));
    }

    public ServiceCenter getMyServiceCenter(Long userId) {
        User user = userService.findById(userId);
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("Only service center users can access service center profile");
        }
        return serviceCenterRepository.findByUser(user)
                .orElseThrow(() -> new NotFoundException("Service center profile not found"));
    }
    
    @Transactional
    public ServiceCenter updateServiceCenterStatus(Long id, ServiceCenter.ServiceCenterStatus status) {
        ServiceCenter serviceCenter = getServiceCenterById(id);
        serviceCenter.setStatus(status);
        return serviceCenterRepository.save(serviceCenter);
    }

    @Transactional
    public ServiceCenter updateMyServiceCenter(Long userId, ServiceCenterUpdateRequest request) {
        User user = userService.findById(userId);
        if (user.getRole() != User.UserRole.SERVICE_CENTER) {
            throw new ForbiddenException("Only service center users can update service center profile");
        }

        ServiceCenter serviceCenter = getMyServiceCenter(userId);
        serviceCenter.setName(request.getName());
        serviceCenter.setAddress(request.getAddress());
        serviceCenter.setCity(request.getCity());
        serviceCenter.setRegion(request.getRegion());
        serviceCenter.setLatitude(request.getLatitude());
        serviceCenter.setLongitude(request.getLongitude());
        serviceCenter.setPhoneNumber(request.getPhoneNumber());
        serviceCenter.setEmail(request.getEmail());
        serviceCenter.setWebsite(request.getWebsite());
        serviceCenter.setDescription(request.getDescription());
        serviceCenter.setLicenseDocumentUrl(request.getLicenseDocumentUrl());
        serviceCenter.setLogoUrl(request.getLogoUrl());

        return serviceCenterRepository.save(serviceCenter);
    }
    
    public List<ServiceCenter> getAllActiveServiceCenters() {
        return serviceCenterRepository.findByStatus(ServiceCenter.ServiceCenterStatus.ACTIVE);
    }
}
