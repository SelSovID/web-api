FROM node:18
ENV NODE_ENV=development
LABEL  org.opencontainers.image.source = "https://github.com/SelSovID/web-api"
ENV SSI_ROOT_CERT_PATH=root-cert.ssi
EXPOSE 80
WORKDIR /app

COPY package*.json ./
RUN npm install

ENV NODE_ENV=production

COPY . .



RUN npm run build

CMD ["npm", "start"]
