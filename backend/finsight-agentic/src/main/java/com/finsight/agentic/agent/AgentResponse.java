package com.finsight.agentic.agent;

import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class AgentResponse {
    private String response;
    private String agent;
    private List<ToolCall> toolCalls;
    private Usage usage;

    @Data
    public static class ToolCall {
        private String name;
        private Map<String, Object> args;
    }

    @Data
    public static class Usage {
        private Long inputTokens;
        private Long outputTokens;
    }
}
