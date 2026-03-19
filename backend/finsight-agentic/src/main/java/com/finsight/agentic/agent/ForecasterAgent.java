package com.finsight.agentic.agent;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class ForecasterAgent extends BaseAgent {
    public ForecasterAgent(ChatClient chatClient, ResourceLoader resourceLoader) {
        super(chatClient, "forecaster", resourceLoader);
    }

    @Override
    public String getSystemPrompt() {
        return loadPrompt("forecaster.md");
    }
}
