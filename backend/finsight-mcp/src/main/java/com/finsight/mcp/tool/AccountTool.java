package com.finsight.mcp.tool;

import com.finsight.api.service.AccountService;
import com.finsight.common.dto.account.AccountResponse;
import com.finsight.common.dto.account.CreateAccountRequest;
import com.finsight.common.dto.account.UpdateAccountRequest;
import com.finsight.mcp.config.McpJwtAuthResolver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.core.NestedExceptionUtils;

import java.util.List;
import java.util.function.Function;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class AccountTool {

    private final AccountService accountService;
    private final McpJwtAuthResolver authResolver;

    public record AccountListRequest(String token) {}
    public record SingleAccountRequest(String token, String accountId) {}
    public record AccountCreateRequest(String token, CreateAccountRequest payload) {}
    public record AccountUpdateRequest(String token, String accountId, UpdateAccountRequest payload) {}

    @Bean
    @Description("List all accounts for the authenticated user")
    public Function<AccountListRequest, String> listAccounts() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                List<AccountResponse> accounts = accountService.list(userId);
                return toJson(accounts);
            } catch (Exception e) {
                return "Error listing accounts: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Get a specific account by its ID")
    public Function<SingleAccountRequest, String> getAccount() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                AccountResponse account = accountService.getById(userId, req.accountId());
                return toJson(account);
            } catch (Exception e) {
                return "Error getting account: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Create a new financial account (checking, savings, credit, cash, investment, loan)")
    public Function<AccountCreateRequest, String> createAccount() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                AccountResponse account = accountService.create(
                        userId, 
                        req.payload().getName(), 
                        req.payload().getType(), 
                        req.payload().getBalance(), 
                        req.payload().getCurrency(), 
                        req.payload().getColor()
                );
                return toJson(account);
            } catch (Exception e) {
                return "Error creating account: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Update an existing account's details")
    public Function<AccountUpdateRequest, String> updateAccount() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                AccountResponse account = accountService.update(
                        userId, 
                        req.accountId(), 
                        req.payload().getName(), 
                        req.payload().getType(), 
                        req.payload().getBalance(), 
                        req.payload().getCurrency(), 
                        req.payload().getColor(),
                        req.payload().getIsArchived()
                );
                return toJson(account);
            } catch (Exception e) {
                return "Error updating account: " + getMessage(e);
            }
        };
    }

    @Bean
    @Description("Delete an account. This cascades to transactions if handled by the service layer.")
    public Function<SingleAccountRequest, String> deleteAccount() {
        return req -> {
            try {
                String userId = authResolver.resolveUserId(req.token());
                accountService.delete(userId, req.accountId());
                return "{\"success\": true, \"message\": \"Account deleted successfully\"}";
            } catch (Exception e) {
                return "Error deleting account: " + getMessage(e);
            }
        };
    }

    // Helper functions for easy formatting
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
