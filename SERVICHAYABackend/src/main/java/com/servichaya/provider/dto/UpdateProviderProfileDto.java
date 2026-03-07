package com.servichaya.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProviderProfileDto {
    private String businessName;
    private String bio;
    private Integer experienceYears;
    private Boolean isAvailable;
}
