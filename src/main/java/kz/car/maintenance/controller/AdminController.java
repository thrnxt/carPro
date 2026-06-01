package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.admin.AdminAnalyticsResponse;
import kz.car.maintenance.dto.admin.AdminContentDto;
import kz.car.maintenance.dto.admin.AdminContentUpsertRequest;
import kz.car.maintenance.dto.admin.AdminReportType;
import kz.car.maintenance.dto.admin.AdminServiceCenterDto;
import kz.car.maintenance.dto.admin.AdminUserDto;
import kz.car.maintenance.model.EducationalContent;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.AdminAnalyticsService;
import kz.car.maintenance.service.AdminCsvExportService;
import kz.car.maintenance.service.EducationalContentService;
import kz.car.maintenance.service.ServiceCenterService;
import kz.car.maintenance.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private static final MediaType CSV_MEDIA_TYPE = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final UserService userService;
    private final ServiceCenterService serviceCenterService;
    private final EducationalContentService educationalContentService;
    private final AdminAnalyticsService adminAnalyticsService;
    private final AdminCsvExportService adminCsvExportService;

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserDto>> getUsers(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) User.UserRole role,
            @RequestParam(required = false) User.UserStatus status
    ) {
        List<AdminUserDto> users = userService.findAllForAdmin(query, role, status).stream()
                .map(AdminUserDto::from)
                .toList();
        return ResponseEntity.ok(users);
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<AdminUserDto> updateUserStatus(
            @PathVariable Long id,
            @RequestParam User.UserStatus status
    ) {
        return ResponseEntity.ok(AdminUserDto.from(userService.updateStatus(id, status)));
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<AdminUserDto> updateUserRole(
            @PathVariable Long id,
            @RequestParam User.UserRole role
    ) {
        return ResponseEntity.ok(AdminUserDto.from(userService.updateRole(id, role)));
    }

    @GetMapping("/service-centers")
    public ResponseEntity<List<AdminServiceCenterDto>> getServiceCenters(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) ServiceCenter.ServiceCenterStatus status
    ) {
        List<AdminServiceCenterDto> serviceCenters = serviceCenterService.getServiceCentersForAdmin(query, status).stream()
                .map(AdminServiceCenterDto::from)
                .toList();
        return ResponseEntity.ok(serviceCenters);
    }

    @GetMapping("/service-centers/pending")
    public ResponseEntity<List<AdminServiceCenterDto>> getPendingServiceCenters() {
        List<AdminServiceCenterDto> serviceCenters = serviceCenterService.getServiceCentersByStatus(
                        ServiceCenter.ServiceCenterStatus.PENDING_VERIFICATION
                ).stream()
                .map(AdminServiceCenterDto::from)
                .toList();
        return ResponseEntity.ok(serviceCenters);
    }

    @PatchMapping("/service-centers/{id}/status")
    public ResponseEntity<AdminServiceCenterDto> updateServiceCenterStatus(
            @PathVariable Long id,
            @RequestParam ServiceCenter.ServiceCenterStatus status
    ) {
        return ResponseEntity.ok(AdminServiceCenterDto.from(serviceCenterService.updateServiceCenterStatus(id, status)));
    }

    @GetMapping("/educational-content")
    public ResponseEntity<List<AdminContentDto>> getEducationalContent(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) EducationalContent.ContentType type,
            @RequestParam(required = false) EducationalContent.ContentStatus status,
            @RequestParam(required = false) String category
    ) {
        List<AdminContentDto> content = educationalContentService.getContentForAdmin(query, type, status, category).stream()
                .map(AdminContentDto::from)
                .toList();
        return ResponseEntity.ok(content);
    }

    @PostMapping("/educational-content")
    public ResponseEntity<AdminContentDto> createContent(@Valid @RequestBody AdminContentUpsertRequest request) {
        return ResponseEntity.ok(AdminContentDto.from(educationalContentService.createContent(request)));
    }

    @PutMapping("/educational-content/{id}")
    public ResponseEntity<AdminContentDto> updateContent(
            @PathVariable Long id,
            @Valid @RequestBody AdminContentUpsertRequest request
    ) {
        return ResponseEntity.ok(AdminContentDto.from(educationalContentService.updateContent(id, request)));
    }

    @DeleteMapping("/educational-content/{id}")
    public ResponseEntity<Void> deleteContent(@PathVariable Long id) {
        educationalContentService.deleteContent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsResponse> getAnalytics(
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo
    ) {
        return ResponseEntity.ok(adminAnalyticsService.getAnalytics(dateFrom, dateTo));
    }

    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam AdminReportType type,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo
    ) {
        AdminAnalyticsResponse analytics = adminAnalyticsService.getAnalytics(dateFrom, dateTo);

        byte[] body = switch (type) {
            case USER_ACTIVITY -> adminCsvExportService.exportUserActivity(analytics.userActivityReport());
            case SERVICE_ACTIVITY -> adminCsvExportService.exportServiceActivity(analytics.serviceActivityReport());
        };

        String filename = adminCsvExportService.buildFilename(type, dateFrom, dateTo);

        return ResponseEntity.ok()
                .contentType(CSV_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .body(body);
    }
}
