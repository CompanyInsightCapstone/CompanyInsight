FROM node:20-alpine
WORKDIR /usr/src/app
COPY ./client/package*.json ./
RUN npm install
COPY ./client ./
EXPOSE 5173
EXPOSE 8081
EXPOSE 3001
CMD [ "npm","run","start" ]
