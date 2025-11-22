FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código
COPY . .

# Exponer puerto
EXPOSE 3000

# El comando se define en docker-compose.yml
CMD ["npm", "run", "dev"]
