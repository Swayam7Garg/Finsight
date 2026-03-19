package com.finsight.agentic.agent;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

public abstract class BaseAgent {
    protected final ChatClient chatClient;
    protected final String name;
    protected final ResourceLoader resourceLoader;

    public BaseAgent(ChatClient chatClient, String name, ResourceLoader resourceLoader) {
        this.chatClient = chatClient;
        this.name = name;
        this.resourceLoader = resourceLoader;
    }

    public abstract String getSystemPrompt();

    protected String loadPrompt(String filename) {
        Resource resource = resourceLoader.getResource("classpath:prompts/" + filename);
        try {
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("Failed to load prompt: " + filename, e);
        }
    }

    public AgentResponse run(String userMessage, List<Message> conversationHistory, io.modelcontextprotocol.client.McpSyncClient mcpClient) {
        ChatClient.ChatClientRequestSpec spec = chatClient.prompt()
                .system(getSystemPrompt())
                .messages(conversationHistory)
                .user(userMessage);

        if (mcpClient != null) {
            // Register all tools from the MCP server as functions for this request
            List<org.springframework.ai.model.function.FunctionCallback> callbacks = mcpClient.listTools().tools().stream()
                    .map(tool -> new org.springframework.ai.mcp.SyncMcpToolCallback(mcpClient, tool))
                    .map(mcpCallback -> (org.springframework.ai.model.function.FunctionCallback) mcpCallback)
                    .toList();
            
            spec.functions(callbacks.toArray(new org.springframework.ai.model.function.FunctionCallback[0]));
        }

        ChatResponse chatResponse = spec.call().chatResponse();

        AgentResponse response = new AgentResponse();
        response.setResponse(chatResponse.getResult().getOutput().getText());
        response.setAgent(this.name);
        
        // Mapping tool calls and usage if available in Spring AI
        // Note: Spring AI ChatResponse has metadata for usage
        if (chatResponse.getMetadata() != null && chatResponse.getMetadata().getUsage() != null) {
            AgentResponse.Usage usage = new AgentResponse.Usage();
            usage.setInputTokens((long) chatResponse.getMetadata().getUsage().getPromptTokens());
            usage.setOutputTokens((long) chatResponse.getMetadata().getUsage().getCompletionTokens());
            response.setUsage(usage);
        }
        
        return response;
    }
}
