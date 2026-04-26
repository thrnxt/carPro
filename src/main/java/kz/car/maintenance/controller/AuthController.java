package kz.car.maintenance.controller;

import jakarta.validation.Valid;
import kz.car.maintenance.dto.AuthRequest;
import kz.car.maintenance.dto.AuthResponse;
import kz.car.maintenance.dto.RegisterRequest;
import kz.car.maintenance.dto.UserProfileUpdateRequest;
import kz.car.maintenance.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
    
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthResponse> me(Authentication authentication) {
        return ResponseEntity.ok(authService.getCurrentUser(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<AuthResponse> updateMe(
            @Valid @RequestBody UserProfileUpdateRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(authService.updateCurrentUser(authentication.getName(), request));
    }
}
