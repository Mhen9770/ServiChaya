package com.servichaya.service.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "service_subcategory_master")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceSubCategoryMaster extends MasterEntity {

    @Column(name = "category_id", nullable = false)
    private Long categoryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private ServiceCategoryMaster category;

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;
}
