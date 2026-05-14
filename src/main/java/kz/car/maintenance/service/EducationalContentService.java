package kz.car.maintenance.service;

import kz.car.maintenance.model.EducationalContent;
import kz.car.maintenance.repository.EducationalContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EducationalContentService {
    
    private final EducationalContentRepository educationalContentRepository;
    
    @Transactional
    public EducationalContent createContent(EducationalContent content) {
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
                .orElseThrow(() -> new RuntimeException("Content not found"));
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
    public void deleteContent(Long id) {
        educationalContentRepository.deleteById(id);
    }
}
