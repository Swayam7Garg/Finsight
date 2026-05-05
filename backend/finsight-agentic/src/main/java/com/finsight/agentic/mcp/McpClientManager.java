package com.finsight.agentic.mcp;

import io.modelcontextprotocol.client.McpClient;
import io.modelcontextprotocol.client.McpSyncClient;
import io.modelcontextprotocol.client.transport.HttpClientSseClientTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class McpClientManager {

    @Value("${finsight.mcp.server.url:http://localhost:5100}")
    private String mcpServerUrl;

    private final Map<String, McpSyncClient> clients = new ConcurrentHashMap<>();

    public McpSyncClient getClient(String userToken) {
        return clients.computeIfAbsent(userToken, token -> {
            org.springframework.web.reactive.function.client.WebClient.Builder webClientBuilder = 
                org.springframework.web.reactive.function.client.WebClient.builder();

            HttpClientSseClientTransport transport = new HttpClientSseClientTransport(
                    mcpServerUrl + "?token=" + token
            );
            
            McpSyncClient client = McpClient.sync(transport)
                    .requestTimeout(Duration.ofSeconds(30))
                    .build();
            
            client.initialize();
            return client;
        });
    }
}
