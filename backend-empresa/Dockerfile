FROM node:20-alpine

WORKDIR /usr/src/app

# Solo dependencias de producción (nodemon es de desarrollo)
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# No correr como root dentro del contenedor
USER node

EXPOSE 3000

CMD ["npm", "start"]
