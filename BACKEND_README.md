# FinSight Backend Guide

The FinSight backend is built using **Java 21**, **Spring Boot 3.4**, and **Spring AI**. This document provides an overview of the key components and annotations used across the microservices to help you understand the flow and structure of the application.

## Services Overview
1. **`finsight-common`**: Contains shared data models (for MongoDB), Data Transfer Objects (DTOs), and security classes.
2. **`finsight-api`**: The main REST API that exposes endpoints for the Next.js frontend. It contains the core controllers, services, and repositories.
3. **`finsight-mcp`**: The Spring AI Model Context Protocol (MCP) server that exposes internal tools to language models.
4. **`finsight-agentic`**: The service that uses Spring AI chat clients to power specialized financial agents (e.g., Forecaster, Advisor).

## Core Spring Annotations Explained

### 1. Controllers (`@RestController`)
Found in `finsight-api/src/main/java/com/finsight/api/controller`. Controllers act as the entry points for frontend HTTP requests.

* **`@RestController`**: Combines `@Controller` and `@ResponseBody`. It tells Spring this class serves REST endpoints and should automatically serialize the returned objects to JSON.
* **`@RequestMapping("/api/v1/...")`**: Defines the base URL path for all endpoints defined within the controller.
* **`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`**: Maps specific HTTP methods (GET, POST, PUT, DELETE) to methods in the class.
* **`@RequestBody`**: Binds the HTTP request body to a Java object (usually a DTO).
* **`@PathVariable`**: Extracts dynamic values from the URI path (e.g., in `/api/v1/accounts/{id}`, it extracts `{id}`).
* **`@RequestParam`**: Extracts query parameters from the URI string (e.g., `?startDate=2024-01-01`).
* **`@AuthenticationPrincipal`**: Injects the currently authenticated user's details directly into the controller method parameter, populated by the JWT filter.

### 2. Services (`@Service`)
Found in `service` directories. This is where business logic and database interactions happen.

* **`@Service`**: Marks the class as a Spring-managed service bean.
* **`@RequiredArgsConstructor`** (Lombok): Generates a constructor for all `final` fields, handling Spring dependency injection (e.g., injecting Repositories) automatically without needing `@Autowired`.

### 3. Models / Documents (`@Document`)
Found in `finsight-common/src/main/java/com/finsight/common/model`. Represents the schema for MongoDB.

* **`@Document(collection = "accounts")`**: Maps the Java class to a specific MongoDB collection named "accounts".
* **`@Id`**: Marks the field as the document's primary key (`_id` in MongoDB).
* **`@Field`**: Optional mapping for specific column names in MongoDB if they differ from the Java field name.
* **Lombok Annotations**: `@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder` are heavily used to generate getters, setters, constructors, `toString`, `equals`, `hashCode`, and builder patterns without writing boilerplate code.

### 4. Repositories
Found in `repository` directories. These are interfaces extending Spring Data MongoDB.

* **`MongoRepository<T, ID>`**: Provides built-in CRUD operations and query method generation (e.g., defining `List<Account> findByUserId(String userId)` automatically generates the query).

### 5. MCP Tools (`@Tool`)
Found in `finsight-mcp/src/main/java/com/finsight/mcp/tool`. Used by Spring AI MCP to expose local methods to LLMs.

* **`@Component`**: Makes the class a Spring bean so it's managed by the application context.
* **`@Tool`**: A Spring AI annotation that registers the method as an AI Tool. The language model can "see" this method and request to invoke it.
* **`@Description`**: Crucial for AI. It tells the LLM *what* the method does, enabling the LLM to know exactly when and why to call it.

### 6. Exception Handling (`@RestControllerAdvice`)
Used globally for consistent API error responses.

* **`@RestControllerAdvice`**: Intercepts exceptions thrown by any `@RestController` across the application.
* **`@ExceptionHandler(ResourceNotFoundException.class)`**: Defines which method handles which specific exception, formatting it into a consistent `ApiResponse` payload for the frontend.

---
## Request Flow Example

1. **Frontend** calls `GET /api/v1/accounts`.
2. **JwtAuthenticationFilter** validates the Bearer token and sets the SecurityContext.
3. **`AccountController`** receives the request at the method annotated with `@GetMapping`.
4. The controller extracts the user ID via `@AuthenticationPrincipal` and calls `accountService.getAccounts(userId)`.
5. **`AccountService`** calls `accountRepository.findByUserId(userId)`.
6. Data is returned from MongoDB, mapped to Java models, and returned through the layers as a JSON `ApiResponse`.
