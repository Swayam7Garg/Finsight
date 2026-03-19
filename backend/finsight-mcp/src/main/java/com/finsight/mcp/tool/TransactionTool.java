package com.finsight.mcp.tool;

import com.finsight.api.service.TransactionService;
import com.finsight.common.dto.PaginatedResponse;
import com.finsight.common.dto.transaction.CreateTransactionRequest;
import com.finsight.common.dto.transaction.TransactionResponse;
import com.finsight.common.dto.transaction.UpdateTransactionRequest;
import com.finsight.mcp.config.McpJwtAuthResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.core.NestedExceptionUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class TransactionTool {

    private final TransactionService transactionService;
    private final McpJwtAuthResolver authResolver;

    public record TransactionListRequest(String token, String accountId, String type, String categoryId, String isRecurring, Integer page, Integer limit, String sort, String order) {}
    public record SingleTransactionRequest(String token, String transactionId) {}
    public record TransactionCreateRequest(String token, CreateTransactionRequest payload) {}
    public record TransactionUpdateRequest(String token, String transactionId, UpdateTransactionRequest payload) {}
    public record TransactionSearchRequest(String token, String query, Integer page, Integer limit) {}

    @Bean
    @Description("List transactions with optional filters (accountId, type, categoryId, etc), pagination, and sorting")
    public Function<TransactionListRequest, String> listTransactions() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                Map<String, String> filters = new HashMap<>();
                if (req.accountId() != null) filters.put("accountId", req.accountId());
                if (req.type() != null) filters.put("type", req.type());
                if (req.categoryId() != null) filters.put("categoryId", req.categoryId());
                if (req.isRecurring() != null) filters.put("isRecurring", req.isRecurring());
                if (req.page() != null) filters.put("page", req.page().toString());
                if (req.limit() != null) filters.put("limit", req.limit().toString());
                if (req.sort() != null) filters.put("sortBy", req.sort());
                if (req.order() != null) filters.put("sortOrder", req.order());

                PaginatedResponse<TransactionResponse> results = transactionService.list(userId, filters);
                return toJson(results);
            } catch (Exception e) {
                return "Error listing transactions: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Search transactions by description or notes")
    public Function<TransactionSearchRequest, String> searchTransactions() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                int page = req.page() != null ? req.page() : 1;
                int limit = req.limit() != null ? req.limit() : 20;
                PaginatedResponse<TransactionResponse> results = transactionService.search(userId, req.query(), page, limit);
                return toJson(results);
            } catch (Exception e) {
                return "Error searching transactions: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a specific transaction by its ID")
    public Function<SingleTransactionRequest, String> getTransaction() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                TransactionResponse transaction = transactionService.getById(userId, req.transactionId());
                return toJson(transaction);
            } catch (Exception e) {
                return "Error getting transaction: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Create a new transaction (income, expense, transfer) and automatically adjust the account balance")
    public Function<TransactionCreateRequest, String> createTransaction() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                TransactionResponse transaction = transactionService.create(
                        userId,
                        req.payload().getAccountId(),
                        req.payload().getType(),
                        req.payload().getAmount(),
                        req.payload().getCategoryId(),
                        req.payload().getSubcategory(),
                        req.payload().getDescription(),
                        req.payload().getNotes(),
                        req.payload().getDate(),
                        req.payload().getIsRecurring(),
                        req.payload().getTags()
                );
                return toJson(transaction);
            } catch (Exception e) {
                return "Error creating transaction: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Update an existing transaction. Recalculates account balances if amount or type changed.")
    public Function<TransactionUpdateRequest, String> updateTransaction() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                TransactionResponse transaction = transactionService.update(
                        userId,
                        req.transactionId(),
                        req.payload().getAccountId(),
                        req.payload().getType(),
                        req.payload().getAmount(),
                        req.payload().getCategoryId(),
                        req.payload().getSubcategory(),
                        req.payload().getDescription(),
                        req.payload().getNotes(),
                        req.payload().getDate(),
                        req.payload().getIsRecurring(),
                        req.payload().getTags()
                );
                return toJson(transaction);
            } catch (Exception e) {
                return "Error updating transaction: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Delete a transaction and reverse its impact on the account balance")
    public Function<SingleTransactionRequest, String> deleteTransaction() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                TransactionResponse transaction = transactionService.delete(userId, req.transactionId());
                return toJson(transaction);
            } catch (Exception e) {
                return "Error deleting transaction: " + getMessage(e);
            }
        };
    }

    private String toJson(Object obj) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            return mapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{\"error\": \"Could not serialize response\"}";
        }
    }

    private String getMessage(Exception e) {
        Throwable cause = NestedExceptionUtils.getRootCause(e);
        if (cause == null) cause = e;
        return cause.getMessage();
    }
}
