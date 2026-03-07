package com.servichaya.user.repository;

import com.servichaya.user.entity.UserRoleMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRoleMapRepository extends JpaRepository<UserRoleMap, Long> {
    @Query("SELECT r FROM UserRoleMap r WHERE r.user.id = :userId")
    List<UserRoleMap> findByUserId(@Param("userId") Long userId);
    
    @Query("SELECT r FROM UserRoleMap r WHERE r.user.id = :userId AND r.role.roleCode = :roleCode")
    Optional<UserRoleMap> findByUserIdAndRoleCode(@Param("userId") Long userId, @Param("roleCode") String roleCode);
}
