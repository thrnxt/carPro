package kz.car.maintenance.controller;

import kz.car.maintenance.dto.ChatContactDto;
import kz.car.maintenance.dto.MessageCreateRequest;
import kz.car.maintenance.dto.PagedResponse;
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

    @GetMapping("/contacts")
    public ResponseEntity<PagedResponse<ChatContactDto>> getChatContacts(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String query) {
        return ResponseEntity.ok(messageService.getChatContacts(user.getId(), page, size, query));
    }

    @GetMapping("/contacts/{contactId}")
    public ResponseEntity<ChatContactDto> getChatContact(
            @AuthenticationPrincipal User user,
            @PathVariable Long contactId) {
        return ResponseEntity.ok(messageService.getChatContact(user.getId(), contactId));
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
