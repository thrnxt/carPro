package kz.car.maintenance.controller;

import kz.car.maintenance.dto.MessageCreateRequest;
import kz.car.maintenance.model.Message;
import kz.car.maintenance.model.User;
import kz.car.maintenance.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {
    
    private final MessageService messageService;
    
    @PostMapping
    public ResponseEntity<Message> sendMessage(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid MessageCreateRequest request) {
        return ResponseEntity.ok(messageService.sendMessage(
                user.getId(),
                request.getReceiverId(),
                request.getContent(),
                request.getType(),
                null));
    }
    
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<Message>> getConversation(
            @AuthenticationPrincipal User user,
            @PathVariable Long userId) {
        return ResponseEntity.ok(messageService.getConversation(user.getId(), userId));
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<Message>> getUnreadMessages(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(messageService.getUnreadMessages(user.getId()));
    }
    
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        messageService.markAsRead(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
