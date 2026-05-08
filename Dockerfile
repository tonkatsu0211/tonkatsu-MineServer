FROM node:20

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "server.js"]

FROM eclipse-temurin:17

RUN echo "debug message!"

COPY . .

WORKDIR /server1.12.2

RUN ls -la

EXPOSE 25565

CMD ["java", "-Xms512M", "-Xmx1024M", "-jar", "paper.jar", "nogui"]
