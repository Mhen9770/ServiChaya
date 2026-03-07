package com.servichaya.service.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_category_master")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryMaster extends MasterEntity {

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;
}
