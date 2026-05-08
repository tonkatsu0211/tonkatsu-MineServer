FROM eclipse-temurin:17

COPY . .

RUN ls -la

EXPOSE 25565

CMD ["java", "-Xms512M", "-Xmx1024M", "-jar", "paper.jar", "nogui"]
