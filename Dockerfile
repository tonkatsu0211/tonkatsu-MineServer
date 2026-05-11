FROM eclipse-temurin:17

WORKDIR /server1.12.2

COPY . .

EXPOSE 25565

CMD ["java", "-Xms512M", "-Xmx1024M", "-jar", "paper.jar", "nogui"]
