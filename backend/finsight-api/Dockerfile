# Build stage
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy the whole backend directory (including parent pom and common module)
COPY . /app

# Build and install everything to ensure internal dependencies are available
RUN mvn clean install -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the repackaged executable jar
COPY --from=builder /app/finsight-api/target/finsight-api-1.0.0-SNAPSHOT-exec.jar app.jar

EXPOSE 4000

ENV JAVA_OPTS="-Xms256m -Xmx512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
