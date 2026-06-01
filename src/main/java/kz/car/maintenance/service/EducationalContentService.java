package kz.car.maintenance.service;

import kz.car.maintenance.dto.admin.AdminContentUpsertRequest;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.EducationalContent;
import kz.car.maintenance.repository.EducationalContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EducationalContentService {
    
    private final EducationalContentRepository educationalContentRepository;
    
    @Transactional
    public EducationalContent createContent(EducationalContent content) {
        return educationalContentRepository.save(content);
    }

    @Transactional
    public EducationalContent createContent(AdminContentUpsertRequest request) {
        EducationalContent content = new EducationalContent();
        applyRequest(content, request);
        return educationalContentRepository.save(content);
    }

    public List<EducationalContent> getPublishedContent() {
        return educationalContentRepository.findByStatusOrderBySortOrderAscIdAsc(EducationalContent.ContentStatus.PUBLISHED);
    }
    
    public List<EducationalContent> getContentByCategory(String category) {
        return educationalContentRepository.findByCategoryAndStatusOrderBySortOrderAscIdAsc(
                category, 
                EducationalContent.ContentStatus.PUBLISHED
        );
    }
    
    public List<EducationalContent> getContentByType(EducationalContent.ContentType type) {
        return educationalContentRepository.findByTypeAndStatusOrderBySortOrderAscIdAsc(
                type, 
                EducationalContent.ContentStatus.PUBLISHED
        );
    }
    
    public EducationalContent getContentById(Long id) {
        return educationalContentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Content not found"));
    }

    public List<EducationalContent> getContentForAdmin(
            String query,
            EducationalContent.ContentType type,
            EducationalContent.ContentStatus status,
            String category
    ) {
        return educationalContentRepository.findAllForAdmin(toPattern(query), type, status, normalizeCategory(category));
    }

    @Transactional
    public EducationalContent updateContent(Long id, EducationalContent content) {
        EducationalContent existing = getContentById(id);
        existing.setTitle(content.getTitle());
        existing.setContent(content.getContent());
        existing.setType(content.getType());
        existing.setVideoUrl(content.getVideoUrl());
        existing.setImageUrl(content.getImageUrl());
        existing.setCategory(content.getCategory());
        existing.setProvider(content.getProvider());
        existing.setDifficulty(content.getDifficulty());
        existing.setDurationMinutes(content.getDurationMinutes());
        existing.setSortOrder(content.getSortOrder());
        existing.setStatus(content.getStatus());
        return educationalContentRepository.save(existing);
    }

    @Transactional
    public EducationalContent updateContent(Long id, AdminContentUpsertRequest request) {
        EducationalContent existing = getContentById(id);
        applyRequest(existing, request);
        return educationalContentRepository.save(existing);
    }

    @Transactional
    public void deleteContent(Long id) {
        EducationalContent existing = getContentById(id);
        educationalContentRepository.delete(existing);
    }

    private void applyRequest(EducationalContent target, AdminContentUpsertRequest request) {
        target.setTitle(request.getTitle().trim());
        target.setContent(request.getContent().trim());
        target.setType(request.getType());
        target.setVideoUrl(blankToNull(request.getVideoUrl()));
        target.setImageUrl(blankToNull(request.getImageUrl()));
        target.setCategory(request.getCategory().trim());
        target.setProvider(blankToNull(request.getProvider()));
        target.setDifficulty(blankToNull(request.getDifficulty()));
        target.setDurationMinutes(request.getDurationMinutes());
        target.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        target.setStatus(request.getStatus());
    }

    private String toPattern(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return "%" + query.trim().toLowerCase() + "%";
    }

    private String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            return null;
        }
        return category.trim().toLowerCase(Locale.ROOT);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
