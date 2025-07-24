FROM node:20-alpine
WORKDIR /usr/src/app
COPY ./client/package*.json ./
RUN npm install
COPY ./client ./
CMD [ "npm","run","start" ]
