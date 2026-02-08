# Based on
# https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html

# Build the JAR
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
# Copy Gradle wrapper and build files first (for Docker layer caching)
# This means if only your source code changes, the dependency download is cached
COPY gradle/ gradle/
COPY gradlew build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon
# Now copy source and build
COPY src/ src/
RUN ./gradlew bootJar --no-daemon -x test

# Extract the JAR into layers
FROM eclipse-temurin:25-jdk AS extract
WORKDIR /builder
COPY --from=build /app/build/libs/*.jar application.jar
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

# Runtime (minimal JRE image)
FROM eclipse-temurin:25-jre
WORKDIR /application
COPY --from=extract /builder/extracted/dependencies/ ./
COPY --from=extract /builder/extracted/spring-boot-loader/ ./
COPY --from=extract /builder/extracted/snapshot-dependencies/ ./
COPY --from=extract /builder/extracted/application/ ./
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "application.jar"]
