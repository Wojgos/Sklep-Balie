FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

RUN npm install -g @angular/cli

COPY . .

CMD ["ng", "serve", "--host", "0.0.0.0", "--disable-host-check", "--poll", "2000"]