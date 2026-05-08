FROM eclipse-temurin:17

COPY . .

WORKDIR /server1.12.2

EXPOSE 25565
EXPOSE 8080

CMD ["java", "main.jar"]
