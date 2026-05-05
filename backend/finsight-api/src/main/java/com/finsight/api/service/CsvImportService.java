package com.finsight.api.service;

import com.finsight.api.repository.AccountRepository;
import com.finsight.api.repository.CategoryRepository;
import com.finsight.api.repository.TransactionRepository;
import com.finsight.common.dto.ImportResult;
import com.finsight.common.exception.ApiException;
import com.finsight.common.model.Account;
import com.finsight.common.model.Category;
import com.finsight.common.model.Transaction;
import com.opencsv.CSVReaderHeaderAware;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.io.StringReader;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionService transactionService;

    @Transactional
    public ImportResult importCsv(String userId, String csvContent, Map<String, String> mapping, String accountId, String defaultCategoryId) {
        Account account = accountRepository.findByIdAndUserId(accountId, userId)
                .orElseThrow(() -> ApiException.badRequest("Account not found or does not belong to you"));

        ImportResult result = new ImportResult();
        
        if (!StringUtils.hasText(csvContent)) {
            result.getErrors().add("CSV file is empty or has no data rows");
            return result;
        }

        Map<String, String> categoryCache = buildCategoryCache(userId);

        try (CSVReaderHeaderAware reader = new CSVReaderHeaderAware(new StringReader(csvContent))) {
            Map<String, String> row;
            int rowNum = 1;
            while ((row = reader.readMap()) != null) {
                rowNum++;
                // Convert row keys to lowercase for case-insensitive matching
                Map<String, String> lowerRow = new HashMap<>();
                for (Map.Entry<String, String> entry : row.entrySet()) {
                    if (entry.getKey() != null) {
                        lowerRow.put(entry.getKey().trim().toLowerCase(), entry.getValue());
                    }
                }

                String rawDate = resolveField(lowerRow, "date", mapping);
                if (!StringUtils.hasText(rawDate)) {
                    result.getErrors().add("Row " + rowNum + ": Missing date");
                    continue;
                }
                Instant parsedDate = parseDate(rawDate);
                if (parsedDate == null) {
                    result.getErrors().add("Row " + rowNum + ": Unrecognized date format \"" + rawDate + "\"");
                    continue;
                }

                String description = resolveField(lowerRow, "description", mapping);
                if (!StringUtils.hasText(description)) {
                    result.getErrors().add("Row " + rowNum + ": Missing description");
                    continue;
                }
                description = description.trim();

                String rawAmount = resolveField(lowerRow, "amount", mapping);
                if (!StringUtils.hasText(rawAmount)) {
                    result.getErrors().add("Row " + rowNum + ": Missing amount");
                    continue;
                }
                Double parsedAmount = parseAmount(rawAmount);
                if (parsedAmount == null || parsedAmount == 0) {
                    result.getErrors().add("Row " + rowNum + ": Invalid amount \"" + rawAmount + "\"");
                    continue;
                }

                double absAmount = Math.abs(parsedAmount);

                String rawType = resolveField(lowerRow, "type", mapping);
                String type;
                if (StringUtils.hasText(rawType)) {
                    rawType = rawType.trim().toLowerCase();
                    type = (rawType.equals("income") || rawType.equals("credit")) ? "income" : "expense";
                } else {
                    type = parsedAmount > 0 ? "income" : "expense";
                }

                String rawCategory = resolveField(lowerRow, "category", mapping);
                String resolvedCategoryId = defaultCategoryId;
                if (StringUtils.hasText(rawCategory)) {
                    String catId = categoryCache.get(rawCategory.trim().toLowerCase());
                    if (catId != null) {
                        resolvedCategoryId = catId;
                    }
                }

                String notes = resolveField(lowerRow, "notes", mapping);
                if (notes != null) notes = notes.trim();

                String rawTags = resolveField(lowerRow, "tags", mapping);
                List<String> tags = new ArrayList<>();
                if (StringUtils.hasText(rawTags)) {
                    String[] parts = rawTags.split("[,;|]");
                    for (String part : parts) {
                        if (StringUtils.hasText(part)) {
                            tags.add(part.trim());
                        }
                    }
                }

                // Check for duplicate
                boolean duplicate = transactionRepository.findByUserIdAndDateAndAmountAndDescription(
                        userId, parsedDate, absAmount, description).isPresent();

                if (duplicate) {
                    result.setSkipped(result.getSkipped() + 1);
                    continue;
                }

                try {
                    Transaction transaction = Transaction.builder()
                            .userId(userId)
                            .accountId(accountId)
                            .type(type)
                            .amount(absAmount)
                            .currency(account.getCurrency())
                            .categoryId(resolvedCategoryId)
                            .description(description)
                            .notes(notes)
                            .date(parsedDate)
                            .tags(tags)
                            .isRecurring(false)
                            .build();

                    transactionRepository.save(transaction);
                    transactionService.adjustAccountBalance(accountId, type, absAmount, "add");
                    
                    result.setImported(result.getImported() + 1);
                } catch (Exception e) {
                    result.getErrors().add("Row " + rowNum + " (\"" + description + "\"): " + e.getMessage());
                }
            }
        } catch (Exception e) {
            result.getErrors().add("Failed to parse CSV: " + e.getMessage());
        }

        return result;
    }

    private Map<String, String> buildCategoryCache(String userId) {
        List<Category> categories = categoryRepository.findByUserIdOrIsDefault(userId);
        Map<String, String> cache = new HashMap<>();
        for (Category cat : categories) {
            cache.put(cat.getName().toLowerCase().trim(), cat.getId());
        }
        return cache;
    }

    private String resolveField(Map<String, String> row, String fieldName, Map<String, String> mapping) {
        if (mapping != null) {
            for (Map.Entry<String, String> entry : mapping.entrySet()) {
                if (fieldName.equals(entry.getValue())) {
                    return row.get(entry.getKey().trim().toLowerCase());
                }
            }
        }

        switch (fieldName) {
            case "date":
                return getFirst(row, "date", "transaction date", "transaction_date", "posted date", "posted_date", "value date", "valuedate");
            case "description":
                return getFirst(row, "description", "memo", "name", "payee", "narrative", "details", "reference");
            case "amount":
                return getFirst(row, "amount", "value", "transaction amount", "debit/credit", "net amount");
            case "type":
                return getFirst(row, "type", "kind", "category_type", "debit/credit");
            case "category":
                return getFirst(row, "category", "category name", "category_name");
            case "notes":
                return getFirst(row, "notes", "note", "comment", "remarks", "memo");
            case "tags":
                return getFirst(row, "tags", "tag", "labels", "label");
            default:
                return null;
        }
    }

    private String getFirst(Map<String, String> row, String... keys) {
        for (String key : keys) {
            if (row.containsKey(key) && StringUtils.hasText(row.get(key))) {
                return row.get(key);
            }
        }
        return null;
    }

    private Double parseAmount(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        String s = raw.trim();

        boolean isCr = Pattern.compile("(?i)\\bCR\\b").matcher(s).find();
        boolean isDr = Pattern.compile("(?i)\\bDR\\b").matcher(s).find();
        s = s.replaceAll("(?i)\\b(CR|DR)\\b", "").trim();

        s = s.replaceAll("[£€$¥₹฿₩₪₫]", "").trim();

        boolean isParens = s.startsWith("(") && s.endsWith(")");
        if (isParens) s = s.substring(1, s.length() - 1);

        boolean hasComma = s.contains(",");
        boolean hasDot = s.contains(".");

        if (hasComma && hasDot) {
            int lastComma = s.lastIndexOf(",");
            int lastDot = s.lastIndexOf(".");
            if (lastDot > lastComma) {
                s = s.replace(",", "");
            } else {
                s = s.replace(".", "").replace(",", ".");
            }
        } else if (hasComma && !hasDot) {
            String[] parts = s.split(",");
            if (parts.length == 2 && parts[1].length() <= 2) {
                s = s.replace(",", ".");
            } else {
                s = s.replace(",", "");
            }
        }

        try {
            double value = Double.parseDouble(s);
            if (isParens || isDr) value = -Math.abs(value);
            if (isCr) value = Math.abs(value);
            return value;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Instant parseDate(String raw) {
        if (!StringUtils.hasText(raw)) return null;
        String s = raw.trim();

        try {
            return Instant.parse(s);
        } catch (DateTimeParseException e) {
            // ignore
        }
        
        // try offset datetime
        try {
            return java.time.OffsetDateTime.parse(s).toInstant();
        } catch (DateTimeParseException e) {
            // ignore
        }

        Matcher dmy = Pattern.compile("^(\\d{1,2})[/\\-\\.](\\d{1,2})[/\\-\\.](\\d{2,4})$").matcher(s);
        if (dmy.matches()) {
            int day = Integer.parseInt(dmy.group(1));
            int month = Integer.parseInt(dmy.group(2));
            int year = Integer.parseInt(dmy.group(3));
            if (dmy.group(3).length() == 2) year += 2000;
            
            try {
                LocalDate date = LocalDate.of(year, month, day);
                return date.atStartOfDay(ZoneId.of("UTC")).toInstant();
            } catch (Exception e) {
                return null;
            }
        }

        try {
            return LocalDate.parse(s, DateTimeFormatter.ISO_LOCAL_DATE).atStartOfDay(ZoneId.of("UTC")).toInstant();
        } catch (Exception e) {
            // ignore
        }
        
        return null;
    }
}
