package com.finsight.api.service;

import com.finsight.api.repository.AccountRepository;
import com.finsight.api.repository.RecurringRuleRepository;
import com.finsight.api.repository.TransactionRepository;
import com.finsight.common.dto.recurring.RecurringRuleResponse;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.Account;
import com.finsight.common.model.RecurringRule;
import com.finsight.common.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RecurringService {

    private final RecurringRuleRepository recurringRuleRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    public List<RecurringRuleResponse> list(String userId) {
        return recurringRuleRepository.findByUserIdOrderByNextDueDateAsc(userId)
                .stream().map(this::toResponse).toList();
    }

    public RecurringRuleResponse getById(String userId, String ruleId) {
        RecurringRule rule = recurringRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> ApiException.notFound("Recurring rule not found"));
        return toResponse(rule);
    }

    public RecurringRuleResponse create(String userId, String accountId, String categoryId,
                                         String type, double amount, String description,
                                         String frequency, String startDate, String endDate) {
        accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound("Account not found"));

        Instant start = Instant.parse(startDate);
        RecurringRule rule = RecurringRule.builder()
                .userId(userId)
                .accountId(accountId)
                .categoryId(categoryId)
                .type(type)
                .amount(amount)
                .description(description)
                .frequency(frequency)
                .startDate(start)
                .nextDueDate(start)
                .endDate(endDate != null ? Instant.parse(endDate) : null)
                .build();
        return toResponse(recurringRuleRepository.save(rule));
    }

    public RecurringRuleResponse update(String userId, String ruleId,
                                         String accountId, String categoryId,
                                         String type, Double amount, String description,
                                         String frequency, String startDate, String endDate, Boolean isActive) {
        RecurringRule rule = recurringRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> ApiException.notFound("Recurring rule not found"));

        if (accountId != null) {
            accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> ApiException.notFound("Account not found"));
            rule.setAccountId(accountId);
        }
        if (categoryId != null) rule.setCategoryId(categoryId);
        if (type != null) rule.setType(type);
        if (amount != null) rule.setAmount(amount);
        if (description != null) rule.setDescription(description);
        if (frequency != null) rule.setFrequency(frequency);
        if (startDate != null) rule.setStartDate(Instant.parse(startDate));
        if (endDate != null) rule.setEndDate(endDate.isEmpty() ? null : Instant.parse(endDate));
        if (isActive != null) rule.setActive(isActive);

        return toResponse(recurringRuleRepository.save(rule));
    }

    public RecurringRuleResponse delete(String userId, String ruleId) {
        RecurringRule rule = recurringRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> ApiException.notFound("Recurring rule not found"));
        recurringRuleRepository.delete(rule);
        return toResponse(rule);
    }

    public List<RecurringRuleResponse> getUpcoming(String userId) {
        Instant now = Instant.now();
        Instant thirtyDays = ZonedDateTime.now(ZoneOffset.UTC).plusDays(30).toInstant();
        return recurringRuleRepository.findByUserIdAndIsActiveAndNextDueDateBetween(userId, true, now, thirtyDays)
                .stream().map(this::toResponse).toList();
    }

    public Map<String, Object> markAsPaid(String userId, String ruleId) {
        RecurringRule rule = recurringRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> ApiException.notFound("Recurring rule not found"));

        if (!rule.isActive()) {
            throw ApiException.badRequest("This recurring rule is no longer active");
        }

        Account account = accountRepository.findByIdAndUserId(rule.getAccountId(), userId)
                .orElseThrow(() -> ApiException.notFound("The account associated with this rule was not found"));

        Transaction tx = Transaction.builder()
                .userId(rule.getUserId())
                .accountId(rule.getAccountId())
                .type(rule.getType())
                .amount(rule.getAmount())
                .currency(account.getCurrency())
                .categoryId(rule.getCategoryId())
                .description(rule.getDescription())
                .date(rule.getNextDueDate())
                .isRecurring(true)
                .recurringRuleId(rule.getId())
                .tags(List.of())
                .build();
        tx = transactionRepository.save(tx);

        double balanceDelta = "income".equals(rule.getType()) ? rule.getAmount() : -rule.getAmount();
        account.setBalance(account.getBalance() + balanceDelta);
        accountRepository.save(account);

        Instant newNextDueDate = advanceDate(rule.getNextDueDate(), rule.getFrequency());
        if (rule.getEndDate() != null && newNextDueDate.isAfter(rule.getEndDate())) {
            rule.setActive(false);
        }
        rule.setNextDueDate(newNextDueDate);
        recurringRuleRepository.save(rule);

        return Map.of(
                "rule", toResponse(rule),
                "transaction", Map.of(
                        "id", tx.getId(),
                        "description", tx.getDescription(),
                        "amount", tx.getAmount(),
                        "date", tx.getDate().toString()
                )
        );
    }

    private Instant advanceDate(Instant current, String frequency) {
        ZonedDateTime zdt = current.atZone(ZoneOffset.UTC);
        return switch (frequency) {
            case "daily" -> zdt.plusDays(1).toInstant();
            case "weekly" -> zdt.plusWeeks(1).toInstant();
            case "biweekly" -> zdt.plusWeeks(2).toInstant();
            case "monthly" -> zdt.plusMonths(1).toInstant();
            case "yearly" -> zdt.plusYears(1).toInstant();
            default -> zdt.plusMonths(1).toInstant();
        };
    }

    private RecurringRuleResponse toResponse(RecurringRule rule) {
        return RecurringRuleResponse.builder()
                .id(rule.getId())
                .userId(rule.getUserId())
                .accountId(rule.getAccountId())
                .categoryId(rule.getCategoryId())
                .type(rule.getType())
                .amount(rule.getAmount())
                .description(rule.getDescription())
                .frequency(rule.getFrequency())
                .startDate(rule.getStartDate() != null ? rule.getStartDate().toString() : null)
                .nextDueDate(rule.getNextDueDate() != null ? rule.getNextDueDate().toString() : null)
                .endDate(rule.getEndDate() != null ? rule.getEndDate().toString() : null)
                .isActive(rule.isActive())
                .createdAt(rule.getCreatedAt() != null ? rule.getCreatedAt().toString() : null)
                .updatedAt(rule.getUpdatedAt() != null ? rule.getUpdatedAt().toString() : null)
                .build();
    }
}
