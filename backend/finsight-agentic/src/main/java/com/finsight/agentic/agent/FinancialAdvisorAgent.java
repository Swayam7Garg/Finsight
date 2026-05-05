package com.finsight.agentic.agent;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class FinancialAdvisorAgent extends BaseAgent {
    public FinancialAdvisorAgent(ChatClient chatClient, ResourceLoader resourceLoader) {
        super(chatClient, "financial-advisor", resourceLoader);
    }

    @Override
    public String getSystemPrompt() {
        return loadPrompt("financial-advisor.md");
    }
}
