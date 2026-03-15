package com.servichaya.service.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Fetch;
import org.hibernate.annotations.FetchMode;

import java.util.List;

@Entity
@Table(name = "service_category_master")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceCategoryMaster extends MasterEntity {

    @Column(name = "parent_id")
    private Long parentId; // Self-referential: null for root categories

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id", insertable = false, updatable = false)
    @Fetch(FetchMode.JOIN)
    private ServiceCategoryMaster parent;

    @OneToMany(mappedBy = "parent", fetch = FetchType.LAZY)
    private List<ServiceCategoryMaster> children;

    @Column(name = "category_type", length = 50)
    private String categoryType; // ELECTRONICS, APPLIANCE, HOME_SERVICE, etc. - defines behavior/rules

    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "level")
    private Integer level; // Hierarchy level: 0 = root, 1 = first child, etc.

    @Column(name = "path", length = 500)
    private String path; // Full path like "Electronics/Mobile Phones/Smartphones" for easy querying
}
