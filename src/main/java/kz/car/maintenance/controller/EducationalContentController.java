package kz.car.maintenance.controller;

import kz.car.maintenance.model.EducationalContent;
import kz.car.maintenance.service.EducationalContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/educational-content")
@RequiredArgsConstructor
public class EducationalContentController {
    
    private final EducationalContentService educationalContentService;
    
    @GetMapping
    public ResponseEntity<List<EducationalContent>> getPublishedContent() {
        return ResponseEntity.ok(educationalContentService.getPublishedContent());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<EducationalContent>> getContentByCategory(@PathVariable String category) {
        return ResponseEntity.ok(educationalContentService.getContentByCategory(category));
    }
    
    @GetMapping("/type/{type}")
    public ResponseEntity<List<EducationalContent>> getContentByType(@PathVariable EducationalContent.ContentType type) {
        return ResponseEntity.ok(educationalContentService.getContentByType(type));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<EducationalContent> getContentById(@PathVariable Long id) {
        return ResponseEntity.ok(educationalContentService.getContentById(id));
    }
}
