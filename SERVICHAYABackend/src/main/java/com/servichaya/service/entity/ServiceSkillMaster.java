package com.servichaya.service.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_skill_master")
@Getter
@Setter
@NoArgsConstructor
public class ServiceSkillMaster extends MasterEntity {
    // Inherits: id, code, name, description, isActive from MasterEntity
}
