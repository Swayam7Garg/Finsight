package com.finsight.agentic.agent;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class BudgetOptimizerAgent extends BaseAgent {
    public BudgetOptimizerAgent(ChatClient chatClient, ResourceLoader resourceLoader) {
        super(chatClient, "budget-optimizer", resourceLoader);
    }

    @Override
    public String getSystemPrompt() {
        return loadPrompt("budget-optimizer.md");
    }
}
