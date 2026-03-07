package com.servichaya.location.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "state_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StateMaster extends MasterEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "country_id", nullable = false)
    private CountryMaster country;
}
