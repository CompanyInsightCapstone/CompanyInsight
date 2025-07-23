FROM node:18-alpine
WORKDIR /usr/src/app
COPY ./server/package*.json ./
RUN npm install
COPY ./server ./
EXPOSE 3001
EXPOSE 8081
EXPOSE 808
CMD ["npm", "run", "start"]
