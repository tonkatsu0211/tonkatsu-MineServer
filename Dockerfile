FROM eclipse-temurin:17

WORKDIR /server

COPY . .

EXPOSE 25565

CMD ["java", "-Xms512M", "-Xmx1024M", "-jar", "paper.jar", "nogui"]
