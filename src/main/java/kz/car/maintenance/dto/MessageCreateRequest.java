package kz.car.maintenance.dto;

import jakarta.validation.constraints.NotNull;
import kz.car.maintenance.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageCreateRequest {

    @NotNull(message = "Receiver ID is required")
    private Long receiverId;

    // Текст необязателен, если есть вложение — валидируется в сервисе
    private String content;

    private String attachmentUrl;

    private Message.MessageType type;
}
