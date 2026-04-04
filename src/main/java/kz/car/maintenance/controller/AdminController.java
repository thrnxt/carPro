package kz.car.maintenance.controller;

import kz.car.maintenance.model.EducationalContent;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.EducationalContentService;
import kz.car.maintenance.service.ServiceCenterService;
import kz.car.maintenance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    
    private final UserService userService;
    private final ServiceCenterService serviceCenterService;
    private final EducationalContentService educationalContentService;
    
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        // В реальном приложении нужна пагинация
        return ResponseEntity.ok(userService.findAll());
    }
    
    @PatchMapping("/users/{id}/status")
    public ResponseEntity<User> updateUserStatus(
            @PathVariable Long id,
            @RequestParam User.UserStatus status) {
        User user = userService.findById(id);
        user.setStatus(status);
        return ResponseEntity.ok(userService.save(user));
    }
    
    @GetMapping("/service-centers/pending")
    public ResponseEntity<List<ServiceCenter>> getPendingServiceCenters() {
        return ResponseEntity.ok(serviceCenterService.getServiceCentersByStatus(
                ServiceCenter.ServiceCenterStatus.PENDING_VERIFICATION));
    }
    
    @PatchMapping("/service-centers/{id}/status")
    public ResponseEntity<ServiceCenter> updateServiceCenterStatus(
            @PathVariable Long id,
            @RequestParam ServiceCenter.ServiceCenterStatus status) {
        return ResponseEntity.ok(serviceCenterService.updateServiceCenterStatus(id, status));
    }
    
    @PostMapping("/educational-content")
    public ResponseEntity<EducationalContent> createContent(@RequestBody EducationalContent content) {
        return ResponseEntity.ok(educationalContentService.createContent(content));
    }
    
    @PutMapping("/educational-content/{id}")
    public ResponseEntity<EducationalContent> updateContent(
            @PathVariable Long id,
            @RequestBody EducationalContent content) {
        return ResponseEntity.ok(educationalContentService.updateContent(id, content));
    }
    
    @DeleteMapping("/educational-content/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id) {
        educationalContentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }
}
