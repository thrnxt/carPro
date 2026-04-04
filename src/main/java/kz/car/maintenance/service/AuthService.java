package kz.car.maintenance.service;

import kz.car.maintenance.dto.AuthRequest;
import kz.car.maintenance.dto.AuthResponse;
import kz.car.maintenance.dto.RegisterRequest;
import kz.car.maintenance.exception.BadRequestException;
import kz.car.maintenance.model.User;
import kz.car.maintenance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userService.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        if (request.getRole() != null && request.getRole() != User.UserRole.USER) {
            throw new BadRequestException("Self-registration is allowed only for USER role");
        }
        
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .role(User.UserRole.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
        
        user = userService.save(user);
        
        String token = jwtService.generateToken(user);

        return buildAuthResponse(user, token);
    }
    
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        User user = userService.findByEmail(request.getEmail());
        String token = jwtService.generateToken(user);

        return buildAuthResponse(user, token);
    }

    public AuthResponse getCurrentUser(String email) {
        return buildAuthResponse(userService.findByEmail(email), null);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .userId(user.getId())
                .build();
    }
}
