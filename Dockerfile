FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npm run prisma:generate

EXPOSE 3000

CMD ["npm", "start"]