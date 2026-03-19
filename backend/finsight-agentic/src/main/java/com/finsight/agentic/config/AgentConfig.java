package com.finsight.agentic.config;

import org.springframework.ai.chat.client.ChatClient;
import io.modelcontextprotocol.client.McpSyncClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AgentConfig {

    @Value("${finsight.mcp.server.url:http://localhost:5100}")
    private String mcpServerUrl;

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
    
    // We will configure McpClient here.
    // For now, let's assume we use SSE if running in a real environment,
    // or stdio if we were launching the process.
    // The original Node.js app connects via a URL.
}
