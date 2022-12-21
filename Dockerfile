FROM node:18
ENV NODE_ENV=development

LABEL  org.opencontainers.image.source = "https://github.com/SelSovID/web-api" 

WORKDIR /app

COPY package*.json ./
RUN npm install

ENV NODE_ENV=production

COPY . .

RUN npm run build

CMD ["npm", "start"]
