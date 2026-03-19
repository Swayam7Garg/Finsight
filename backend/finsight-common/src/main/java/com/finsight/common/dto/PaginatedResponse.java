package com.finsight.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaginatedResponse<T> {

    private List<T> data;
    private Pagination pagination;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Pagination {
        private int page;
        private int limit;
        private long total;
        private int totalPages;
        private boolean hasMore;
    }

    public static <T> PaginatedResponse<T> of(List<T> data, long total, int page, int limit) {
        int totalPages = limit > 0 ? (int) Math.ceil((double) total / limit) : 0;
        return PaginatedResponse.<T>builder()
                .data(data)
                .pagination(Pagination.builder()
                        .page(page)
                        .limit(limit)
                        .total(total)
                        .totalPages(totalPages)
                        .hasMore(page < totalPages)
                        .build())
                .build();
    }
}
