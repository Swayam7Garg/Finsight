package com.finsight.agentic.agent;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class AnomalyDetectorAgent extends BaseAgent {
    public AnomalyDetectorAgent(ChatClient chatClient, ResourceLoader resourceLoader) {
        super(chatClient, "anomaly-detector", resourceLoader);
    }

    @Override
    public String getSystemPrompt() {
        return loadPrompt("anomaly-detector.md");
    }
}
