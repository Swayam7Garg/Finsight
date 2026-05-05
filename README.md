# FinSight

FinSight is an advanced personal finance tracking application featuring a modern Next.js frontend, a robust Spring Boot Java backend, and an intelligent Agentic AI advisor powered by the Model Context Protocol (MCP).

## 🚀 Architecture overview

This project is divided into the following core components:

* **Frontend (`frontend/`)**: A Next.js 14 application providing the user interface, dashboard, and AI chat.
* **Backend API (`backend/finsight-api`)**: A Spring Boot application providing RESTful endpoints for CRUD operations on financial data.
* **MCP Server (`backend/finsight-mcp`)**: A Spring AI Model Context Protocol server that exposes tools (like `listTransactions`, `createBudget`) to the AI model.
* **Agentic AI (`backend/finsight-agentic`)**: The orchestration service that connects to the LLM (Gemini/Claude) and the MCP Server to answer user financial queries.

## 🛠 Prerequisites

* **Java 21+**
* **Node.js 20+**
* **Maven**
* **MongoDB** (Local or Atlas)

## 📦 Getting Started

### 1. Setup Environment Variables

In `frontend/`, create a `.env` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secure-random-secret
```

### 2. Build the Backend

Navigate to the `backend/` directory and build the Java components:
```bash
cd backend
./mvnw clean install -DskipTests
```

### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 4. Run the Application
You can use the provided `start-all.ps1` script at the root of the project to launch all services automatically. Before running, ensure you edit `start-all.ps1` with your MongoDB URI and AI API Keys.

```powershell
.\start-all.ps1
```

Once started, the application will be available at **http://localhost:3000**.

## ✨ Features

* **Smart Dashboard**: Visualize your income, expenses, and net worth.
* **Transaction Tracking**: Add, edit, and categorize your transactions.
* **Goal Setting**: Set savings goals and track your progress.
* **Budget Optimization**: Create category-based budgets with real-time tracking.
* **AI Financial Advisor**: Chat with an AI that has context of your actual financial data (via MCP) to ask questions like "How much did I spend on food this month?"

## 📝 License

This project is licensed under the MIT License.
