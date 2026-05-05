package com.finsight.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResult {
    @Builder.Default
    private int imported = 0;
    
    @Builder.Default
    private int skipped = 0;
    
    @Builder.Default
    private List<String> errors = new ArrayList<>();
}
