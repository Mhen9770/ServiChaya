package com.servichaya.location.entity;

import com.servichaya.common.entity.MasterEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "country_master")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CountryMaster extends MasterEntity {

    @Column(name = "country_code", unique = true, length = 10)
    private String countryCode;

    @Column(name = "currency_code", length = 10)
    private String currencyCode;

    @Column(name = "phone_code", length = 10)
    private String phoneCode;
}
