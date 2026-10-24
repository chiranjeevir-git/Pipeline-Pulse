# --- Stage 1: Build the JAR using Java 21 ---
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Trust the corporate TLS-inspection root CA so Maven can reach Maven Central

#COPY certs/ /tmp/certs/
#RUN for c in /tmp/certs/*.crt; do \
#      keytool -importcert -noprompt -trustcacerts -cacerts -storepass changeit \
#        -alias "$(basename $c .crt)" -file "$c"; \
#    done

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# --- Stage 2: Run the application using Java 21 JRE ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]
