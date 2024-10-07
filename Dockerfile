FROM node:14-alpine

WORKDIR /frontend

COPY package.json package-lock.json ./

RUN npm install --productions

COPY . .

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "-c"]
CMD ["exec npm run start:prod"]
