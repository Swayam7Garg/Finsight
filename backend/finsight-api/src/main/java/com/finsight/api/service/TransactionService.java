package com.finsight.api.service;

import com.finsight.api.repository.AccountRepository;
import com.finsight.api.repository.TransactionRepository;
import com.finsight.common.dto.PaginatedResponse;
import com.finsight.common.dto.transaction.TransactionResponse;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.Account;
import com.finsight.common.model.Transaction;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final MongoTemplate mongoTemplate;

    public PaginatedResponse<TransactionResponse> list(String userId, Map<String, String> filters) {
        int page = parseInt(filters.get("page"), 1);
        int limit = parseInt(filters.get("limit"), 20);
        int skip = (page - 1) * limit;

        Query query = new Query(Criteria.where("userId").is(userId));

        if (filters.containsKey("accountId")) query.addCriteria(Criteria.where("accountId").is(filters.get("accountId")));
        if (filters.containsKey("categoryId")) query.addCriteria(Criteria.where("categoryId").is(filters.get("categoryId")));
        if (filters.containsKey("type")) query.addCriteria(Criteria.where("type").is(filters.get("type")));

        if (filters.containsKey("startDate") || filters.containsKey("endDate")) {
            Criteria dateCriteria = Criteria.where("date");
            if (filters.containsKey("startDate")) dateCriteria = dateCriteria.gte(Instant.parse(filters.get("startDate")));
            if (filters.containsKey("endDate")) dateCriteria = dateCriteria.lte(Instant.parse(filters.get("endDate")));
            query.addCriteria(dateCriteria);
        }

        if (filters.containsKey("minAmount") || filters.containsKey("maxAmount")) {
            Criteria amountCriteria = Criteria.where("amount");
            if (filters.containsKey("minAmount")) amountCriteria = amountCriteria.gte(Double.parseDouble(filters.get("minAmount")));
            if (filters.containsKey("maxAmount")) amountCriteria = amountCriteria.lte(Double.parseDouble(filters.get("maxAmount")));
            query.addCriteria(amountCriteria);
        }

        if (filters.containsKey("search")) {
            query.addCriteria(Criteria.where("description").regex(filters.get("search"), "i"));
        }

        String sortField = filters.getOrDefault("sortBy", "date");
        String sortOrder = filters.getOrDefault("sortOrder", "desc");
        query.with(Sort.by("asc".equals(sortOrder) ? Sort.Direction.ASC : Sort.Direction.DESC, sortField));

        long total = mongoTemplate.count(query, Transaction.class);
        query.skip(skip).limit(limit);
        List<Transaction> transactions = mongoTemplate.find(query, Transaction.class);

        return PaginatedResponse.of(transactions.stream().map(this::toResponse).toList(), total, page, limit);
    }

    public TransactionResponse create(String userId, String accountId, String type, double amount,
                                       String categoryId, String subcategory, String description,
                                       String notes, String date, Boolean isRecurring, List<String> tags) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.notFound("Account not found"));

        Transaction tx = Transaction.builder()
                .userId(userId)
                .accountId(accountId)
                .type(type)
                .amount(amount)
                .currency(account.getCurrency())
                .categoryId(categoryId)
                .subcategory(subcategory)
                .description(description)
                .notes(notes)
                .date(Instant.parse(date))
                .isRecurring(isRecurring != null && isRecurring)
                .tags(tags != null ? tags : List.of())
                .build();
        tx = transactionRepository.save(tx);

        adjustAccountBalance(accountId, type, amount, "add");
        return toResponse(tx);
    }

    public TransactionResponse getById(String userId, String transactionId) {
        Transaction tx = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        return toResponse(tx);
    }

    public TransactionResponse update(String userId, String transactionId,
                                       String accountId, String type, Double amount,
                                       String categoryId, String subcategory, String description,
                                       String notes, String date, Boolean isRecurring, List<String> tags) {
        Transaction existing = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));

        if (accountId != null && !accountId.equals(existing.getAccountId())) {
            accountRepository.findByIdAndUserId(accountId, userId)
                    .orElseThrow(() -> ApiException.notFound("Account not found"));
        }

        // Reverse old balance effect
        adjustAccountBalance(existing.getAccountId(), existing.getType(), existing.getAmount(), "remove");

        if (accountId != null) existing.setAccountId(accountId);
        if (type != null) existing.setType(type);
        if (amount != null) existing.setAmount(amount);
        if (categoryId != null) existing.setCategoryId(categoryId);
        if (subcategory != null) existing.setSubcategory(subcategory);
        if (description != null) existing.setDescription(description);
        if (notes != null) existing.setNotes(notes);
        if (date != null) existing.setDate(Instant.parse(date));
        if (isRecurring != null) existing.setRecurring(isRecurring);
        if (tags != null) existing.setTags(tags);

        existing = transactionRepository.save(existing);

        // Apply new balance effect
        adjustAccountBalance(existing.getAccountId(), existing.getType(), existing.getAmount(), "add");
        return toResponse(existing);
    }

    public TransactionResponse delete(String userId, String transactionId) {
        Transaction tx = transactionRepository.findByIdAndUserId(transactionId, userId)
                .orElseThrow(() -> ApiException.notFound("Transaction not found"));
        transactionRepository.delete(tx);
        adjustAccountBalance(tx.getAccountId(), tx.getType(), tx.getAmount(), "remove");
        return toResponse(tx);
    }

    public void adjustAccountBalance(String accountId, String type, double amount, String operation) {
        double delta = 0;
        if ("income".equals(type)) {
            delta = "add".equals(operation) ? amount : -amount;
        } else if ("expense".equals(type)) {
            delta = "add".equals(operation) ? -amount : amount;
        }

        if (delta != 0) {
            Account account = accountRepository.findById(accountId).orElse(null);
            if (account != null) {
                account.setBalance(account.getBalance() + delta);
                accountRepository.save(account);
            }
        }
    }

    public PaginatedResponse<TransactionResponse> search(String userId, String searchQuery, int page, int limit) {
        int skip = (page - 1) * limit;
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("description").regex(searchQuery, "i"))
                .with(Sort.by(Sort.Direction.DESC, "date"))
                .skip(skip).limit(limit);

        long total = mongoTemplate.count(Query.of(query).skip(0).limit(0), Transaction.class);
        List<Transaction> transactions = mongoTemplate.find(query, Transaction.class);

        return PaginatedResponse.of(transactions.stream().map(this::toResponse).toList(), total, page, limit);
    }

    private TransactionResponse toResponse(Transaction tx) {
        return TransactionResponse.builder()
                .id(tx.getId())
                .userId(tx.getUserId())
                .accountId(tx.getAccountId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .currency(tx.getCurrency())
                .categoryId(tx.getCategoryId())
                .subcategory(tx.getSubcategory())
                .description(tx.getDescription())
                .notes(tx.getNotes())
                .date(tx.getDate() != null ? tx.getDate().toString() : null)
                .isRecurring(tx.isRecurring())
                .recurringRuleId(tx.getRecurringRuleId())
                .tags(tx.getTags())
                .createdAt(tx.getCreatedAt() != null ? tx.getCreatedAt().toString() : null)
                .updatedAt(tx.getUpdatedAt() != null ? tx.getUpdatedAt().toString() : null)
                .build();
    }

    private int parseInt(String value, int defaultValue) {
        if (value == null) return defaultValue;
        try { return Integer.parseInt(value); } catch (NumberFormatException e) { return defaultValue; }
    }
}
