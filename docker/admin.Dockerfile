FROM gradle:8-jdk17-alpine AS builder

WORKDIR /build

# Copy gradle files
COPY packages/admin-server/build.gradle .
COPY packages/admin-server/settings.gradle* .

# Download dependencies
RUN gradle dependencies --no-daemon || true

# Copy source
COPY packages/admin-server/src ./src

# Build
RUN gradle bootJar --no-daemon

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy built jar
COPY --from=builder /build/build/libs/*.jar app.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/admin/actuator/health || exit 1

# Start application
ENTRYPOINT ["java", "-jar", "app.jar"]
