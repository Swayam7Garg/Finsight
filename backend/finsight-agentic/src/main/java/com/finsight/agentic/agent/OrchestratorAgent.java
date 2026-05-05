package com.finsight.agentic.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.context.ApplicationContext;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class OrchestratorAgent extends BaseAgent {
    private final ApplicationContext applicationContext;
    private final ObjectMapper objectMapper;

    @Data
    public static class RoutingDecision {
        private String agent;
        private String reason;
    }

    public OrchestratorAgent(ChatClient chatClient, ResourceLoader resourceLoader, 
                             ApplicationContext applicationContext, ObjectMapper objectMapper) {
        super(chatClient, "orchestrator", resourceLoader);
        this.applicationContext = applicationContext;
        this.objectMapper = objectMapper;
    }

    @Override
    public String getSystemPrompt() {
        return loadPrompt("orchestrator.md");
    }

    public RoutingDecision route(String userMessage) {
        String response = chatClient.prompt()
                .system(getSystemPrompt())
                .user(userMessage)
                .call()
                .content();

        try {
            return objectMapper.readValue(response.trim(), RoutingDecision.class);
        } catch (Exception e) {
            RoutingDecision fallback = new RoutingDecision();
            fallback.setAgent("financial-advisor");
            fallback.setReason("Fallback due to parsing error");
            return fallback;
        }
    }

    @Override
    public AgentResponse run(String userMessage, List<Message> conversationHistory, io.modelcontextprotocol.client.McpSyncClient mcpClient) {
        RoutingDecision decision = route(userMessage);
        BaseAgent specialist = (BaseAgent) applicationContext.getBean(getAgentBeanName(decision.getAgent()));
        
        AgentResponse result = specialist.run(userMessage, conversationHistory, mcpClient);
        result.setAgent(decision.getAgent());
        return result;
    }

    private String getAgentBeanName(String agentName) {
        return switch (agentName) {
            case "anomaly-detector" -> "anomalyDetectorAgent";
            case "budget-optimizer" -> "budgetOptimizerAgent";
            case "forecaster" -> "forecasterAgent";
            default -> "financialAdvisorAgent";
        };
    }
}
