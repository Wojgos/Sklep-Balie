
# Używamy obrazu Node.js
FROM node:18-alpine

WORKDIR /app

# Instalujemy zależności
COPY package*.json ./
RUN npm install

# Instalujemy Angular CLI globalnie w kontenerze
RUN npm install -g @angular/cli

COPY . .

# Uruchamiamy serwer deweloperski dostępny z zewnątrz (0.0.0.0)
CMD ["ng", "serve", "--host", "0.0.0.0"]