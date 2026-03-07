package com.servichaya.user.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_role_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRoleMaster extends MasterEntity {

    @Column(name = "role_code", unique = true, nullable = false, length = 50)
    private String roleCode;

    @Builder.Default
    @Column(name = "is_system_role", nullable = false)
    private Boolean isSystemRole = false;
}
