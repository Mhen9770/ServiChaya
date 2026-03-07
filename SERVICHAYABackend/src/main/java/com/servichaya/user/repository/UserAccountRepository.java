package com.servichaya.user.repository;

import com.servichaya.user.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    Optional<UserAccount> findByMobileNumber(String mobileNumber);
    Optional<UserAccount> findByEmail(String email);
    Boolean existsByMobileNumber(String mobileNumber);
    Boolean existsByEmail(String email);
}
