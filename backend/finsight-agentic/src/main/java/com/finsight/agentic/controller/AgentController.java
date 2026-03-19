package com.finsight.agentic.controller;

import com.finsight.agentic.agent.*;
import com.finsight.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.Data;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
public class AgentController {

    private final OrchestratorAgent orchestratorAgent;
    private final FinancialAdvisorAgent financialAdvisorAgent;
    private final AnomalyDetectorAgent anomalyDetectorAgent;
    private final BudgetOptimizerAgent budgetOptimizerAgent;
    private final ForecasterAgent forecasterAgent;
    private final com.finsight.agentic.mcp.McpClientManager mcpClientManager;

    @PostMapping("/chat")
    public ApiResponse<AgentResponse> chat(@RequestBody ChatRequest request, 
                                           @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        List<Message> history = parseHistory(request.getHistory());
        io.modelcontextprotocol.client.McpSyncClient mcpClient = mcpClientManager.getClient(token);
        
        AgentResponse response = orchestratorAgent.run(request.getMessage(), history, mcpClient);
        return ApiResponse.ok(response);
    }

    @PostMapping("/insights")
    public ApiResponse<AgentResponse> insights(@RequestBody InsightRequest request,
                                               @RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String prompt = getInsightPrompt(request.getType());
        BaseAgent agent = getInsightAgent(request.getType());
        io.modelcontextprotocol.client.McpSyncClient mcpClient = mcpClientManager.getClient(token);
        
        AgentResponse response = agent.run(prompt, new ArrayList<>(), mcpClient);
        return ApiResponse.ok(response);
    }

    @GetMapping("/insights/summary")
    public ApiResponse<AgentResponse> summary(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        io.modelcontextprotocol.client.McpSyncClient mcpClient = mcpClientManager.getClient(token);
        AgentResponse response = financialAdvisorAgent.run(
            "Give me a brief financial summary: health score, top concern, and one actionable recommendation. Keep it under 200 words.", 
            new ArrayList<>(),
            mcpClient
        );
        return ApiResponse.ok(response);
    }

    private List<Message> parseHistory(List<Map<String, String>> historyData) {
        List<Message> history = new ArrayList<>();
        if (historyData != null) {
            for (Map<String, String> msg : historyData) {
                if ("user".equals(msg.get("role"))) {
                    history.add(new UserMessage(msg.get("content")));
                } else if ("assistant".equals(msg.get("role"))) {
                    history.add(new AssistantMessage(msg.get("content")));
                }
            }
        }
        return history;
    }

    private String getInsightPrompt(String type) {
        return switch (type) {
            case "financial-health" -> "Give me a comprehensive financial health assessment.";
            case "anomalies" -> "Analyze my recent transactions for any unusual spending patterns or anomalies.";
            case "budget-review" -> "Review my budgets and suggest optimizations.";
            case "forecast" -> "Project my financial outlook for the next 3, 6, and 12 months.";
            default -> "Give me insights into my finances.";
        };
    }

    private BaseAgent getInsightAgent(String type) {
        return switch (type) {
            case "anomalies" -> anomalyDetectorAgent;
            case "budget-review" -> budgetOptimizerAgent;
            case "forecast" -> forecasterAgent;
            default -> financialAdvisorAgent;
        };
    }

    @lombok.Data
    public static class ChatRequest {
        private String message;
        private List<Map<String, String>> history;
    }

    @lombok.Data
    public static class InsightRequest {
        private String type;
    }
}

