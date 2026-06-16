package com.finsight.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsight.api.repository.AccountRepository;
import com.finsight.api.repository.BudgetRepository;
import com.finsight.api.repository.GoalRepository;
import com.finsight.common.model.Account;
import com.finsight.common.model.Budget;
import com.finsight.common.model.Goal;
import com.finsight.common.model.Transaction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdvisorService {

    private final AccountRepository accountRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final MongoTemplate mongoTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.groq.api-key:}")
    private String groqApiKey;

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";

    public boolean isConfigured() {
        return groqApiKey != null && !groqApiKey.isBlank();
    }

    /**
     * Main chat method — builds financial context + calls Groq API.
     */
    public Map<String, Object> chat(String userId, String userMessage, List<Map<String, String>> history) {
        if (!isConfigured()) {
            return Map.of(
                    "reply", "AI Advisor is not yet configured. Please set the GROQ_API_KEY environment variable in your deployment settings.",
                    "suggestions", List.of(),
                    "actions", List.of()
            );
        }

        try {
            String context = buildFinancialContext(userId);
            String systemPrompt = buildSystemPrompt(context);
            String reply = callGroq(systemPrompt, userMessage, history);
            List<String> suggestions = generateSuggestions(userMessage);

            return Map.of(
                    "reply", reply,
                    "suggestions", suggestions,
                    "actions", List.of()
            );
        } catch (Exception e) {
            log.error("AI Advisor error for user {}: {}", userId, e.getMessage(), e);
            return Map.of(
                    "reply", "I'm having trouble connecting to the AI service right now. Please try again in a moment.",
                    "suggestions", List.of(),
                    "actions", List.of()
            );
        }
    }

    /**
     * Builds a comprehensive financial snapshot for the user to inject into the AI prompt.
     */
    private String buildFinancialContext(String userId) {
        StringBuilder ctx = new StringBuilder();

        // --- Accounts ---
        List<Account> accounts = accountRepository.findByUserIdAndIsArchivedOrderByCreatedAtDesc(userId, false);
        double totalBalance = accounts.stream().mapToDouble(Account::getBalance).sum();
        ctx.append("=== ACCOUNT SUMMARY ===\n");
        ctx.append(String.format("Total Net Worth: ₹%.2f across %d account(s)%n", totalBalance, accounts.size()));
        for (Account a : accounts) {
            ctx.append(String.format("  - %s (%s): ₹%.2f%n", a.getName(), a.getType(), a.getBalance()));
        }
        ctx.append("\n");

        // --- Last 30 days transactions ---
        Instant thirtyDaysAgo = LocalDate.now().minusDays(30).atStartOfDay(ZoneOffset.UTC).toInstant();
        Query txQuery = new Query(Criteria.where("userId").is(userId)
                .and("date").gte(thirtyDaysAgo))
                .with(Sort.by(Sort.Direction.DESC, "date"))
                .limit(50);
        List<Transaction> recentTx = mongoTemplate.find(txQuery, Transaction.class);

        double totalIncome = recentTx.stream().filter(t -> "income".equals(t.getType())).mapToDouble(Transaction::getAmount).sum();
        double totalExpense = recentTx.stream().filter(t -> "expense".equals(t.getType())).mapToDouble(Transaction::getAmount).sum();

        ctx.append("=== LAST 30 DAYS ===\n");
        ctx.append(String.format("Income:  ₹%.2f%n", totalIncome));
        ctx.append(String.format("Expense: ₹%.2f%n", totalExpense));
        ctx.append(String.format("Net:     ₹%.2f%n", totalIncome - totalExpense));
        ctx.append(String.format("Transactions: %d total%n", recentTx.size()));

        // Top 5 recent transactions
        ctx.append("Recent transactions:\n");
        recentTx.stream().limit(5).forEach(t ->
                ctx.append(String.format("  - [%s] %s: ₹%.2f (%s)%n",
                        t.getType(), t.getDescription(), t.getAmount(),
                        t.getDate() != null ? t.getDate().toString().substring(0, 10) : "N/A"))
        );
        ctx.append("\n");

        // --- Budgets ---
        List<Budget> budgets = budgetRepository.findByUserIdAndIsActive(userId, true);
        if (!budgets.isEmpty()) {
            ctx.append("=== ACTIVE BUDGETS ===\n");
            for (Budget b : budgets) {
                Instant periodStart = LocalDate.now().withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();
                Aggregation agg = Aggregation.newAggregation(
                        Aggregation.match(Criteria.where("userId").is(userId)
                                .and("categoryId").is(b.getCategoryId())
                                .and("type").is("expense")
                                .and("date").gte(periodStart)),
                        Aggregation.group().sum("amount").as("spent")
                );
                var results = mongoTemplate.aggregate(agg, "transactions", Map.class).getMappedResults();
                double spent = results.isEmpty() ? 0 : ((Number) results.get(0).get("spent")).doubleValue();
                double pct = b.getAmount() > 0 ? (spent / b.getAmount()) * 100 : 0;
                String status = pct >= 100 ? "OVER BUDGET" : pct >= b.getAlertThreshold() * 100 ? "WARNING" : "OK";
                ctx.append(String.format("  - Category %s: ₹%.2f / ₹%.2f (%.1f%%) [%s]%n",
                        b.getCategoryId(), spent, b.getAmount(), pct, status));
            }
            ctx.append("\n");
        }

        // --- Goals ---
        List<Goal> goals = goalRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (!goals.isEmpty()) {
            ctx.append("=== SAVINGS GOALS ===\n");
            for (Goal g : goals) {
                double pct = g.getTargetAmount() > 0 ? (g.getCurrentAmount() / g.getTargetAmount()) * 100 : 0;
                String deadline = g.getDeadline() != null ? g.getDeadline().toString().substring(0, 10) : "No deadline";
                ctx.append(String.format("  - %s: ₹%.2f / ₹%.2f (%.1f%%) — deadline: %s%s%n",
                        g.getName(), g.getCurrentAmount(), g.getTargetAmount(), pct, deadline,
                        g.isCompleted() ? " [COMPLETED]" : ""));
            }
            ctx.append("\n");
        }

        return ctx.toString();
    }

    private String buildSystemPrompt(String financialContext) {
        return """
                You are FinSight AI, a friendly and knowledgeable personal finance advisor.
                You help users understand their spending, manage budgets, reach savings goals,
                and make smarter financial decisions. Respond in a warm, clear, and encouraging tone.
                Always reference the user's actual financial data in your responses.
                Use Indian Rupee (₹) for all currency amounts.
                Keep responses concise but insightful — ideally 2–4 paragraphs.
                
                Here is the user's current financial snapshot:
                
                """ + financialContext + """
                
                Based on this data, provide personalized, actionable advice.
                """;
    }

    /**
     * Calls the Groq API (OpenAI-compatible format).
     * Model: llama-3.3-70b-versatile — free tier, 14,400 req/day.
     */
    @SuppressWarnings("unchecked")
    private String callGroq(String systemPrompt, String userMessage, List<Map<String, String>> history) throws Exception {
        List<Map<String, Object>> messages = new ArrayList<>();

        // System message first
        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Add prior conversation history
        if (history != null) {
            for (Map<String, String> msg : history) {
                String role = "user".equals(msg.get("role")) ? "user" : "assistant";
                String text = msg.getOrDefault("content", msg.getOrDefault("text", ""));
                if (text != null && !text.isBlank()) {
                    messages.add(Map.of("role", role, "content", text));
                }
            }
        }

        // Add current user message
        messages.add(Map.of("role", "user", "content", userMessage));

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", GROQ_MODEL);
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.7);
        requestBody.put("max_tokens", 1024);
        requestBody.put("top_p", 0.95);

        String json = objectMapper.writeValueAsString(requestBody);
        log.info("Calling Groq API with model: {}", GROQ_MODEL);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey.trim())
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            log.error("Groq API error HTTP {}: {}", response.statusCode(), response.body());
            throw new RuntimeException("Groq API error (HTTP " + response.statusCode() + "): " + response.body());
        }

        log.info("Groq API call successful");
        Map<String, Object> responseMap = objectMapper.readValue(response.body(), Map.class);
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
        if (choices == null || choices.isEmpty()) {
            throw new RuntimeException("Empty choices in Groq response: " + response.body());
        }
        Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
        return (String) message.get("content");
    }

    private List<String> generateSuggestions(String userMessage) {
        String lower = userMessage.toLowerCase();
        if (lower.contains("budget")) {
            return List.of("Show my budget status", "Where am I overspending?", "Help me set a budget");
        } else if (lower.contains("save") || lower.contains("goal")) {
            return List.of("How can I save more?", "Review my savings goals", "Best saving strategies");
        } else if (lower.contains("spend") || lower.contains("expense")) {
            return List.of("Analyze my spending", "Top expense categories", "How to reduce expenses?");
        } else if (lower.contains("invest")) {
            return List.of("Investment basics", "SIP vs lump sum", "Emergency fund first?");
        }
        return List.of("Analyze my finances", "Budget tips", "How to save more?");
    }
}
