FROM eclipse-temurin:17

COPY . .

WORKDIR /

EXPOSE 25565
EXPOSE 8080

CMD ["java", "main.jar"]
