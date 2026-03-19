package com.finsight.common.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "categories")
@CompoundIndex(name = "userId_type", def = "{'userId': 1, 'type': 1}")
public class Category {

    @Id
    private String id;

    /** Null for system default categories */
    private String userId;

    private String name;

    private String icon;

    private String color;

    /** One of: income, expense */
    private String type;

    @Builder.Default
    private boolean isDefault = false;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
