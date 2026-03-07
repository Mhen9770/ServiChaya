package com.servichaya.matching.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MatchingResultDto {
    private Long jobId;
    private String jobCode;
    private Integer totalProvidersMatched;
    private Integer providersNotified;
    private List<ProviderMatchDto> matches;
}
