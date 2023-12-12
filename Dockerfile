FROM node:latest

WORKDIR /usr/src/app

COPY /ui/package*.json ./ui/

RUN cd ui && npm install

COPY /ui/ ./ui/

COPY /server/package*.json ./server/

RUN cd server && npm install

COPY /server/ ./server/

EXPOSE 7789
EXPOSE 3000

