# FinSight MCP Guide & Environment Setup

---

## Part 1 — Where to Create Environment Files

The project has **three separate services**, each needing its own environment configuration.

### 1️⃣ Frontend — `apps/web/.env`

**Already exists** at:
```
apps/web/.env
```
Current content:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars-change-in-production
```

**You need to change `NEXTAUTH_SECRET` to something unique.** Everything else is fine for local dev.

---

### 2️⃣ Backend API — `backend/finsight-api` has no `.env` file

The Java backend reads environment variables from your **terminal/shell session** (not a `.env` file — Java doesn't load `.env` automatically). You set them in PowerShell before running the JAR:

```powershell
$env:MONGODB_URI       = "mongodb://localhost:27017/finsight"
$env:JWT_SECRET        = "your-secure-random-string-min-32-chars"
$env:JWT_REFRESH_SECRET= "another-secure-random-string-min-32-chars"
$env:GOOGLE_AI_API_KEY = "AIza..."
java -jar backend\finsight-api\target\finsight-api-1.0.0-SNAPSHOT-exec.jar
```

**Or** create a `.env.local` helper batch/PowerShell script at the repo root:

> File: `start-api.ps1`
```powershell
$env:MONGODB_URI        = "mongodb://localhost:27017/finsight"
$env:JWT_SECRET         = "super-secret-jwt-key-min-32-characters"
$env:JWT_REFRESH_SECRET = "super-secret-refresh-key-min-32-chars"
$env:GOOGLE_AI_API_KEY  = "AIza..."
$env:JAVA_HOME          = "C:\Program Files\Java\jdk-21.0.10"
java -jar backend\finsight-api\target\finsight-api-1.0.0-SNAPSHOT-exec.jar
```

---

### 3️⃣ MCP Service — `backend/finsight-mcp`

> File: `start-mcp.ps1`
```powershell
$env:MONGODB_URI = "mongodb://localhost:27017/finsight"
$env:JWT_SECRET  = "super-secret-jwt-key-min-32-characters"   # MUST match API's JWT_SECRET!
$env:JAVA_HOME   = "C:\Program Files\Java\jdk-21.0.10"
java -jar backend\finsight-mcp\target\finsight-mcp-1.0.0-SNAPSHOT.jar
```

---

### 4️⃣ Agentic AI Service — `backend/finsight-agentic`

> File: `start-agentic.ps1`
```powershell
$env:GOOGLE_AI_API_KEY = "AIza..."
$env:MCP_SERVER_URL    = "http://localhost:5100"
$env:JAVA_HOME         = "C:\Program Files\Java\jdk-21.0.10"
java -jar backend\finsight-agentic\target\finsight-agentic-1.0.0-SNAPSHOT.jar
```

---

### Complete Environment Variable Reference

| Variable | Service | Required | Default | Description |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Frontend | ✅ | `http://localhost:4000/api/v1` | Points frontend to Java API |
| `NEXTAUTH_URL` | Frontend | ✅ | `http://localhost:3000` | NextAuth base URL |
| `NEXTAUTH_SECRET` | Frontend | ✅ | *(placeholder)* | Signs NextAuth session cookies |
| `MONGODB_URI` | API, MCP | ✅ | `mongodb://localhost:27017/finsight` | MongoDB connection string |
| `JWT_SECRET` | API, MCP | ✅ | *(insecure default)* | **Must be identical in API and MCP** |
| `JWT_REFRESH_SECRET` | API only | ✅ | *(insecure default)* | For refresh token generation |
| `GOOGLE_AI_API_KEY` | API, Agentic | For AI features | *(empty)* | Your Gemini API key |
| `MCP_SERVER_URL` | Agentic | ✅ | `http://localhost:5100` | URL of the MCP server |
| `API_PORT` | API | No | `4000` | Override API port |
| `MCP_PORT` | MCP | No | `5100` | Override MCP port |
| `AGENT_PORT` | Agentic | No | `5200` | Override Agentic port |

