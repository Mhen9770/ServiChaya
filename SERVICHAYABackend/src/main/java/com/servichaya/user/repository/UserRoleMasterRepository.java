package com.servichaya.user.repository;

import com.servichaya.user.entity.UserRoleMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRoleMasterRepository extends JpaRepository<UserRoleMaster, Long> {
    Optional<UserRoleMaster> findByRoleCode(String roleCode);
}
