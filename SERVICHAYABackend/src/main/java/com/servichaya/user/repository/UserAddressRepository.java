package com.servichaya.user.repository;

import com.servichaya.user.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {

    @Query("SELECT a FROM UserAddress a WHERE a.user.id = :userId AND a.isDeleted = false")
    List<UserAddress> findByUserIdAndIsDeletedFalse(@Param("userId") Long userId);

    @Query("SELECT a FROM UserAddress a WHERE a.user.id = :userId AND a.isPrimary = true AND a.isDeleted = false")
    UserAddress findPrimaryByUserId(@Param("userId") Long userId);
}
