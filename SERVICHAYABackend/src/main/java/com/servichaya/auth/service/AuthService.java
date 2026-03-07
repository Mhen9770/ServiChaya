package com.servichaya.auth.service;

import com.servichaya.auth.dto.AuthResponse;
import com.servichaya.user.entity.UserAccount;
import com.servichaya.user.entity.UserRoleMaster;
import com.servichaya.user.entity.UserRoleMap;
import com.servichaya.user.repository.UserAccountRepository;
import com.servichaya.user.repository.UserRoleMapRepository;
import com.servichaya.user.repository.UserRoleMasterRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserAccountRepository userRepository;
    private final UserRoleMasterRepository roleRepository;
    private final UserRoleMapRepository roleMapRepository;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse authenticateWithOtp(String mobileNumber) {
        log.info("Authenticating user with OTP, mobileNumber: {}", mobileNumber);
        
        try {
            // Find or create user
            UserAccount user = userRepository.findByMobileNumber(mobileNumber)
                .orElseGet(() -> {
                    log.info("User not found for mobileNumber: {}, creating new user", mobileNumber);
                    return createNewUser(mobileNumber);
                });
            
            log.debug("User found/created, userId: {}, mobileVerified: {}", user.getId(), user.getMobileVerified());
            
            // Update mobile verified
            if (!user.getMobileVerified()) {
                user.setMobileVerified(true);
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);
                log.debug("Mobile verified and last login updated for userId: {}", user.getId());
            }
            
            // Get user role
            String role = getUserRole(user.getId());
            log.debug("User role retrieved, userId: {}, role: {}", user.getId(), role);
            
            // Generate tokens
            String token = jwtService.generateToken(user.getId(), user.getEmail(), role);
            String refreshToken = jwtService.generateRefreshToken(user.getId());
            log.info("Tokens generated successfully for userId: {}, role: {}", user.getId(), role);
            
            return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .name(user.getFullName())
                .role(role)
                .profileComplete(isProfileComplete(user))
                .build();
        } catch (Exception e) {
            log.error("Error authenticating user with OTP, mobileNumber: {}", mobileNumber, e);
            throw e;
        }
    }

    @Transactional
    public AuthResponse authenticateWithGoogle(String email, String name, String profileImageUrl) {
        log.info("Authenticating user with Google, email: {}, name: {}", email, name);
        
        try {
            // Find or create user
            UserAccount user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.info("User not found for email: {}, creating new Google user", email);
                    return createGoogleUser(email, name, profileImageUrl);
                });
            
            log.debug("User found/created, userId: {}, emailVerified: {}", user.getId(), user.getEmailVerified());
            
            // Update last login
            user.setLastLoginAt(LocalDateTime.now());
            user.setEmailVerified(true);
            if (profileImageUrl != null) {
                user.setProfileImageUrl(profileImageUrl);
            }
            userRepository.save(user);
            log.debug("User updated, userId: {}, lastLoginAt: {}", user.getId(), user.getLastLoginAt());
            
            // Get user role
            String role = getUserRole(user.getId());
            log.debug("User role retrieved, userId: {}, role: {}", user.getId(), role);
            
            // Generate tokens
            String token = jwtService.generateToken(user.getId(), user.getEmail(), role);
            String refreshToken = jwtService.generateRefreshToken(user.getId());
            log.info("Tokens generated successfully for userId: {}, role: {}", user.getId(), role);
            
            return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .mobileNumber(user.getMobileNumber())
                .name(user.getFullName())
                .role(role)
                .profileComplete(isProfileComplete(user))
                .build();
        } catch (Exception e) {
            log.error("Error authenticating user with Google, email: {}", email, e);
            throw e;
        }
    }

    private UserAccount createNewUser(String mobileNumber) {
        log.info("Creating new user with mobileNumber: {}", mobileNumber);
        
        UserAccount user = UserAccount.builder()
            .mobileNumber(mobileNumber)
            .mobileVerified(true)
            .registrationSource("MOBILE_OTP")
            .accountStatus("ACTIVE")
            .isActive(true)
            .build();
        
        user = userRepository.save(user);
        log.info("New user created, userId: {}, mobileNumber: {}", user.getId(), mobileNumber);
        
        // Assign CUSTOMER role by default
        assignDefaultRole(user.getId(), "CUSTOMER");
        log.debug("CUSTOMER role assigned to userId: {}", user.getId());
        
        return user;
    }

    private UserAccount createGoogleUser(String email, String name, String profileImageUrl) {
        log.info("Creating new Google user, email: {}, name: {}", email, name);
        
        String[] nameParts = name.split(" ", 2);
        UserAccount user = UserAccount.builder()
            .email(email)
            .fullName(name)
            .firstName(nameParts.length > 0 ? nameParts[0] : name)
            .lastName(nameParts.length > 1 ? nameParts[1] : "")
            .profileImageUrl(profileImageUrl)
            .emailVerified(true)
            .registrationSource("GOOGLE")
            .accountStatus("ACTIVE")
            .isActive(true)
            .build();
        
        user = userRepository.save(user);
        log.info("New Google user created, userId: {}, email: {}", user.getId(), email);
        
        // Assign CUSTOMER role by default
        assignDefaultRole(user.getId(), "CUSTOMER");
        log.debug("CUSTOMER role assigned to userId: {}", user.getId());
        
        return user;
    }

    private void assignDefaultRole(Long userId, String roleCode) {
        log.debug("Assigning role to user, userId: {}, roleCode: {}", userId, roleCode);
        
        try {
            UserRoleMaster role = roleRepository.findByRoleCode(roleCode)
                .orElseThrow(() -> {
                    log.error("Role not found: {}", roleCode);
                    return new RuntimeException("Role not found: " + roleCode);
                });
            
            UserRoleMap roleMap = UserRoleMap.builder()
                .user(userRepository.findById(userId).orElseThrow(() -> {
                    log.error("User not found for userId: {}", userId);
                    return new RuntimeException("User not found");
                }))
                .role(role)
                .assignedAt(LocalDateTime.now())
                .build();
            
            roleMapRepository.save(roleMap);
            log.debug("Role assigned successfully, userId: {}, roleCode: {}", userId, roleCode);
        } catch (Exception e) {
            log.error("Error assigning role, userId: {}, roleCode: {}", userId, roleCode, e);
            throw e;
        }
    }

    private String getUserRole(Long userId) {
        log.debug("Getting user role for userId: {}", userId);
        
        try {
            List<UserRoleMap> roleMaps = roleMapRepository.findByUserId(userId);
            if (roleMaps.isEmpty()) {
                log.warn("No roles found for userId: {}, returning default CUSTOMER role", userId);
                return "CUSTOMER"; // Default role
            }
            
            // Priority order: SERVICE_PROVIDER > ADMIN roles > CUSTOMER > others
            // Check for SERVICE_PROVIDER first (highest priority for provider onboarding)
            for (UserRoleMap roleMap : roleMaps) {
                String roleCode = roleMap.getRole().getRoleCode();
                if ("SERVICE_PROVIDER".equals(roleCode)) {
                    log.debug("User role retrieved (SERVICE_PROVIDER), userId: {}, role: {}", userId, roleCode);
                    return roleCode;
                }
            }
            
            // Check for admin roles
            for (UserRoleMap roleMap : roleMaps) {
                String roleCode = roleMap.getRole().getRoleCode();
                if (roleCode.contains("ADMIN") || "SUPER_ADMIN".equals(roleCode)) {
                    log.debug("User role retrieved (Admin), userId: {}, role: {}", userId, roleCode);
                    return roleCode;
                }
            }
            
            // Return first role found (usually CUSTOMER)
            String role = roleMaps.get(0).getRole().getRoleCode();
            log.debug("User role retrieved, userId: {}, role: {}", userId, role);
            return role;
        } catch (Exception e) {
            log.error("Error getting user role for userId: {}", userId, e);
            return "CUSTOMER"; // Default on error
        }
    }

    private Boolean isProfileComplete(UserAccount user) {
        return user.getFullName() != null && 
               !user.getFullName().isEmpty() &&
               (user.getEmail() != null || user.getMobileNumber() != null);
    }
}
