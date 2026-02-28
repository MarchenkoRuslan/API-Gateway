FROM node:20-alpine

WORKDIR /usr/app
COPY . .
RUN npm ci

EXPOSE 4000
CMD ["npm", "run", "prod"]