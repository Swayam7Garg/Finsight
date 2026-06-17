<div align="center">

<br/>

```
███████╗██╗███╗   ██╗███████╗██╗ ██████╗ ██╗  ██╗████████╗
██╔════╝██║████╗  ██║██╔════╝██║██╔════╝ ██║  ██║╚══██╔══╝
█████╗  ██║██╔██╗ ██║███████╗██║██║  ███╗███████║   ██║   
██╔══╝  ██║██║╚██╗██║╚════██║██║██║   ██║██╔══██║   ██║   
██║     ██║██║ ╚████║███████║██║╚██████╔╝██║  ██║   ██║   
╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
```

# FinSight — AI-Powered Personal Finance Manager

**Take control of your financial future with intelligent insights, real-time analytics, and AI-driven recommendations.**

<br/>

[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

<br/>

[🚀 **Live Demo**](https://finsight-six-ochre.vercel.app/) · [📖 Docs](#-documentation) · [🛠 Setup](#-local-setup) · [🤝 Contribute](#-contributing)

<br/>

</div>

---

## 📌 Project Overview

Modern personal finance is fragmented — spreadsheets, bank portals, mental math. **FinSight** unifies everything into one intelligent platform.

FinSight gives individuals a full picture of their financial life: track every rupee earned and spent, set and enforce monthly budgets, pursue savings goals with visual progress tracking, and receive AI-generated insights tailored to their actual spending patterns.

The flagship **Financial Health Score** engine synthesizes cash flow, budget adherence, goal progress, and transaction consistency into a single, actionable grade — giving users an honest snapshot of where they stand and a clear path forward.

**Key value propositions:**

- **Unified Dashboard** — income, expenses, budgets, and goals in a single view
- **AI Advisor** — personalized financial recommendations powered by language models
- **Financial Health Score** — a composite wellness metric with grade, breakdown, and action items
- **Secure by Design** — JWT-based authentication with NextAuth session management
- **Production Ready** — deployed on Vercel with a robust Spring Boot backend

---

## ✨ Feature Showcase

| Feature | Description | Status |
|---|---|---|
| 💸 **Transactions** | Track income and expenses with category tagging, search, and advanced filtering | ✅ Live |
| 📊 **Budgets** | Set monthly category budgets, monitor spend rate, receive over-budget alerts | ✅ Live |
| 🎯 **Goals** | Define savings targets with deadlines and visualize progress in real time | ✅ Live |
| 📈 **Analytics** | Spending breakdowns, income vs expense trends, monthly summaries | ✅ Live |
| 🤖 **AI Advisor** | Personalized financial insights and recommendations via AI | ✅ Live |
| 🏥 **Financial Health Score** | Composite score (cash flow + budgets + goals + consistency) with grade & recommendations | ✅ Live |
| 📱 **Mobile App** | Native iOS/Android application | 🔜 Roadmap |
| 🔮 **Predictive Analytics** | ML-based spending forecasting | 🔜 Roadmap |
| 📷 **OCR Receipt Scanning** | Automatic transaction capture from receipts | 🔜 Roadmap |
| 📉 **Investment Tracking** | Portfolio and investment monitoring | 🔜 Roadmap |

---

## 🖼 Screenshots

<details>
<summary><strong>Click to expand screenshots</strong></summary>

<br/>

### 🔐 Login
![Login Screen](./docs/images/login.png)

### 🏠 Dashboard
![Dashboard](./docs/images/dashboard.png)

### 💸 Transactions
![Transactions](./docs/images/transactions.png)

### 📊 Budgets
![Budgets](./docs/images/budgets.png)

### 🎯 Goals
![Goals](./docs/images/goals.png)

### 📈 Analytics
![Analytics](./docs/images/analytics.png)

### 🤖 AI Advisor
![AI Advisor](./docs/images/ai-advisor.png)

### 🏥 Financial Health Score
![Financial Health Score](./docs/images/health-score.png)

</details>

---

## 🏛 System Architecture

The platform follows a clean **three-tier architecture** with a dedicated AI layer and a financial health computation engine.

```mermaid
graph TB
    subgraph Client["🖥 Client Layer"]
        UI[Next.js 14 Frontend]
        NA[NextAuth Session Manager]
    end

    subgraph API["⚙️ API Layer"]
        SB[Spring Boot 3 REST API]
        JA[JWT Auth Filter]
        FHS[Financial Health Score Engine]
        AI[AI Advisor Module]
    end

    subgraph Data["🗄 Data Layer"]
        MDB[(MongoDB Atlas)]
    end

    subgraph External["🌐 External Services"]
        LLM[AI Language Model]
    end

    User((👤 User)) --> UI
    UI <--> NA
    UI -- "HTTPS / REST" --> JA
    JA --> SB
    SB --> FHS
    SB --> AI
    AI <--> LLM
    SB <--> MDB
    FHS <--> MDB
```

---

## 📦 C4 Container Diagram

```mermaid
graph TB
    User((Person\nEnd User))

    subgraph FinSight System
        FE["Frontend Container\nNext.js 14 · TypeScript\nTailwindCSS · TanStack Query\n──────────────────\nSPA served via Vercel CDN"]
        BE["Backend Container\nSpring Boot 3 · Java 21\nMaven\n──────────────────\nREST API · Business Logic\nJWT Security Layer"]
        DB[("Database Container\nMongoDB Atlas\n──────────────────\nDocument Store\nCollections: users,\ntransactions, budgets,\ngoals, categories")]
        AIL["AI Layer\nLLM Integration\n──────────────────\nPersonalized Advice\nFinancial Insights"]
    end

    User -- "HTTPS\n[Browser/PWA]" --> FE
    FE -- "REST API calls\nBearer JWT" --> BE
    BE -- "MongoDB Wire Protocol" --> DB
    BE -- "HTTP / API calls" --> AIL
```

---

## 🔐 Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant NA as NextAuth
    participant BE as Spring Boot API
    participant DB as MongoDB

    User->>FE: Enter credentials
    FE->>NA: signIn(email, password)
    NA->>BE: POST /api/v1/auth/login
    BE->>DB: Find user by email
    DB-->>BE: User document
    BE->>BE: Validate password (BCrypt)
    BE->>BE: Generate JWT (Access + Refresh)
    BE-->>NA: { accessToken, refreshToken, user }
    NA-->>FE: Session created
    FE-->>User: Redirect to Dashboard

    Note over FE,BE: All subsequent requests include Authorization: Bearer <token>

    FE->>BE: GET /api/v1/transactions (+ JWT header)
    BE->>BE: JWT Filter validates token
    BE->>DB: Query user transactions
    DB-->>BE: Results
    BE-->>FE: 200 OK + data
```

---

## 🏥 Financial Health Score Architecture

```mermaid
graph LR
    subgraph Inputs
        T[💸 Transactions\nIncome & Expense Records]
        B[📊 Budgets\nMonthly Budget Data]
        G[🎯 Goals\nSavings Targets & Progress]
    end

    subgraph Engine["🔢 Financial Health Score Engine"]
        CF[Cash Flow\nAnalyzer]
        BH[Budget Health\nCalculator]
        GP[Goal Progress\nEvaluator]
        TC[Transaction\nConsistency Checker]
        AGG[Score Aggregator\nWeighted Average]
    end

    subgraph Output
        SC[📊 Numeric Score\n0 – 100]
        GR[🅰 Grade\nA+ to F]
        REC[💡 Recommendations\nActionable Insights]
        BD[📋 Breakdown\nPer-Category Detail]
    end

    T --> CF
    T --> TC
    B --> BH
    G --> GP

    CF --> AGG
    BH --> AGG
    GP --> AGG
    TC --> AGG

    AGG --> SC
    AGG --> GR
    AGG --> REC
    AGG --> BD
```

**Scoring Weights:**

| Component | Weight | Description |
|---|---|---|
| Cash Flow | 35% | Income-to-expense ratio over rolling 30 days |
| Budget Health | 30% | Percentage of budgets within limit |
| Goal Progress | 20% | Weighted progress across active savings goals |
| Transaction Consistency | 15% | Regularity of financial record-keeping |

---

## 🗄 Database ER Diagram

```mermaid
erDiagram
    USER {
        ObjectId _id PK
        string email UK
        string passwordHash
        string name
        datetime createdAt
        datetime updatedAt
    }

    TRANSACTION {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId categoryId FK
        string type "INCOME | EXPENSE"
        number amount
        string description
        date date
        string notes
        datetime createdAt
    }

    BUDGET {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId categoryId FK
        number limitAmount
        number month
        number year
        datetime createdAt
    }

    GOAL {
        ObjectId _id PK
        ObjectId userId FK
        string name
        number targetAmount
        number currentAmount
        date targetDate
        string status "ACTIVE | COMPLETED | PAUSED"
        datetime createdAt
    }

    CATEGORY {
        ObjectId _id PK
        ObjectId userId FK
        string name
        string icon
        string color
        string type "INCOME | EXPENSE | BOTH"
    }

    RECURRING_RULE {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId categoryId FK
        string name
        number amount
        string frequency "DAILY | WEEKLY | MONTHLY"
        date startDate
        date nextRunDate
        boolean isActive
    }

    USER ||--o{ TRANSACTION : "records"
    USER ||--o{ BUDGET : "sets"
    USER ||--o{ GOAL : "pursues"
    USER ||--o{ CATEGORY : "defines"
    USER ||--o{ RECURRING_RULE : "configures"
    CATEGORY ||--o{ TRANSACTION : "tags"
    CATEGORY ||--o{ BUDGET : "scopes"
    RECURRING_RULE ||--o{ TRANSACTION : "generates"
```

---

## 🔄 Request Lifecycle — Create Transaction

```mermaid
sequenceDiagram
    actor User
    participant FE as Next.js Frontend
    participant TQ as TanStack Query
    participant BE as Spring Boot API
    participant JF as JWT Filter
    participant SVC as Transaction Service
    participant DB as MongoDB

    User->>FE: Fill transaction form & submit
    FE->>TQ: useMutation → createTransaction(payload)
    TQ->>BE: POST /api/v1/transactions\n{ Authorization: Bearer <token> }
    BE->>JF: Intercept request
    JF->>JF: Validate JWT signature & expiry
    JF->>BE: Set SecurityContext (userId)
    BE->>SVC: createTransaction(userId, dto)
    SVC->>SVC: Validate & enrich (category, date)
    SVC->>DB: Insert Transaction document
    DB-->>SVC: Saved document + ObjectId
    SVC-->>BE: TransactionResponseDto
    BE-->>TQ: 201 Created + body
    TQ->>TQ: Invalidate query cache\n['transactions', 'analytics']
    TQ-->>FE: Re-fetch & update UI
    FE-->>User: Transaction visible in list
```

---

## 📁 Folder Structure

```
finsight/
├── backend/                          # Spring Boot Parent Multi-Module Project
│   ├── finsight-common/              # Shared entities, DTOs, & exceptions
│   │   └── src/main/java/com/finsight/common/
│   │       ├── model/                # MongoDB document models (User, Transaction, etc.)
│   │       ├── dto/                  # Request/Response DTOs
│   │       └── exception/            # Global custom exception classes
│   │
│   ├── finsight-api/                 # Core REST API & Business Logic (Port 4000)
│   │   └── src/main/java/com/finsight/api/
│   │       ├── controller/           # REST endpoints (Transactions, Budgets, etc.)
│   │       ├── service/              # Core business services & AI Advisor
│   │       ├── repository/           # Spring Data MongoDB Repository interfaces
│   │       ├── config/               # Security, CORS, and Jackson configs
│   │       └── security/             # JWT filters and auth utilities
│   │
│   ├── finsight-mcp/                 # Model Context Protocol (MCP) Server (Port 10000 / 5100)
│   │   └── src/main/java/com/finsight/mcp/
│   │       ├── tool/                 # Decoupled MCP tools registered for AI agents
│   │       └── config/               # MCP security and JWT validation setup
│   │
│   ├── finsight-agentic/             # Specialized Agentic AI orchestrator (Port 5200)
│   │   └── src/main/java/com/finsight/agentic/
│   │       └── config/               # Spring AI configuration
│   └── pom.xml                       # Root Maven Parent POM
│
├── frontend/                         # Next.js Application (Port 3000)
│   ├── src/app/                      # Next.js App Router pages
│   │   ├── (auth)/                   # Login, register, forgot-password
│   │   ├── (dashboard)/              # Dashboard, transactions, budgets, goals, etc.
│   │   └── api/                      # NextAuth authentication endpoint
│   ├── src/components/               # Reusable UI components & Recharts wrappers
│   ├── src/hooks/                    # Custom React hooks (TanStack Query integrations)
│   ├── src/lib/                      # Helper libraries and utilities
│   └── package.json
```

---

## 🔌 API Overview

All endpoints are prefixed with `/api/v1` and require `Authorization: Bearer <token>` unless marked as public.

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/auth/register` | Register new user | Public |
| `POST` | `/auth/login` | Login & receive JWT | Public |
| `POST` | `/auth/refresh` | Refresh access token | Refresh token |
| `GET` | `/auth/me` | Get current user profile | ✅ |

### 💸 Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/transactions` | List with filters (category, date range, type, search) |
| `POST` | `/transactions` | Create transaction |
| `GET` | `/transactions/{id}` | Get single transaction |
| `PUT` | `/transactions/{id}` | Update transaction |
| `DELETE` | `/transactions/{id}` | Delete transaction |

### 📊 Budgets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/budgets` | List budgets (optionally by month/year) |
| `POST` | `/budgets` | Create monthly budget |
| `PUT` | `/budgets/{id}` | Update budget limit |
| `DELETE` | `/budgets/{id}` | Delete budget |

### 🎯 Goals

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/goals` | List all savings goals |
| `POST` | `/goals` | Create goal |
| `PUT` | `/goals/{id}` | Update goal (name, target, status) |
| `POST` | `/goals/{id}/contribute` | Add contribution to goal |
| `DELETE` | `/goals/{id}` | Delete goal |

### 📈 Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/summary` | Income vs expense summary |
| `GET` | `/analytics/spending-by-category` | Category breakdown |
| `GET` | `/analytics/monthly-trend` | Monthly trend data |
| `GET` | `/analytics/financial-health-score` | **Financial Health Score** |

**Financial Health Score Response:**

```json
{
  "score": 78,
  "grade": "B+",
  "breakdown": [
    {
      "key": "cashFlow",
      "label": "Cash Flow Health",
      "score": 82,
      "maxScore": 100,
      "status": "GOOD",
      "detail": "Net positive income over expenses."
    },
    {
      "key": "budgetHealth",
      "label": "Budget Adherence",
      "score": 75,
      "maxScore": 100,
      "status": "WARNING",
      "detail": "Some category budgets are near limits."
    }
  ],
  "recommendations": [
    {
      "key": "grocery_limit",
      "title": "Reduce Food Spending",
      "description": "Your grocery spending is 18% over budget this month.",
      "priority": "HIGH"
    }
  ],
  "calculatedAt": "2026-06-16T15:20:00Z"
}
```

---

## 🛠 Local Setup

### Prerequisites

| Tool | Version |
|---|---|
| Java (JDK) | 21+ |
| Node.js | 18+ |
| npm / yarn | Latest |
| MongoDB | Atlas URI or local 6.0+ |
| Maven | 3.9+ |

---

### 1. Clone the Repository

```bash
git clone https://github.com/Swayam7Garg/Finsight.git
cd Finsight
```

### 2. Backend Setup

```bash
cd backend
# Build all modules and install dependencies
mvn clean install
```

Each module has its own `application.yml` for configuration. For the core API (`finsight-api`), create or modify `src/main/resources/application.yml` (or set environment variables):

```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/finsight}

app:
  jwt:
    secret: ${JWT_SECRET:your-very-long-super-secret-key-here}
    refresh-secret: ${JWT_REFRESH_SECRET:your-refresh-secret-key-here}
    access-token-expiry: 15m
    refresh-token-expiry: 7d
  cors:
    allowed-origins: ${CORS_ORIGINS:http://localhost:3000}
  gemini:
    api-key: ${GOOGLE_AI_API_KEY:${GEMINI_API_KEY:}}
  groq:
    api-key: ${GROQ_API_KEY:}

server:
  port: 4000
```

Now, run each service in a separate terminal:

```bash
# 1. Run the Core API (starts on Port 4000)
cd finsight-api
mvn spring-boot:run

# 2. Run the MCP Server (starts on Port 10000 or 5100)
cd ../finsight-mcp
mvn spring-boot:run

# 3. Run the Agentic AI Service (starts on Port 5200)
cd ../finsight-agentic
mvn spring-boot:run
```

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env.local` inside the `frontend/` directory:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

```bash
# Start the Next.js development server
npm run dev
```

Frontend starts at `http://localhost:3000`

---

### 4. Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | HS256 signing key (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | HS256 refresh signing key |
| `GROQ_API_KEY` | ⚠️ | API key for the Groq Advisor model (Llama-3.3) |
| `GOOGLE_AI_API_KEY` | ⚠️ | API key for the Gemini model |
| `NEXTAUTH_SECRET` | ✅ | NextAuth session encryption key |
| `NEXT_PUBLIC_API_URL` | ✅ | Backend base URL |

---

## 🚀 Deployment Architecture

```mermaid
graph TB
    Dev[👩‍💻 Developer\nLocal Machine]
    
    subgraph VCS["Version Control"]
        GH[GitHub Repository\nmain · develop · feature/*]
    end

    subgraph FrontendDeploy["Frontend — Vercel"]
        VCL[Vercel CDN\nEdge Network]
        FEA[Next.js App\nSSR + Static]
    end

    subgraph BackendDeploy["Backend — Cloud Host"]
        BE[Spring Boot JAR\nJava 21 Runtime]
    end

    subgraph DBLayer["Database — MongoDB Atlas"]
        MDB[(MongoDB Atlas\nM0 → M10 Cluster)]
    end

    Dev -- "git push" --> GH
    GH -- "Auto Deploy\n(Vercel GitHub App)" --> VCL
    VCL --> FEA
    GH -- "CI/CD Pipeline\n(GitHub Actions)" --> BE
    FEA -- "HTTPS REST" --> BE
    BE -- "Wire Protocol\nTLS" --> MDB
```

---

## 🗺 Roadmap

```mermaid
gantt
    title FinSight — Development Roadmap
    dateFormat  YYYY-MM-DD
    section ✅ Completed
    Transaction Management     :done, t1, 2024-01-01, 2024-02-15
    Budget Management          :done, t2, 2024-02-01, 2024-03-01
    Savings Goals              :done, t3, 2024-02-15, 2024-03-15
    Analytics Dashboard        :done, t4, 2024-03-01, 2024-04-01
    AI Financial Advisor       :done, t5, 2024-04-01, 2024-05-01
    Financial Health Score     :done, t6, 2024-05-01, 2024-06-15

    section 🔜 Upcoming
    Predictive Analytics       :active, u1, 2024-07-01, 2024-09-01
    Mobile App (React Native)  :u2, 2024-09-01, 2024-12-01
    Investment Tracking        :u3, 2024-10-01, 2025-01-01
    OCR Receipt Scanning       :u4, 2024-11-01, 2025-02-01
```

---

## 🤝 Contributing

We welcome contributions from the community! Please read these guidelines before opening a PR.

### Branching Strategy

```
main          ← production-ready code
develop       ← integration branch
feature/*     ← new features (feature/health-score)
fix/*         ← bug fixes (fix/budget-calculation)
docs/*        ← documentation updates
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(health-score): add grade breakdown component
fix(auth): resolve JWT refresh token expiry edge case
docs(api): update transaction endpoint examples
refactor(service): extract budget validation logic
test(goals): add unit tests for goal progress calculator
```

### Pull Request Process

1. Fork the repo and create your branch from `develop`
2. Ensure your code passes all existing tests: `mvn test` (backend), `npm run test` (frontend)
3. Add tests for new functionality
4. Update relevant documentation
5. Open a PR against `develop` with a clear description of what was changed and why
6. Request a review from at least one maintainer

---

## 📖 Documentation

| Document | Description |
|---|---|
| [📘 User Manual](./docs/USER_MANUAL.md) | End-user guide for all features |
| [🔧 Setup Guide](./docs/SETUP.md) | Detailed local and production setup |
| [🏛 Architecture Guide](./docs/ARCHITECTURE.md) | System design decisions and diagrams |
| [🔌 API Reference](./docs/API.md) | Complete REST API documentation |
| [🏥 Financial Health Score Spec](./docs/health-score/SPEC.md) | Algorithm, weights, grade thresholds, and examples |

---

## 👥 Contributors

<table>
  <tr>
    <td align="center" width="250">
      <b>Swayam Garg</b><br/>
      <sub>Project Owner & Lead Developer</sub><br/>
      <sub>Architecture · Backend · Frontend · AI Integration</sub>
    </td>
    <td align="center" width="250">
      <b>Ishika Upadhyay</b><br/>
      <sub>Feature Developer & Technical Writer</sub><br/>
      <sub>Financial Health Score · Documentation</sub>
    </td>
    <td align="center" width="250">
      <b>Swadesh Narwariya</b><br/>
      <sub>Frontend Engineer</sub><br/>
      <sub>UI Components & Frontend Flow</sub>
    </td>
    <td align="center" width="250">
      <b>Shrishti Goswami</b><br/>
      <sub>Researcher</sub><br/>
      <sub>Market Research & Insights Analysis</sub>
    </td>
  </tr>
</table>

---

## 📄 License

```
MIT License

Copyright (c) 2024 Swayam Garg & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Built with ❤️ by the FinSight Team**

[🚀 Live Demo](https://finsight-six-ochre.vercel.app/) · [⬆ Back to Top](#finsight--ai-powered-personal-finance-manager)

</div>