> ⚠️ **Critical:** `JWT_SECRET` must be the **exact same string** in both `finsight-api` and `finsight-mcp`. If they differ, MCP cannot validate tokens issued by the API and all AI features will return "Invalid or expired token".

---

## Part 2 — What is MCP?

**MCP (Model Context Protocol)** is an open standard created by Anthropic that defines a contract between an **AI model** and **external tools/data sources**. Think of it as a universal plugin system for AI agents.

Instead of hardcoding database queries inside your AI prompts (messy, insecure), MCP lets the AI dynamically **discover and call tools** at runtime — exactly like function calling in OpenAI, but standardised.

### The Simple Mental Model

```
User asks a question
    ↓
AI Agent (Gemini/Claude) thinks: "I need data to answer this"
    ↓
AI calls an MCP Tool: e.g., listTransactions({ userId: "..." })
    ↓
MCP Server fetches from MongoDB and returns structured JSON
    ↓
AI reads the data and formulates a human answer
    ↓
User gets a smart, data-grounded response
```

Without MCP, the AI would have to hallucinate answers. With MCP, it has **real-time access to your actual financial data**.

---

## Part 3 — How MCP Is Used in FinSight (In Detail)

FinSight uses MCP for its **AI financial advisor feature** ("Ask AI" / chat on the dashboard). There are **three separate Java modules** involved:

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Browser)                           │
│             Clicks "Ask AI" → types a question                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTP POST /agent/chat
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│           finsight-agentic  (Port 5200)                         │
│           The AI Orchestration Service                          │
│                                                                 │
│  1. Receives user message + JWT token                           │
│  2. Orchestrator routes to a specialist agent                   │
│  3. Specialist agent calls Gemini with MCP tools attached       │
│  4. Gemini decides which MCP tools to call                      │
│  5. Spring AI calls MCP server with those tool requests         │
└────────────────────────┬────────────────────────────────────────┘
                         │ SSE (Server-Sent Events) via HTTP
                         │ URL: http://localhost:5100?token=<JWT>
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           finsight-mcp  (Port 5100)                             │
│           The MCP Tool Server                                   │
│                                                                 │
│  Exposes 35 tools Gemini can call:                              │
│  ├─ AccountTool    (list, get, create, update, delete)          │
│  ├─ TransactionTool (list, get, create, update, delete, import) │
│  ├─ BudgetTool     (list, get, create, update, delete)          │
│  ├─ GoalTool       (list, get, create, update, delete)          │
│  ├─ CategoryTool   (list, get, create, update, delete)          │
│  ├─ RecurringTool  (list, get, create, update, delete)          │
│  └─ AnalyticsTool  (spending summary, trends, cash flow)        │
│                                                                 │
│  Each tool validates JWT → fetches from MongoDB → returns JSON  │
└────────────────────────┬────────────────────────────────────────┘
                         │ MongoDB queries (same DB as API)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MongoDB (Port 27017)                       │
│                   Database: finsight                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 4 — The 4 Specialist AI Agents

The `OrchestratorAgent` reads the user's message and routes it to one of four specialist agents:

| Agent | Bean Name | Handles | System Prompt |
|---|---|---|---|
| `FinancialAdvisorAgent` | `financialAdvisorAgent` | General money advice, spending review | `financial-advisor.md` |
| `BudgetOptimizerAgent` | `budgetOptimizerAgent` | Budget creation, overspending alerts | `budget-optimizer.md` |
| `ForecasterAgent` | `forecasterAgent` | Spending predictions, cash flow forecasts | `forecaster.md` |
| `AnomalyDetectorAgent` | `anomalyDetectorAgent` | Unusual transactions, fraud detection | `anomaly-detector.md` |

**Routing example:**
- "Am I spending too much on groceries?" → `FinancialAdvisorAgent`
- "How can I reduce my monthly expenses?" → `BudgetOptimizerAgent`
- "Will I have enough money next month?" → `ForecasterAgent`
- "Why is there a $400 charge I don't recognize?" → `AnomalyDetectorAgent`

---

## Part 5 — How a Single AI Request Flows (Code-Level)

