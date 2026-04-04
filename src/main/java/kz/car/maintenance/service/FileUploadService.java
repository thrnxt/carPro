package kz.car.maintenance.service;

import kz.car.maintenance.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileUploadService {
    
    @Value("${app.file.upload-dir}")
    private String uploadDir;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf"
    );
    
    public String uploadFile(MultipartFile file, String subdirectory) throws IOException {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        if (file.getContentType() == null || !ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
            throw new BadRequestException("Unsupported file type. Allowed: jpeg, png, webp, pdf");
        }

        String normalizedSubdirectory = subdirectory == null ? "" : subdirectory.trim();
        if (normalizedSubdirectory.isEmpty()) {
            throw new BadRequestException("Subdirectory is required");
        }

        Path baseUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path uploadPath = baseUploadPath.resolve(normalizedSubdirectory).normalize();
        if (!uploadPath.startsWith(baseUploadPath)) {
            throw new BadRequestException("Invalid subdirectory path");
        }

        // Создание директории, если не существует
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Генерация уникального имени файла
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".") 
                ? originalFilename.substring(originalFilename.lastIndexOf(".")) 
                : "";
        String filename = UUID.randomUUID().toString() + extension;
        
        // Сохранение файла
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Возврат относительного пути для сохранения в БД
        return String.format("/uploads/%s/%s", subdirectory, filename);
    }
    
    public void deleteFile(String fileUrl) {
        try {
            if (fileUrl == null || !fileUrl.startsWith("/uploads/")) {
                throw new BadRequestException("Invalid file url");
            }

            Path baseUploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            String relativePath = fileUrl.substring("/uploads/".length());
            Path filePath = baseUploadPath.resolve(relativePath).normalize();
            if (!filePath.startsWith(baseUploadPath)) {
                throw new BadRequestException("Invalid file path");
            }

            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            log.error("Error deleting file: {}", fileUrl, e);
        }
    }
}
