FROM eclipse-temurin:17

COPY . .

WORKDIR /server1.12.2

EXPOSE 25565

CMD ["java", "-Djava.net.preferIPv4Stack=true", "-Xms512M", "-Xmx1024M", "-jar", "paper.jar", "nogui"]