### Step 1: User sends message (Frontend → Agentic)
```
POST http://localhost:5200/agent/chat
Authorization: Bearer <JWT from NextAuth session>
Body: { "message": "How much did I spend on food last month?" }
```

### Step 2: Agentic creates an MCP client with the user's token
```java
// McpClientManager.java
McpSyncClient client = McpClient.sync(transport)
    .requestTimeout(Duration.ofSeconds(30))
    .build();
// URL used: http://localhost:5100?token=<JWT>
```

### Step 3: Orchestrator routes, specialist agent calls Gemini with MCP tools
```java
// BaseAgent.java
List<FunctionCallback> callbacks = mcpClient.listTools().tools().stream()
    .map(tool -> new SyncMcpToolCallback(mcpClient, tool))
    .toList();

chatClient.prompt()
    .system(getSystemPrompt())        // e.g., financial-advisor.md
    .user("How much did I spend on food last month?")
    .functions(callbacks)             // All MCP tools registered here
    .call().chatResponse();
```

### Step 4: Gemini decides to call `listTransactions` tool
Gemini internally says: *"I need transaction data. I'll call `listTransactions` with category=food."*

Spring AI intercepts this tool call request and forwards it to MCP.

### Step 5: MCP server handles the tool call
```java
// TransactionTool.java
public Function<TransactionListRequest, String> listTransactions() {
    return req -> {
        String userId = authResolver.resolveUserId(req.token()); // validates JWT
        Page<Transaction> txns = transactionService.list(userId, req.filter(), ...);
        return toJson(txns); // returns JSON to Gemini
    };
}
```

### Step 6: Gemini reads the real data and responds
Gemini now has your actual transaction data and writes:
> *"Last month you spent ₹12,450 on food across 23 transactions. Your highest spend was at Swiggy (₹3,200). This is 18% higher than your previous month..."*

---

## Part 6 — The MCP Transport: SSE vs STDIO

The `application.yml` of `finsight-mcp` has:
```yaml
spring.ai.mcp.server.transport: STDIO
```

This is **important**:

| Mode | What it means | When to use |
|---|---|---|
| `STDIO` | MCP server communicates via stdin/stdout pipes | When both client and server run on the **same machine** as separate processes |
| `SSE` | MCP server exposes an HTTP endpoint using Server-Sent Events | When client and server run on **different machines** (e.g. Docker, cloud) |

**Currently:** The agentic service connects via HTTP SSE (`HttpClientSseClientTransport` in `McpClientManager.java`), but the MCP server is configured as `STDIO`. 

> ⚠️ **This is a mismatch!** To fix it locally, change `finsight-mcp/application.yml`:
> ```yaml
> spring.ai.mcp.server.transport: SSE
> ```
> Then rebuild `finsight-mcp` and restart it.

---

## Part 7 — What the MCP Server Is NOT

The MCP server is **not** the same as the REST API (`finsight-api`). The key differences:

| | `finsight-api` (Port 4000) | `finsight-mcp` (Port 5100) |
|---|---|---|
| **Used by** | Frontend (Next.js) directly | Only the Agentic AI service |
| **Protocol** | REST (JSON over HTTP) | MCP protocol (SSE/STDIO) |
| **Auth** | JWT in `Authorization: Bearer` header | JWT passed inside tool call payload |
| **Purpose** | CRUD operations for the app UI | Giving AI models structured access to user data |
| **Caller** | Human (via browser) | AI model (Gemini) |

**Both** connect to the **same MongoDB database** — MCP is not a separate data store, just a different interface layer over the same data.

---

## Part 8 — Summary: Service Startup Order

Services must start in this order because of dependencies:

```
1. MongoDB          → must be running first (both API and MCP need it)
2. finsight-api     → Port 4000 (REST API for the frontend)
3. finsight-mcp     → Port 5100 (MCP tool server for the AI agent)
4. finsight-agentic → Port 5200 (AI orchestration, connects to MCP at startup)
5. Next.js frontend → Port 3000 (connects to API at port 4000)
```

If you start `finsight-agentic` before `finsight-mcp`, the agentic service will fail to connect to MCP and crash.
