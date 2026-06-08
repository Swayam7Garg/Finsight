# FinSight - Personal Finance Manager

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://jdk.java.net/21/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4-6DB33F?logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring_AI-1.0-6DB33F?logo=spring&logoColor=white)](https://spring.io/projects/spring-ai)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47a248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

A full-stack personal finance application with a **Next.js 14** frontend and a **Spring Boot 3.4 (Java 21)** backend architecture. 

FinSight features an **Express REST API** (now rewritten natively in Spring Boot), an **MCP Server** exposing financial tools for AI agents using Spring AI MCP, and an **Agentic AI** service with specialized AI-powered financial advisors.

---

## High-Level Architecture

* **Frontend (`apps/web`)**: Next.js 14 App Router, React 18, Tailwind CSS, shadcn/ui. Connects to the backend via REST API using TanStack Query.
* **Backend (`backend/`)**:
  * `finsight-api`: Main REST API (Port 4000). Handles user auth, data persistence, and core business logic.
  * `finsight-mcp`: Model Context Protocol Server (Port 5100). Exposes tools and resources to LLMs via Spring AI MCP.
  * `finsight-agentic`: Agentic AI Service (Port 5200). Orchestrator and specialist agents powered by Spring AI.
  * `finsight-common`: Shared DTOs, models, exceptions, and security utilities used across the microservices.

## Features

- **Multi-account tracking**: Checking, savings, credit cards, cash, investments
- **Transaction management**: CRUD, filtering, CSV import
- **Budget alerts**: Per-category budgets
- **Financial goals**: Target amounts, deadlines
- **Recurring rules**: Daily, weekly, monthly bills
- **Analytics dashboard**: Charts for spending, net worth, savings
- **Interactive API docs**: Swagger UI at `/api/docs`
- **In-app AI Advisor**: Chat with your finances directly in the app.
- **MCP Server**: Exposing tools for agent consumption.
- **Agentic AI**: Specialized advisors (Forecaster, Budget Optimizer, Anomaly Detector).

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Java 21
- Maven
- MongoDB (local or via Docker)

### 1. Database
Start MongoDB locally or use a MongoDB Atlas URI in your backend environment variables.

### 2. Backend (Spring Boot)
Configure your `.env` or set environment variables before running:
```env
MONGODB_URI=mongodb://localhost:27017/finsight
JWT_SECRET=this-is-a-very-secure-random-secret-key-that-is-32-chars-long
JWT_REFRESH_SECRET=another-very-secure-random-secret-key-that-is-32-chars
GOOGLE_AI_API_KEY=your_gemini_api_key
```

Run the API service:
```bash
cd backend/finsight-api
mvn spring-boot:run
```

Run the MCP Server:
```bash
cd backend/finsight-mcp
mvn spring-boot:run
```

Run the Agentic AI Service:
```bash
cd backend/finsight-agentic
mvn spring-boot:run
```

### 3. Frontend (Next.js)
```bash
cd apps/web
npm install
npm run dev
```
Access the web app at `http://localhost:3000`.

---
*For detailed information on the backend structure and how the Spring annotations are used, please refer to the [BACKEND_README.md](BACKEND_README.md).*
