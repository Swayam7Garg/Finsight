# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy the whole backend directory
COPY . /app

# Build and install everything
RUN mvn clean install -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the executable jar
COPY --from=builder /app/finsight-mcp/target/finsight-mcp-1.0.0-SNAPSHOT.jar app.jar

EXPOSE 5100

ENV JAVA_OPTS="-Xms128m -Xmx256m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
