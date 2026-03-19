package com.finsight.common.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "goals")
public class Goal {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String name;

    private double targetAmount;

    @Builder.Default
    private double currentAmount = 0;

    private Instant deadline;

    @Builder.Default
    private String color = "#10b981";

    @Builder.Default
    private String icon = "\uD83C\uDFAF";

    @Builder.Default
    private boolean isCompleted = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
