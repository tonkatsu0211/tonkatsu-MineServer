FROM eclipse-temurin:17

RUN apt-get update && apt-get install -y nodejs npm

COPY . .
WORKDIR /server1.12.2

RUN echo "require('http').createServer((req,res)=>res.end('OK')).listen(process.env.PORT || 3000,'0.0.0.0')" > health.js

EXPOSE 25565
EXPOSE 3000

CMD sh -c "node health.js & java -Djava.net.preferIPv4Stack=true -Xms512M -Xmx1024M -jar paper.jar nogui"
