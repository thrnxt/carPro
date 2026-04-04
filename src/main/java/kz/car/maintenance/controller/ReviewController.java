package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.ReviewCreateRequest;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.model.Review;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.ReviewRepository;
import kz.car.maintenance.repository.ServiceCenterRepository;
import kz.car.maintenance.service.ServiceCenterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/service-centers")
@RequiredArgsConstructor
public class ReviewController {
    
    private final ReviewRepository reviewRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    private final ServiceCenterService serviceCenterService;
    
    @GetMapping("/{id}/reviews")
    public ResponseEntity<List<Review>> getServiceCenterReviews(@PathVariable Long id) {
        var serviceCenter = serviceCenterService.getServiceCenterById(id);
        return ResponseEntity.ok(reviewRepository.findByServiceCenter(serviceCenter));
    }
    
    @PostMapping("/{id}/reviews")
    public ResponseEntity<Review> createReview(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @Valid @RequestBody ReviewCreateRequest request) {

        if (user == null) {
            throw new BadRequestException("User is not authenticated");
        }
        
        var serviceCenter = serviceCenterService.getServiceCenterById(id);
        if (reviewRepository.findByServiceCenterAndUser(serviceCenter, user).isPresent()) {
            throw new BadRequestException("You already left a review for this service center");
        }
        
        Review review = Review.builder()
                .serviceCenter(serviceCenter)
                .user(user)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();
        
        review = reviewRepository.save(review);
        
        // Обновление рейтинга сервисного центра
        updateServiceCenterRating(serviceCenter.getId());
        
        return ResponseEntity.ok(review);
    }
    
    private void updateServiceCenterRating(Long serviceCenterId) {
        var serviceCenter = serviceCenterService.getServiceCenterById(serviceCenterId);
        var reviews = reviewRepository.findByServiceCenter(serviceCenter);
        
        double avgRating = reviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(0.0);

        serviceCenter.setRating(java.math.BigDecimal.valueOf(avgRating));
        serviceCenter.setReviewCount(reviews.size());
        serviceCenterRepository.save(serviceCenter);
    }
}
