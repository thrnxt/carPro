package kz.car.maintenance.service;

import kz.car.maintenance.exception.NotFoundException;
import kz.car.maintenance.model.ServiceCenter;
import kz.car.maintenance.model.User;
import kz.car.maintenance.repository.ServiceCenterRepository;
import kz.car.maintenance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    
    private final UserRepository userRepository;
    private final ServiceCenterRepository serviceCenterRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return user;
    }
    
    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }
    
    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + id));
    }
    
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByEmailAndIdNot(String email, Long userId) {
        return userRepository.existsByEmailAndIdNot(email, userId);
    }
    
    public User save(User user) {
        return userRepository.save(user);
    }
    
    public List<User> findAll() {
        return userRepository.findAll();
    }

    public List<User> findAllForAdmin(String query, User.UserRole role, User.UserStatus status) {
        String queryPattern = toPattern(query);
        return userRepository.findAllForAdmin(queryPattern, role, status);
    }

    public User updateStatus(Long id, User.UserStatus status) {
        User user = findById(id);
        guardSelfMutation(user, user.getRole(), status);
        user.setStatus(status);
        return userRepository.save(user);
    }

    public User updateRole(Long id, User.UserRole role) {
        User user = findById(id);
        ServiceCenter linkedServiceCenter = serviceCenterRepository.findByUser(user).orElse(null);

        if (role == User.UserRole.SERVICE_CENTER && linkedServiceCenter == null) {
            throw new IllegalArgumentException("Cannot assign SERVICE_CENTER role without a linked service center profile");
        }

        if (user.getRole() == User.UserRole.SERVICE_CENTER && role != User.UserRole.SERVICE_CENTER && linkedServiceCenter != null) {
            throw new IllegalArgumentException("Cannot remove SERVICE_CENTER role while a linked service center profile exists");
        }

        guardSelfMutation(user, role, user.getStatus());
        user.setRole(role);
        return userRepository.save(user);
    }

    private String toPattern(String query) {
        if (query == null || query.isBlank()) {
            return null;
        }
        return "%" + query.trim().toLowerCase() + "%";
    }

    private void guardSelfMutation(User targetUser, User.UserRole nextRole, User.UserStatus nextStatus) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : null;

        if (currentUsername == null || !currentUsername.equalsIgnoreCase(targetUser.getEmail())) {
            return;
        }

        if (nextRole != User.UserRole.ADMIN) {
            throw new IllegalArgumentException("You cannot remove the ADMIN role from the current account");
        }

        if (nextStatus != User.UserStatus.ACTIVE) {
            throw new IllegalArgumentException("You cannot change the current account to a non-active status");
        }
    }
}
