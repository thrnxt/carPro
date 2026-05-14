package kz.car.maintenance.service;

import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.exception.ForbiddenException;
import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.dto.ChatContactDto;
import kz.car.maintenance.dto.PagedResponse;
import kz.car.maintenance.model.Message;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.MessageRepository;
import kz.car.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {
    
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    @Transactional
    public Message sendMessage(
            Long senderId,
            Long receiverId,
            String content,
            Message.MessageType type,
            Long maintenanceRecordId) {
        
        // Проверка: пользователь не может отправить сообщение самому себе
        if (senderId.equals(receiverId)) {
            throw new BadRequestException("Cannot send message to yourself");
        }
        
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new NotFoundException("Sender not found"));
        
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new NotFoundException("Receiver not found"));
        
        if (content == null || content.trim().isEmpty()) {
            throw new BadRequestException("Message content cannot be empty");
        }
        
        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content.trim())
                .type(type != null ? type : Message.MessageType.CHAT)
                .isRead(false)
                .build();
        
        message = messageRepository.save(message);
        
        // Создание уведомления о новом сообщении
        notificationService.createNotification(
                receiverId,
                "Новое сообщение",
                String.format("Сообщение от %s %s", sender.getFirstName(), sender.getLastName()),
                kz.car.maintenance.model.Notification.NotificationType.MESSAGE_RECEIVED,
                kz.car.maintenance.model.Notification.NotificationPriority.NORMAL,
                null
        );
        
        return message;
    }
    
    @Transactional
    public List<Message> getConversation(Long userId1, Long userId2) {
        // Проверяем существование пользователей
        if (!userRepository.existsById(userId1)) {
            throw new NotFoundException("User with id " + userId1 + " not found");
        }
        if (!userRepository.existsById(userId2)) {
            throw new NotFoundException("User with id " + userId2 + " not found");
        }
        
        // Получаем беседу между двумя пользователями напрямую через query
        List<Message> conversation = messageRepository.findConversationBetweenUsers(userId1, userId2);

        conversation.stream()
                .filter(message -> message.getReceiver().getId().equals(userId1) && message.getSender().getId().equals(userId2))
                .filter(message -> !Boolean.TRUE.equals(message.getIsRead()))
                .forEach(message -> message.setIsRead(true));

        return conversation;
    }

    public PagedResponse<ChatContactDto> getChatContacts(Long currentUserId, int page, int size, String query) {
        if (!userRepository.existsById(currentUserId)) {
            throw new NotFoundException("User not found");
        }

        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 5);
        PageRequest pageRequest = PageRequest.of(safePage, safeSize);
        String normalizedQuery = query != null ? query.trim() : "";

        Page<User> contactsPage = normalizedQuery.isEmpty()
                ? userRepository.findRandomActiveChatContacts(currentUserId, pageRequest)
                : userRepository.searchActiveChatContacts(currentUserId, User.UserStatus.ACTIVE, normalizedQuery, pageRequest);

        return new PagedResponse<>(
                contactsPage.getContent().stream().map(this::toChatContactDto).toList(),
                contactsPage.getNumber(),
                contactsPage.getSize(),
                contactsPage.getTotalElements(),
                contactsPage.getTotalPages(),
                contactsPage.isFirst(),
                contactsPage.isLast()
        );
    }

    public ChatContactDto getChatContact(Long currentUserId, Long contactId) {
        if (currentUserId.equals(contactId)) {
            throw new BadRequestException("Cannot open chat with yourself");
        }

        User contact = userRepository.findById(contactId)
                .orElseThrow(() -> new NotFoundException("Receiver not found"));

        if (contact.getStatus() != User.UserStatus.ACTIVE) {
            throw new NotFoundException("Receiver not found");
        }

        return toChatContactDto(contact);
    }
    
    public List<Message> getUnreadMessages(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));
        return messageRepository.findByReceiverAndIsReadFalse(user);
    }
    
    @Transactional
    public void markAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found"));
        
        if (!message.getReceiver().getId().equals(userId)) {
            throw new ForbiddenException("Unauthorized");
        }
        
        message.setIsRead(true);
        messageRepository.save(message);
    }

    private ChatContactDto toChatContactDto(User user) {
        return new ChatContactDto(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getAvatarUrl(),
                user.getRole()
        );
    }
}
