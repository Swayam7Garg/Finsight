# FinSight Backend

FinSight is a personal finance tracker backend built on Spring Boot and MongoDB. It exposes a REST API for accounts, transactions, budgets, goals, analytics, and recurring rules, plus two AI-focused services: an agentic advisor service and a Model Context Protocol (MCP) server that exposes finance tools to AI agents.

This backend is a Maven multi-module project with four modules:

- `finsight-common`: shared domain models, DTOs, and error handling
- `finsight-api`: main REST API (JWT auth, CRUD, analytics, CSV import)
- `finsight-mcp`: MCP server that exposes the API as callable tools
- `finsight-agentic`: AI agent service (Spring AI + Anthropic) that uses MCP tools

## What This Project Does

At a high level, the backend provides:

- User registration, login, profile updates, and password reset
- Account management (checking, savings, credit card, cash, investment)
- Transaction management with filters, search, and pagination
- CSV import for transactions with field mapping and duplicate detection
- Categories with system defaults and usage-aware deletion rules
- Budgets with period tracking and alert thresholds
- Goals with progress tracking and completion logic
- Recurring rules with next due dates and one-click pay
- Analytics endpoints for spending and net worth summaries
- An AI agent service that can summarize and analyze finances
- An MCP server that exposes all finance actions as AI-callable tools

## Architecture Overview

```
backend/
  finsight-common/   -> Shared models, DTOs, ApiResponse, ApiException
  finsight-api/      -> REST API + JWT security + MongoDB access
  finsight-mcp/      -> MCP tool server (Spring AI MCP)
  finsight-agentic/  -> Agentic AI service using MCP tools
```

Data is stored in MongoDB collections (`users`, `accounts`, `transactions`, `categories`, `budgets`, `goals`, `recurringrules`). API responses are standardized using `ApiResponse<T>` with success/error shapes.

## Main REST API (finsight-api)

Base URL: `/api/v1`

- `Auth`: register, login, token refresh, profile, password reset
- `Accounts`: CRUD, balance history (placeholder), archive
- `Transactions`: CRUD, filters, search, CSV import
- `Categories`: defaults + user categories, usage-aware deletion
- `Budgets`: CRUD, summary with spend vs budget status
- `Goals`: CRUD, add funds, completion logic
- `Recurring`: CRUD, upcoming rules, mark paid
- `Analytics`: spending breakdown, income vs expense, trend, net worth
- `Advisor`: placeholder Gemini AI endpoints
- `Dev`: seed categories (dev only)
- `Health`: `/api/health`

OpenAPI docs are exposed at:

- `/api/docs` (Swagger UI)
- `/api/docs.json` (OpenAPI JSON)

### Security

- JWT-based authentication (Bearer tokens)
- Stateless sessions
- CORS configured via `app.cors.allowed-origins`

### CSV Import

`POST /api/v1/transactions/import` accepts a CSV file and optional JSON mapping. It:

- Parses common date formats
- Detects income/expense based on amount or explicit type
- Resolves categories by name with a fallback default
- Detects duplicates by date + amount + description

## Agentic AI Service (finsight-agentic)

The agentic service is a separate Spring Boot app that uses Spring AI (Anthropic) and MCP tool calls. It offers:

- `/api/v1/agent/chat`: free-form agent chat
- `/api/v1/agent/insights`: preset prompts (health, anomalies, budget review, forecast)
- `/api/v1/agent/insights/summary`: short finance summary

An orchestrator agent routes requests to specialized agents:

- `financial-advisor`
- `anomaly-detector`
- `budget-optimizer`
- `forecaster`

Prompts are loaded from classpath resources under `prompts/`.

## MCP Server (finsight-mcp)

The MCP server exposes backend actions as AI-callable tools. Tools include:

- Accounts, Transactions, Categories, Budgets, Goals, Recurring Rules, Analytics

Each tool accepts a JWT and payload, then calls the existing service layer. This is how the agentic service performs actions on behalf of the user.

## Environment Variables

### finsight-api

- `API_PORT` (default `4000`)
- `MONGODB_URI` (default `mongodb://localhost:27017/finsight`)
- `JWT_SECRET` (min 32 chars)
- `JWT_REFRESH_SECRET` (min 32 chars)
- `CORS_ORIGINS` (comma-separated)
- `GOOGLE_AI_API_KEY` or `GEMINI_API_KEY` (for advisor placeholder)
- `GEMINI_MODEL` (default `gemini-2.5-flash`)

### finsight-agentic

- `AGENT_PORT` (default `5200`)
- `ANTHROPIC_API_KEY`
- `MCP_SERVER_URL` (default `http://localhost:5100`)

### finsight-mcp

- `MCP_PORT` (default `5100`)
- `MONGODB_URI` (MongoDB connection string)
- `jwt.secret` (must match API secret if you want to decode API tokens)

## Local Development

From the `backend/` folder:

- Build all modules:
  - Windows: `mvnw.cmd -DskipTests package`
  - Mac/Linux: `./mvnw -DskipTests package`

- Run the API:
  - Windows: `mvnw.cmd -pl finsight-api -am spring-boot:run`
  - Mac/Linux: `./mvnw -pl finsight-api -am spring-boot:run`

- Run the MCP server:
  - Windows: `mvnw.cmd -pl finsight-mcp -am spring-boot:run`
  - Mac/Linux: `./mvnw -pl finsight-mcp -am spring-boot:run`

- Run the agentic service:
  - Windows: `mvnw.cmd -pl finsight-agentic -am spring-boot:run`
  - Mac/Linux: `./mvnw -pl finsight-agentic -am spring-boot:run`

## Notes and Current Gaps

- Account balance history is currently a placeholder in `AccountService`.
- Advisor endpoints in `finsight-api` are stubs until a Gemini API key is provided.
- The MCP server uses a JWT secret from `jwt.secret`; ensure it matches the API secret if tokens are shared.
